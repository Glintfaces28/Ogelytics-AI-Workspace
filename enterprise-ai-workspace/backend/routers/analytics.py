from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

import models
from database import get_db
from dependencies import get_current_user

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


def last_seven_days() -> list[date]:
    today = datetime.utcnow().date()
    return [today - timedelta(days=offset) for offset in range(6, -1, -1)]


def build_daily_series(rows, days: list[date], value_name: str):
    counts = {row.day: row.count for row in rows}
    return [
        {
            "date": day.isoformat(),
            value_name: counts.get(day, 0),
        }
        for day in days
    ]


@router.get("")
def get_analytics(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    days = last_seven_days()
    start = datetime.combine(days[0], datetime.min.time())

    uid = current_user.id

    total_documents = (
        db.query(func.count(models.Document.id))
        .filter(models.Document.uploaded_by == uid)
        .scalar() or 0
    )
    total_ai_queries = (
        db.query(func.count(models.AIQuery.id))
        .filter(models.AIQuery.user_id == uid)
        .scalar() or 0
    )
    total_storage_bytes = (
        db.query(func.sum(models.Document.file_size))
        .filter(models.Document.uploaded_by == uid)
        .scalar() or 0
    )

    # Members in teams this user belongs to
    user_team_ids = (
        db.query(models.TeamMember.team_id)
        .filter(models.TeamMember.user_id == uid)
        .subquery()
    )
    total_team_members = (
        db.query(func.count(func.distinct(models.TeamMember.user_id)))
        .filter(models.TeamMember.team_id.in_(user_team_ids))
        .scalar() or 0
    )

    document_rows = (
        db.query(
            func.date(models.Document.uploaded_at).label("day"),
            func.count(models.Document.id).label("count"),
        )
        .filter(
            models.Document.uploaded_by == uid,
            models.Document.uploaded_at >= start,
        )
        .group_by(func.date(models.Document.uploaded_at))
        .all()
    )

    ai_rows = (
        db.query(
            func.date(models.AIQuery.created_at).label("day"),
            func.count(models.AIQuery.id).label("count"),
        )
        .filter(
            models.AIQuery.user_id == uid,
            models.AIQuery.created_at >= start,
        )
        .group_by(func.date(models.AIQuery.created_at))
        .all()
    )

    return {
        "totals": {
            "documents": total_documents,
            "ai_queries": total_ai_queries,
            "storage_bytes": total_storage_bytes,
            "team_members": total_team_members,
        },
        "documents_over_time": build_daily_series(document_rows, days, "documents"),
        "ai_queries_over_time": build_daily_series(ai_rows, days, "ai_queries"),
    }
