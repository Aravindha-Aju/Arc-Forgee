from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Asset

router = APIRouter()

@router.get("/assets")
def get_assets(db: Session = Depends(get_db)):
    return db.query(Asset).all()

@router.get("/assets/{asset_id}")
def get_asset(asset_id: str, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset

