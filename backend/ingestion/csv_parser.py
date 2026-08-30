import csv
import uuid
import io
import ipaddress
from datetime import datetime
from backend.database import SessionLocal
from backend.models import Asset, SecurityEvent, BusinessContext

def is_valid_ip(ip_str):
    if not ip_str:
        return False
    try:
        ipaddress.ip_address(ip_str)
        return True
    except ValueError:
        return False

def is_valid_timestamp(ts_str):
    if not ts_str:
        return False
    try:
        # Handle 'Z' suffix for UTC
        if ts_str.endswith('Z'):
            ts_str = ts_str[:-1] + '+00:00'
        datetime.fromisoformat(ts_str)
        return True
    except ValueError:
        return False

def parse_and_ingest_csv(file_content: str, file_type: str):
    db = SessionLocal()
    records_added = 0
    errors = []

    def normalize_header(h):
        return h.strip().lower().replace(' ', '_').replace('-', '_')

    try:
        f = io.StringIO(file_content)
        reader = csv.DictReader(f)
        if reader.fieldnames:
            reader.fieldnames = [normalize_header(h) for h in reader.fieldnames]

        for row_num, row in enumerate(reader, start=2):
            try:
                if file_type == 'events':
                    # --- STRICT VALIDATION ---
                    ts = row.get('timestamp', '')
                    if not is_valid_timestamp(ts):
                        errors.append({"row": row_num, "error": "Invalid timestamp"})
                        continue
                        
                    src_ip = row.get('source_ip', '')
                    if not is_valid_ip(src_ip):
                        errors.append({"row": row_num, "error": "Invalid source_ip"})
                        continue
                        
                    dst_ip = row.get('destination_ip', '')
                    if not is_valid_ip(dst_ip):
                        errors.append({"row": row_num, "error": "Invalid destination_ip"})
                        continue

                    # --- INGESTION ---
                    event_id = f"CSV-EVT-{uuid.uuid4().hex[:8]}"
                    asset_name = row.get('asset_name') or row.get('hostname') or 'unknown-asset'
                    
                    asset = db.query(Asset).filter(Asset.name == asset_name).first()
                    if not asset:
                        asset = Asset(id=f"ASSET-CSV-{uuid.uuid4().hex[:8]}", name=asset_name, asset_type="Server", discovery_source="csv_upload")
                        db.add(asset)
                        db.flush()

                    # Parse timestamp for DB
                    if ts.endswith('Z'):
                        ts = ts[:-1] + '+00:00'
                    valid_ts = datetime.fromisoformat(ts)

                    event = SecurityEvent(
                        id=event_id, source="csv_upload", timestamp=valid_ts,
                        event_type=row.get('event_type') or row.get('rule_name') or 'unknown_event',
                        severity=row.get('severity') or 'Medium',
                        source_ip=src_ip,
                        destination_ip=dst_ip,
                        asset_id=asset.id, username=row.get('username') or 'system',
                        action=row.get('action') or 'unknown', result=row.get('result') or 'unknown',
                        raw_event=row
                    )
                    db.add(event)
                    records_added += 1

                elif file_type == 'assets':
                    asset_id = f"ASSET-CSV-{uuid.uuid4().hex[:8]}"
                    asset = Asset(
                        id=asset_id, name=row.get('name') or row.get('hostname') or 'unknown',
                        ip_address=row.get('ip_address') or row.get('ip'),
                        asset_type=row.get('asset_type') or 'Server',
                        environment=row.get('environment') or 'production',
                        internet_exposed=str(row.get('internet_exposed', 'false')).lower() == 'true',
                        discovery_source="csv_upload"
                    )
                    db.add(asset)
                    if row.get('criticality'):
                        db.add(BusinessContext(
                            id=str(uuid.uuid4()), asset_id=asset_id,
                            asset_criticality=row.get('criticality').capitalize(),
                            business_function=row.get('business_function') or 'Unknown',
                            data_sensitivity=row.get('data_sensitivity') or 'Internal'
                        ))
                    records_added += 1
            except Exception as e:
                errors.append({"row": row_num, "error": str(e)})
                continue

        db.commit()
        return {"success": True, "records_added": records_added, "errors": errors}
    except Exception as e:
        db.rollback()
        return {"success": False, "error": str(e)}
    finally:
        db.close()
