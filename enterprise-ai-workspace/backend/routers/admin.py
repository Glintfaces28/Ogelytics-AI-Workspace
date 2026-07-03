"""
Admin-only endpoints.
All routes require the current user to have is_admin=True.
"""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

import models
from database import get_db
from dependencies import get_current_user

router = APIRouter(prefix="/admin", tags=["admin"])


# ── Admin guard ───────────────────────────────────────────────────────────────

def require_admin(current_user: models.User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


# ── Schemas ───────────────────────────────────────────────────────────────────

class UserAdminOut(BaseModel):
    id: int
    username: str
    email: str
    is_active: bool
    is_admin: bool
    created_at: datetime
    document_count: int


class DocumentAdminOut(BaseModel):
    id: int
    filename: str
    file_size: int
    uploaded_at: datetime
    uploaded_by: int
    owner_username: str
    owner_email: str


class AdminStats(BaseModel):
    total_users: int
    active_users: int
    total_documents: int
    total_storage_bytes: int
    total_ai_queries: int
    total_chat_sessions: int


class UserPatch(BaseModel):
    is_active: bool | None = None
    is_admin: bool | None = None


class SubscriptionPatch(BaseModel):
    stripe_customer_id: str | None = None
    stripe_subscription_id: str | None = None
    subscription_plan: str | None = None   # free | pro | enterprise
    subscription_status: str | None = None  # active | canceled | past_due


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/stats", response_model=AdminStats)
def get_stats(db: Session = Depends(get_db), _: models.User = Depends(require_admin)):
    total_users = db.query(func.count(models.User.id)).scalar()
    active_users = db.query(func.count(models.User.id)).filter(models.User.is_active == True).scalar()
    total_documents = db.query(func.count(models.Document.id)).scalar()
    total_storage = db.query(func.sum(models.Document.file_size)).scalar() or 0
    total_queries = db.query(func.count(models.AIQuery.id)).scalar()
    total_sessions = db.query(func.count(models.ChatSession.id)).scalar()

    return AdminStats(
        total_users=total_users,
        active_users=active_users,
        total_documents=total_documents,
        total_storage_bytes=total_storage,
        total_ai_queries=total_queries,
        total_chat_sessions=total_sessions,
    )


@router.get("/users", response_model=list[UserAdminOut])
def list_users(db: Session = Depends(get_db), _: models.User = Depends(require_admin)):
    users = db.query(models.User).order_by(models.User.created_at).all()
    result = []
    for u in users:
        doc_count = (
            db.query(func.count(models.Document.id))
            .filter(models.Document.uploaded_by == u.id)
            .scalar()
        )
        result.append(UserAdminOut(
            id=u.id,
            username=u.username,
            email=u.email,
            is_active=u.is_active,
            is_admin=u.is_admin,
            created_at=u.created_at,
            document_count=doc_count or 0,
        ))
    return result


@router.patch("/users/{user_id}", response_model=UserAdminOut)
def update_user(
    user_id: int,
    body: UserPatch,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="You cannot modify your own admin status")

    if body.is_active is not None:
        user.is_active = body.is_active
    if body.is_admin is not None:
        user.is_admin = body.is_admin
    db.commit()
    db.refresh(user)

    doc_count = (
        db.query(func.count(models.Document.id))
        .filter(models.Document.uploaded_by == user.id)
        .scalar()
    )
    return UserAdminOut(
        id=user.id, username=user.username, email=user.email,
        is_active=user.is_active, is_admin=user.is_admin,
        created_at=user.created_at, document_count=doc_count or 0,
    )


@router.patch("/users/{user_id}/subscription")
def update_subscription(
    user_id: int,
    body: SubscriptionPatch,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    """Admin: manually set a user's subscription plan (e.g. after a webhook miss)."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if body.stripe_customer_id is not None:
        user.stripe_customer_id = body.stripe_customer_id
    if body.stripe_subscription_id is not None:
        user.stripe_subscription_id = body.stripe_subscription_id
    if body.subscription_plan is not None:
        user.subscription_plan = body.subscription_plan
    if body.subscription_status is not None:
        user.subscription_status = body.subscription_status
    db.commit()
    return {"user_id": user_id, "plan": user.subscription_plan, "status": user.subscription_status}


@router.delete("/users/{user_id}", status_code=204)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="You cannot delete yourself")

    # Delete related data
    doc_ids = [d.id for d in db.query(models.Document.id).filter(models.Document.uploaded_by == user_id).all()]
    if doc_ids:
        db.query(models.Document).filter(models.Document.id.in_(doc_ids)).delete()
    db.query(models.AIQuery).filter(models.AIQuery.user_id == user_id).delete()
    db.query(models.TeamMember).filter(models.TeamMember.user_id == user_id).delete()

    session_ids = [s.id for s in db.query(models.ChatSession.id).filter(models.ChatSession.user_id == user_id).all()]
    if session_ids:
        db.query(models.ChatMessage).filter(models.ChatMessage.session_id.in_(session_ids)).delete()
        db.query(models.ChatSession).filter(models.ChatSession.id.in_(session_ids)).delete()

    db.delete(user)
    db.commit()


@router.get("/documents", response_model=list[DocumentAdminOut])
def list_all_documents(db: Session = Depends(get_db), _: models.User = Depends(require_admin)):
    docs = db.query(models.Document).order_by(models.Document.uploaded_at.desc()).all()
    result = []
    for d in docs:
        owner = db.query(models.User).filter(models.User.id == d.uploaded_by).first()
        result.append(DocumentAdminOut(
            id=d.id,
            filename=d.filename,
            file_size=d.file_size,
            uploaded_at=d.uploaded_at,
            uploaded_by=d.uploaded_by or 0,
            owner_username=owner.username if owner else "Unknown",
            owner_email=owner.email if owner else "",
        ))
    return result
