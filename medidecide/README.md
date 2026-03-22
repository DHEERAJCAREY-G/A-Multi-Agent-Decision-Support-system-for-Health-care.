# 🏥 MediDecide — Multi-Agent Healthcare Decision Support System

A production-grade AI healthcare consultation system built with a **FastAPI** backend and **Next.js** frontend, powered by a 5-agent pipeline streamed in real time via Server-Sent Events.

---

## Architecture

```
┌─────────────────────────────────┐        ┌──────────────────────────────────┐
│        Next.js Frontend         │        │        FastAPI Backend            │
│  (Vercel / any static host)     │◄──────►│   (Railway / Render / EC2)       │
│                                 │  HTTPS │                                  │
│  app/page.tsx      → Login      │        │  POST /auth/register             │
│  app/dashboard/    → Main app   │        │  POST /auth/login  (JWT)         │
│                                 │        │                                  │
│  components/                    │        │  POST /consult/stream  (SSE) ──► │
│    ChatPanel.tsx   → Chat UI    │        │    1. InteractionAgent           │
│    AgentPipeline   → Live dots  │        │    2. MedicalReasoningAgent      │
│    RiskMeter       → Score bar  │        │    3. RiskAssessmentAgent        │
│                                 │        │    4. MonitoringAgent            │
│  lib/api.ts        → API calls  │        │    5. EscalationAgent            │
│                                 │        │                                  │
└─────────────────────────────────┘        │  GET /consult/history            │
                                           │  GET /dashboard/stats            │
                                           │  DELETE /dashboard/history/{id}  │
                                           └──────────────────────────────────┘
                                                          │
                                                          ▼
                                                   SQLite / Postgres
```

---

## Project Structure

```
medidecide/
├── backend/
│   ├── main.py                  ← FastAPI app entry point
│   ├── requirements.txt
│   ├── .env.example
│   ├── routers/
│   │   ├── auth.py              ← /auth/register, /auth/login
│   │   ├── consult.py           ← /consult/stream (SSE), /consult/history
│   │   └── history.py           ← /dashboard/stats, /dashboard/history/{id}
│   ├── database/
│   │   ├── db.py                ← SQLAlchemy async engine + ORM models
│   │   └── auth.py              ← JWT helpers, get_current_user dependency
│   ├── models/
│   │   └── schemas.py           ← Pydantic request/response schemas
│   └── agents/                  ← YOUR EXISTING agent files (drop in here)
│       ├── interaction_agent.py
│       ├── medical_reasoning_agent.py
│       ├── risk_assessment_agent.py
│       ├── monitoring_agent.py
│       └── escalation_agent.py
│
└── frontend/
    ├── package.json
    ├── tailwind.config.js
    ├── tsconfig.json
    ├── next.config.js
    ├── .env.example
    ├── lib/
    │   └── api.ts               ← Typed API client + SSE stream helper
    ├── components/
    │   ├── ChatPanel.tsx        ← Chat UI with live SSE integration
    │   ├── AgentPipeline.tsx    ← Animated per-agent status tracker
    │   └── RiskMeter.tsx        ← Animated 0–100 risk score bar
    └── app/
        ├── layout.tsx           ← Root layout + DM Sans/Serif fonts
        ├── globals.css
        ├── page.tsx             ← Login / Register page
        └── dashboard/
            └── page.tsx         ← Main dashboard (Chat + History + Stats)
```

---

## Quick Start

### 1. Backend

```bash
cd backend

# Create virtualenv
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy env file and set your SECRET_KEY
cp .env.example .env

# Drop your existing agent files into backend/agents/
# (interaction_agent.py, medical_reasoning_agent.py, etc.)

# Run
uvicorn main:app --reload --port 8000
```

API docs auto-generated at → **http://localhost:8000/docs**

---

### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Set the backend URL
cp .env.example .env.local
# Edit .env.local: NEXT_PUBLIC_API_URL=http://localhost:8000

# Run dev server
npm run dev
```

Open → **http://localhost:3000**

---

## Plugging In Your Agents

Your existing agent classes integrate with **zero changes** — just copy them into `backend/agents/`. The `routers/consult.py` expects this interface:

```python
# PatientInteractionAgent
agent = PatientInteractionAgent()
patient_data = agent.process_input(symptoms: str, age: int)
# Returns: { "symptoms": [...], "age": int }

# MedicalReasoningAgent
agent = MedicalReasoningAgent()
output = agent.reason(symptoms, age, groq_api_key)
# Returns: str (markdown reasoning)

# RiskAssessmentAgent
agent = RiskAssessmentAgent()
risk = agent.assess_risk(reasoning_output, age)
# Returns: str ("Low Risk" | "Medium Risk" | "High Risk" | "Critical")

# MonitoringAgent
agent = MonitoringAgent()
prev = agent.get_last_risk(username)
agent.store_data(username, symptoms, risk_level)

# EscalationAgent
agent = EscalationAgent()
recommendation = agent.decide_escalation(risk_level, previous_risk)
# Returns: str
```

---

## Deployment

### Backend → Railway

```bash
# In backend/
echo "web: uvicorn main:app --host 0.0.0.0 --port $PORT" > Procfile

# Push to GitHub → connect Railway → set env vars:
#   SECRET_KEY, FRONTEND_URL
```

### Frontend → Vercel

```bash
# In frontend/
npx vercel --prod

# Set env var in Vercel dashboard:
#   NEXT_PUBLIC_API_URL = https://your-railway-app.railway.app
```

### Switching to Postgres (production)

In `backend/database/db.py`, change:

```python
# SQLite (dev)
DATABASE_URL = "sqlite+aiosqlite:///./medidecide.db"

# Postgres (prod) — add asyncpg to requirements.txt
DATABASE_URL = "postgresql+asyncpg://user:pass@host/dbname"
```

---

## SSE Event Flow

The `/consult/stream` endpoint emits these events sequentially:

| Event | Payload | When |
|-------|---------|------|
| `agent_start` | `{ agent, label, message }` | Agent begins work |
| `agent_done`  | `{ agent, label, message, payload }` | Agent completes |
| `result`      | Full consultation result | All agents done |
| `error`       | `{ message }` | Any exception |

The frontend's `streamConsultation()` in `lib/api.ts` handles parsing and calls `onEvent` for each one — driving the animated `AgentPipeline` component in real time.

---

## Next Steps (Roadmap)

- [ ] Add patient profile page (allergies, existing conditions, medications)
- [ ] Export consultation PDF report
- [ ] Email escalation alerts for High/Critical risk
- [ ] Switch Groq key to backend `.env` so users don't need their own
- [ ] Add doctor dashboard role with read access to patient records
- [ ] Rate limiting on `/consult/stream` (e.g. 10 req/hour per user)
