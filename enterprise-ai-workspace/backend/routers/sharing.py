"""
Document sharing — share documents with other workspace users.
"""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

import models
from database import get_db
from dependencies import get_current_user

router = APIRouter(prefix="/documents", tags=["sharing"])


class ShareRequest(BaseModel):
    email: str


class ShareOut(BaseModel):
    id: int
    document_id: int
    shared_with_email: str
    shared_with_username: str
    created_at: datetime


class SharedDocOut(BaseModel):
    id: int
    filename: str
    file_size: int
    uploaded_at: datetime
    shared_by_username: str
    shared_by_email: str
    share_id: int


# ── Share a document ──────────────────────────────────────────────────────────

@router.post("/{document_id}/share", response_model=ShareOut)
def share_document(
    document_id: int,
    body: ShareRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # Verify ownership
    doc = db.query(models.Document).filter(
        models.Document.id == document_id,
        models.Document.uploaded_by == current_user.id,
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Find target user
    target = db.query(models.User).filter(models.User.email == body.email).first()
    if not target:
        raise HTTPException(status_code=404, detail="No user found with that email address")
    if target.id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot share a document with yourself")

    # Check if already shared
    existing = db.query(models.DocumentShare).filter(
        models.DocumentShare.document_id == document_id,
        models.DocumentShare.shared_with == target.id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Document is already shared with this user")

    share = models.DocumentShare(
        document_id=document_id,
        shared_by=current_user.id,
        shared_with=target.id,
    )
    db.add(share)
    db.commit()
    db.refresh(share)

    return ShareOut(
        id=share.id,
        document_id=share.document_id,
        shared_with_email=target.email,
        shared_with_username=target.username,
        created_at=share.created_at,
    )


# ── List shares for a document ────────────────────────────────────────────────

@router.get("/{document_id}/shares", response_model=list[ShareOut])
def list_shares(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    doc = db.query(models.Document).filter(
        models.Document.id == document_id,
        models.Document.uploaded_by == current_user.id,
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    shares = db.query(models.DocumentShare).filter(
        models.DocumentShare.document_id == document_id
    ).all()

    result = []
    for s in shares:
        user = db.query(models.User).filter(models.User.id == s.shared_with).first()
        if user:
            result.append(ShareOut(
                id=s.id,
                document_id=s.document_id,
                shared_with_email=user.email,
                shared_with_username=user.username,
                created_at=s.created_at,
            ))
    return result


# ── Remove a share ────────────────────────────────────────────────────────────

@router.delete("/{document_id}/shares/{share_id}", status_code=204)
def remove_share(
    document_id: int,
    share_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    share = db.query(models.DocumentShare).filter(
        models.DocumentShare.id == share_id,
        models.DocumentShare.document_id == document_id,
    ).first()
    if not share:
        raise HTTPException(status_code=404, detail="Share not found")

    # Only the owner of the document can remove shares
    doc = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not doc or doc.uploaded_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorised")

    db.delete(share)
    db.commit()


# ── Documents shared with me ──────────────────────────────────────────────────

@router.get("/shared-with-me", response_model=list[SharedDocOut])
def shared_with_me(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    shares = db.query(models.DocumentShare).filter(
        models.DocumentShare.shared_with == current_user.id
    ).all()

    result = []
    for s in shares:
        doc = db.query(models.Document).filter(models.Document.id == s.document_id).first()
        owner = db.query(models.User).filter(models.User.id == s.shared_by).first()
        if doc and owner:
            result.append(SharedDocOut(
                id=doc.id,
                filename=doc.filename,
                file_size=doc.file_size,
                uploaded_at=doc.uploaded_at,
                shared_by_username=owner.username,
                shared_by_email=owner.email,
                share_id=s.id,
            ))
    return result
