# Arc-Forgee

### AI-Powered Cyber Risk Quantification Platform

Arc-Forgee is a full-stack cybersecurity platform designed to transform raw security events into structured threat intelligence and quantitative risk insights.

The platform combines **AI-assisted threat analysis, MITRE ATT&CK mapping, financial risk quantification, asset dependency analysis, and real-time risk updates** into a unified workflow.

---

## Overview

Traditional security monitoring often produces large volumes of technical alerts without clearly communicating their potential business impact.

Arc-Forgee addresses this gap by connecting security telemetry with risk quantification:

```text
Security Logs
     │
     ▼
Data Validation
     │
     ▼
AI Threat Analysis
     │
     ▼
MITRE ATT&CK Mapping
     │
     ▼
Risk Quantification
     │
     ├── Financial Impact
     ├── Asset Risk
     └── Blast Radius
     │
     ▼
Executive Risk Intelligence
```

---

## Key Capabilities

### AI Threat Intelligence

* CSV-based security event ingestion
* Strict input validation
* AI-assisted threat classification using Google Gemini
* MITRE ATT&CK mapping
* Confidence scoring
* Plain-language executive briefings
* Fail-closed behavior for unsupported analysis

### Risk Quantification

* FAIR-lite-inspired financial calculations
* Single Loss Expectancy (SLE)
* Annualized Loss Expectancy (ALE)
* Exposure Factor
* Risk scoring
* Asset-level risk assessment

### Asset & Dependency Analysis

* NetworkX-based dependency graphs
* Upstream and downstream dependency analysis
* Blast-radius calculation
* Interactive asset topology using React Flow

### Risk Operations

* Historical risk trends
* Portfolio-level risk analysis
* Comparative benchmarking
* CSV / JSON / PDF export
* Mitigation what-if simulation
* Real-time WebSocket updates

---

## Architecture

Arc-Forgee is structured around two interconnected components.

### Block 1 — AI Intelligence Engine

Responsible for processing security telemetry and generating structured threat intelligence.

**Backend**

* Python
* FastAPI
* SQLAlchemy
* Pydantic
* Google Gemini
* HTTPX

**Frontend**

* Next.js
* React
* TypeScript
* Tailwind CSS

### Block 2 — Risk Quantification Engine

Responsible for translating threat intelligence into measurable organizational risk.

**Backend**

* Python
* FastAPI
* SQLAlchemy
* NetworkX
* WebSockets

**Frontend**

* Next.js
* React
* TypeScript
* React Flow
* Recharts

### Integration

```text
┌─────────────────────────────┐
│       BLOCK 1               │
│   AI Intelligence Engine    │
│                             │
│ Logs → Analysis → Threats   │
└──────────────┬──────────────┘
               │
          HTTP / WebSocket
               │
               ▼
┌─────────────────────────────┐
│       BLOCK 2               │
│ Risk Quantification Engine  │
│                             │
│ Threats → Risk → Finance    │
└─────────────────────────────┘
```

---

## Risk Model

Arc-Forgee currently implements a FAIR-lite-inspired quantitative model.

### Financial Risk

```text
SLE = Asset Value × Exposure Factor

ARO = Threat Likelihood × 12

ALE = SLE × ARO
```

Where:

* **SLE** — Single Loss Expectancy
* **ARO** — Annualized Rate of Occurrence
* **ALE** — Annualized Loss Expectancy

### Risk Score

```text
Base Score =
    (Threat Likelihood × 40)
    +
    (Normalized ALE × 60)

Final Score =
    Base Score × Blast Radius Multiplier
```

The current model is intended as a practical prototype implementation and should not be interpreted as a complete implementation of the FAIR standard.

---

## Project Structure

```text
Arc-Forgee/
│
├── backend/
│   ├── api/
│   │   ├── upload.py
│   │   └── dashboard.py
│   ├── ai/
│   │   └── gemini/
│   │       ├── service.py
│   │       └── schemas.py
│   ├── ingestion/
│   │   └── csv_parser.py
│   ├── integration/
│   │   └── block2_client.py
│   ├── database.py
│   ├── main.py
│   └── models.py
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── upload/
│   │   ├── engine/
│   │   └── risk/
│   └── globals.css
│
├── risk_engine/
│   ├── backend/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── engine.py
│   │   ├── enhanced.py
│   │   ├── integration.py
│   │   └── seed.py
│   │
│   └── frontend/
│       ├── app/
│       ├── components/
│       │   └── enhanced/
│       └── globals.css
│
├── requirements.txt
├── docker-compose.yml
└── README.md
```

---

## Requirements

* Python 3.10+
* Node.js 18+
* npm 9+
* Git
* Approximately 2 GB free disk space

The development environment uses the following ports:

