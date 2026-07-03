"""
Chat history — CRUD for ChatSession and ChatMessage.
"""
import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc, func
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from dependencies import get_current_user

router = APIRouter(prefix="/chat", tags=["chat-history"])


def _parse_sources(sources_json: str | None) -> list[schemas.DocumentSearchResult] | None:
    if not sources_json:
        return None
    try:
        raw = json.loads(sources_json)
        return [schemas.DocumentSearchResult(**item) for item in raw]
    except Exception:
        return None


@router.get("/sessions", response_model=list[schemas.ChatSessionOut])
def list_sessions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Return all chat sessions for the current user, newest first."""
    sessions = (
        db.query(models.ChatSession)
        .filter(models.ChatSession.user_id == current_user.id)
        .order_by(desc(models.ChatSession.updated_at))
        .all()
    )
    result = []
    for s in sessions:
        count = (
            db.query(func.count(models.ChatMessage.id))
            .filter(models.ChatMessage.session_id == s.id)
            .scalar()
        )
        result.append(schemas.ChatSessionOut(
            id=s.id,
            title=s.title,
            created_at=s.created_at,
            updated_at=s.updated_at,
            message_count=count or 0,
        ))
    return result


@router.get("/sessions/{session_id}", response_model=schemas.ChatSessionDetailOut)
def get_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Return a session with all its messages."""
    session = db.query(models.ChatSession).filter(
        models.ChatSession.id == session_id,
        models.ChatSession.user_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    messages_db = (
        db.query(models.ChatMessage)
        .filter(models.ChatMessage.session_id == session_id)
        .order_by(models.ChatMessage.created_at)
        .all()
    )
    messages_out = [
        schemas.ChatMessageOut(
            id=m.id,
            session_id=m.session_id,
            role=m.role,
            content=m.content,
            sources=_parse_sources(m.sources),
            created_at=m.created_at,
        )
        for m in messages_db
    ]

    count = len(messages_db)
    return schemas.ChatSessionDetailOut(
        id=session.id,
        title=session.title,
        created_at=session.created_at,
        updated_at=session.updated_at,
        message_count=count,
        messages=messages_out,
    )


@router.patch("/sessions/{session_id}", response_model=schemas.ChatSessionOut)
def rename_session(
    session_id: int,
    body: schemas.ChatSessionRename,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Rename a chat session."""
    session = db.query(models.ChatSession).filter(
        models.ChatSession.id == session_id,
        models.ChatSession.user_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.title = body.title
    db.commit()
    db.refresh(session)

    count = (
        db.query(func.count(models.ChatMessage.id))
        .filter(models.ChatMessage.session_id == session.id)
        .scalar()
    )
    return schemas.ChatSessionOut(
        id=session.id,
        title=session.title,
        created_at=session.created_at,
        updated_at=session.updated_at,
        message_count=count or 0,
    )


@router.delete("/sessions/{session_id}", status_code=204)
def delete_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Delete a chat session and all its messages."""
    session = db.query(models.ChatSession).filter(
        models.ChatSession.id == session_id,
        models.ChatSession.user_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    db.query(models.ChatMessage).filter(
        models.ChatMessage.session_id == session_id
    ).delete()
    db.delete(session)
    db.commit()
