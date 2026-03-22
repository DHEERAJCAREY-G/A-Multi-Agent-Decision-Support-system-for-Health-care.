from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from database.db import get_db, ConsultationRecord, User
from database.auth import get_current_user
from models.schemas import DashboardStats

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

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


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Aggregated stats for the user's health dashboard."""
    base_q = select(ConsultationRecord).where(
        ConsultationRecord.username == current_user.username
    )

    # Total count
    count_result = await db.execute(
        select(func.count()).select_from(ConsultationRecord).where(
            ConsultationRecord.username == current_user.username
        )
    )
    total = count_result.scalar_one()

    # All records for trend + highest risk
    all_result = await db.execute(
        base_q.order_by(ConsultationRecord.timestamp.asc())
    )
    records = all_result.scalars().all()

    last_risk = records[-1].risk if records else None
    highest_risk = None
    highest_score = -1
    scores = []

    for r in records:
        score = r.risk_score or risk_to_score(r.risk)
        scores.append(score)
        if score > highest_score:
            highest_score = score
            highest_risk = r.risk

    avg_score = round(sum(scores) / len(scores), 1) if scores else None

    trend = [
        {
            "timestamp": r.timestamp.isoformat(),
            "risk_score": r.risk_score or risk_to_score(r.risk),
            "risk_label": r.risk,
        }
        for r in records
    ]

    return DashboardStats(
        total_consultations=total,
        last_risk=last_risk,
        highest_risk=highest_risk,
        avg_risk_score=avg_score,
        trend=trend,
    )


@router.delete("/history/{record_id}", status_code=204)
async def delete_record(
    record_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a single history record (must belong to the current user)."""
    result = await db.execute(
        select(ConsultationRecord).where(
            ConsultationRecord.id == record_id,
            ConsultationRecord.username == current_user.username,
        )
    )
    record = result.scalar_one_or_none()
    if record:
        await db.delete(record)
        await db.commit()
