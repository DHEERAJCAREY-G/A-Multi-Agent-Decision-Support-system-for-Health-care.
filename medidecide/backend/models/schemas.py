from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ─── Auth ────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str


# ─── Consultation ─────────────────────────────────────────────────────────────

class ConsultRequest(BaseModel):
    symptoms: str = Field(..., min_length=5, description="Patient's described symptoms")
    age: int = Field(..., ge=0, le=120)
    groq_api_key: str

class AgentUpdate(BaseModel):
    """Emitted via SSE for each agent milestone."""
    agent: str
    status: str          # "running" | "done" | "error"
    message: str
    payload: Optional[dict] = None

class ConsultResult(BaseModel):
    risk_level: str
    risk_score: int      # 0–100
    recommendation: str
    reasoning: str
    symptoms: List[str]
    escalate: bool


# ─── History ──────────────────────────────────────────────────────────────────

class HistoryEntry(BaseModel):
    id: int
    timestamp: datetime
    symptoms: str
    risk: str
    risk_score: Optional[int] = None

class DashboardStats(BaseModel):
    total_consultations: int
    last_risk: Optional[str]
    highest_risk: Optional[str]
    avg_risk_score: Optional[float]
    trend: List[dict]    # [{timestamp, risk_score}]
