import asyncio
import json
from typing import AsyncGenerator

from fastapi import APIRouter, Depends, Request
from sse_starlette.sse import EventSourceResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from database.db import get_db, ConsultationRecord, User
from database.auth import get_current_user
from models.schemas import ConsultRequest

# ── Import your existing agent classes ───────────────────────────────────────
# Adjust these imports to match your actual agent module paths
from agents.interaction_agent import PatientInteractionAgent
from agents.medical_reasoning_agent import MedicalReasoningAgent
from agents.risk_assessment_agent import RiskAssessmentAgent
from agents.monitoring_agent import MonitoringAgent
from agents.escalation_agent import EscalationAgent

router = APIRouter(prefix="/consult", tags=["consultation"])

RISK_SCORE_MAP = {
    "low": 20, "low risk": 20,
    "medium": 55, "medium risk": 55,
    "high": 78, "high risk": 78,
    "critical": 95,
}


def risk_to_score(risk_str: str) -> int:
    key = risk_str.lower().strip()
    for k, v in RISK_SCORE_MAP.items():
        if k in key:
            return v
    return 50


def sse_event(event: str, data: dict) -> str:
    """Format a single SSE message."""
    return json.dumps({"event": event, "data": data})


@router.post("/stream")
async def consult_stream(
    payload: ConsultRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Server-Sent Events endpoint.
    Emits one event per agent as the pipeline runs, then a final 'result' event.

    Event shape:  { "event": "<name>", "data": { ... } }

    Events emitted (in order):
      agent_start   – agent has begun
      agent_done    – agent has finished (with its output)
      result        – full final result
      error         – if something fails
    """

    async def pipeline() -> AsyncGenerator[str, None]:
        try:
            # ── 1. Interaction Agent ─────────────────────────────────────────
            yield sse_event("agent_start", {
                "agent": "interaction",
                "label": "Interaction Agent",
                "message": "Parsing symptoms and patient data…",
            })
            await asyncio.sleep(0)   # yield to event loop

            interaction = PatientInteractionAgent()
            patient_data = interaction.process_input(payload.symptoms, payload.age)

            yield sse_event("agent_done", {
                "agent": "interaction",
                "label": "Interaction Agent",
                "message": f"Identified {len(patient_data.get('symptoms', []))} symptom(s)",
                "payload": patient_data,
            })
            await asyncio.sleep(0)

            # ── 2. Medical Reasoning Agent ───────────────────────────────────
            yield sse_event("agent_start", {
                "agent": "reasoning",
                "label": "Medical Reasoning Agent",
                "message": "Querying Groq LLM for differential analysis…",
            })
            await asyncio.sleep(0)

            reasoning = MedicalReasoningAgent()
            # Run the blocking Groq call in a thread so SSE isn't blocked
            reasoning_output = await asyncio.get_event_loop().run_in_executor(
                None,
                reasoning.reason,
                patient_data["symptoms"],
                patient_data["age"],
                payload.groq_api_key,
            )

            yield sse_event("agent_done", {
                "agent": "reasoning",
                "label": "Medical Reasoning Agent",
                "message": "Differential analysis complete",
                "payload": {"reasoning": reasoning_output},
            })
            await asyncio.sleep(0)

            # ── 3. Risk Assessment Agent ─────────────────────────────────────
            yield sse_event("agent_start", {
                "agent": "risk",
                "label": "Risk Assessment Agent",
                "message": "Evaluating severity and risk tier…",
            })
            await asyncio.sleep(0)

            risk_agent = RiskAssessmentAgent()
            risk_level = risk_agent.assess_risk(reasoning_output, patient_data["age"])
            risk_score = risk_to_score(risk_level)

            yield sse_event("agent_done", {
                "agent": "risk",
                "label": "Risk Assessment Agent",
                "message": f"Risk classified as {risk_level}",
                "payload": {"risk_level": risk_level, "risk_score": risk_score},
            })
            await asyncio.sleep(0)

            # ── 4. Monitoring Agent ──────────────────────────────────────────
            yield sse_event("agent_start", {
                "agent": "monitoring",
                "label": "Monitoring Agent",
                "message": "Fetching history and recording consultation…",
            })
            await asyncio.sleep(0)

            monitoring = MonitoringAgent()
            previous_risk = monitoring.get_last_risk(current_user.username)
            monitoring.store_data(current_user.username, patient_data["symptoms"], risk_level)

            # Also persist to our async DB
            record = ConsultationRecord(
                username=current_user.username,
                symptoms=payload.symptoms,
                risk=risk_level,
                risk_score=risk_score,
            )
            db.add(record)
            await db.commit()

            yield sse_event("agent_done", {
                "agent": "monitoring",
                "label": "Monitoring Agent",
                "message": "Consultation recorded to history",
                "payload": {"previous_risk": previous_risk},
            })
            await asyncio.sleep(0)

            # ── 5. Escalation Agent ──────────────────────────────────────────
            yield sse_event("agent_start", {
                "agent": "escalation",
                "label": "Escalation Agent",
                "message": "Making final escalation decision…",
            })
            await asyncio.sleep(0)

            escalation = EscalationAgent()
            recommendation = escalation.decide_escalation(risk_level, previous_risk)
            should_escalate = risk_score >= 70

            yield sse_event("agent_done", {
                "agent": "escalation",
                "label": "Escalation Agent",
                "message": "Escalation decision made",
                "payload": {"recommendation": recommendation, "escalate": should_escalate},
            })
            await asyncio.sleep(0)

            # ── Final Result ─────────────────────────────────────────────────
            yield sse_event("result", {
                "risk_level": risk_level,
                "risk_score": risk_score,
                "recommendation": recommendation,
                "reasoning": reasoning_output,
                "symptoms": patient_data.get("symptoms", []),
                "escalate": should_escalate,
            })

        except Exception as exc:
            yield sse_event("error", {"message": str(exc)})

    return EventSourceResponse(pipeline())


@router.get("/history")
async def get_history(
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Returns the authenticated user's consultation history."""
    result = await db.execute(
        select(ConsultationRecord)
        .where(ConsultationRecord.username == current_user.username)
        .order_by(desc(ConsultationRecord.timestamp))
        .limit(limit)
    )
    records = result.scalars().all()
    return [
        {
            "id": r.id,
            "timestamp": r.timestamp.isoformat(),
            "symptoms": r.symptoms,
            "risk": r.risk,
            "risk_score": r.risk_score,
        }
        for r in records
    ]