| Service          | Port |
| ---------------- | ---: |
| Block 1 Frontend | 3000 |
| Block 2 Frontend | 3001 |
| Block 1 Backend  | 8000 |
| Block 2 Backend  | 8001 |

---

## Installation

### Clone the Repository

```bash
git clone https://github.com/Aravindha-Aju/Arc-Forgee.git
cd Arc-Forgee
```

### Configure Block 1

```bash
cp .env.example .env
```

Configure the environment:

```env
GEMINI_API_KEY=your_gemini_api_key_here
MOCK_AI=true
DATABASE_URL=sqlite:///./markx.db
```

`MOCK_AI=true` can be used for demonstrations without making external AI API calls.

### Configure Block 2

```bash
cp risk_engine/backend/.env.example risk_engine/backend/.env
```

```env
DATABASE_URL=sqlite:///./risk_engine.db
BLOCK1_URL=http://localhost:8000
```

---

## Running the Platform

Arc-Forgee currently requires four development processes.

### Block 1 Backend

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

uvicorn backend.main:app \
  --reload \
  --host 0.0.0.0 \
  --port 8000
```

### Block 1 Frontend

```bash
cd frontend
npm install
npm run dev
```

Available at:

```text
http://localhost:3000
```

### Block 2 Backend

```bash
cd risk_engine/backend

python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

python3 seed.py

uvicorn main:app \
  --reload \
  --host 0.0.0.0 \
  --port 8001
```

### Block 2 Frontend

```bash
cd risk_engine/frontend

npm install
npm run dev -- -p 3001
```

Available at:

```text
http://localhost:3001
```

---

## Application Routes

| Interface         | Route                   | Purpose                   |
| ----------------- | ----------------------- | ------------------------- |
| Dashboard         | `/`                     | Platform overview         |
| Upload            | `/upload`               | Security log ingestion    |
| AI Engine         | `/engine`               | AI analysis pipeline      |
| Risk Portfolio    | `:3001/`                | Asset risk overview       |
| Asset Details     | `:3001/asset/ASSET-001` | Individual asset analysis |
| Unified Risk View | `/risk`                 | Integrated risk interface |

---

## Example Workflow

A typical workflow consists of:

**1. Ingest**

Upload security event data in CSV format.

**2. Validate**

Validate timestamps, IP addresses, required fields, and record structure.

**3. Analyze**

Process security events through the AI intelligence layer.

**4. Classify**

Generate threat classifications and MITRE ATT&CK mappings.

**5. Quantify**

Calculate financial exposure and risk scores.

**6. Assess Dependencies**

Determine the potential blast radius through asset relationships.

**7. Simulate**

Evaluate potential mitigation scenarios and their effect on risk.

**8. Monitor**

Receive updated risk information through the integrated real-time pipeline.

---

## Technology Stack

### Backend

* Python
* FastAPI
* SQLAlchemy
* NetworkX
* Google Gemini API
* HTTPX
* WebSockets

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* React Flow
* Recharts

### Infrastructure

* SQLite
* Git
* Docker

---

## Testing

Verify that the Risk Engine is available:

```bash
curl http://localhost:8001/api/portfolio
```

Check integration status:

```bash
curl http://localhost:8001/api/risk/integration-status
```

Test an intelligence-to-risk update:

```bash
curl -X POST \
  http://localhost:8001/api/risk/update-from-intel \
  -H "Content-Type: application/json" \
  -d '{
    "asset_id": "ASSET-001",
    "classification": "possible_brute_force",
    "confidence": 0.85
  }'
```

---

## Security Considerations

Arc-Forgee is currently a prototype and should not be considered production-ready without additional security controls.

A production deployment should consider:

* Authentication and authorization
* Role-based access control
* HTTPS/TLS
* Secure secrets management
* API rate limiting
* Audit logging
* Database hardening
* Input sanitization
* AI output verification
* Production database infrastructure

API keys and sensitive configuration values should never be committed to version control.

---

## Roadmap

Potential future improvements include:

* PostgreSQL support
* Authentication and RBAC
* SIEM integrations
* EDR integrations
* Cloud asset discovery
* CVE enrichment
* Real-time event streaming
* Advanced FAIR implementation
* Risk forecasting
* Automated mitigation recommendations
* Multi-tenant architecture
* Kubernetes deployment
* Enterprise audit trails

---

## Contributing

Contributions are welcome.

For major changes, please open an issue before submitting a pull request.

When contributing, include:

* A clear description of the change
* Relevant testing information
* Documentation updates where applicable

---

## License

MIT License.

---

## Author

**Aravindha-Aju**

Arc-Forgee is an engineering prototype exploring the combination of **AI-driven cybersecurity analysis and quantitative cyber risk management**.

---

### Architecture Principle

> **Detect → Analyze → Quantify → Understand → Decide**
