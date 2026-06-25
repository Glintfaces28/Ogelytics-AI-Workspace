from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from models import Document, Team, User
from schemas import UserUploadStats, WorkspaceSummary

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/summary", response_model=WorkspaceSummary)
def get_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total_documents = db.query(func.count(Document.id)).scalar() or 0
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_teams = db.query(func.count(Team.id)).scalar() or 0
    total_storage_bytes = db.query(func.sum(Document.file_size)).scalar() or 0

    week_ago = datetime.utcnow() - timedelta(days=7)
    recent_uploads_7_days = (
        db.query(func.count(Document.id))
        .filter(Document.uploaded_at >= week_ago)
        .scalar() or 0
    )

    return WorkspaceSummary(
        total_documents=total_documents,
        total_users=total_users,
        total_teams=total_teams,
        total_storage_bytes=total_storage_bytes,
        recent_uploads_7_days=recent_uploads_7_days,
    )


@router.get("/documents/by-user", response_model=list[UserUploadStats])
def documents_by_user(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = (
        db.query(User.username, func.count(Document.id).label("document_count"))
        .outerjoin(Document, Document.uploaded_by == User.id)
        .group_by(User.id, User.username)
        .order_by(func.count(Document.id).desc())
        .all()
    )

    return [UserUploadStats(username=row.username, document_count=row.document_count) for row in rows]
