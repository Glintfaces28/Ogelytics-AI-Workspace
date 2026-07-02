import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from dependencies import get_current_user
from services.document_search import build_document_answer, search_documents
from services.openai_answer import generate_answer, is_openai_configured

router = APIRouter(prefix="/ai", tags=["ai"])
logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """
Always respond in the same language the user is writing in.
If the user writes in English, respond in English.
If the user writes in German, respond in German.
If the user writes in French, respond in French.
Automatically detect the user's language and match it.
"""


@router.get("/search", response_model=schemas.SearchResponse)
def search_company_documents(
    query: str = Query(..., min_length=1),
    limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    db.add(models.AIQuery(user_id=current_user.id, query_text=query, query_type="search"))
    db.commit()

    results = search_documents(db=db, query=query, limit=limit, user_id=current_user.id)
    return {"query": query, "results": results}


@router.post("/chat", response_model=schemas.ChatResponse)
def chat_with_documents(
    request: schemas.ChatRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    logger.warning(
        "AI chat received document_ids=%s document_id=%s user_id=%s",
        request.document_ids,
        request.document_id,
        current_user.id,
    )
    logger.debug("AI chat system prompt: %s", SYSTEM_PROMPT.strip())

    db.add(models.AIQuery(user_id=current_user.id, query_text=request.question, query_type="chat"))
    db.commit()

    results = search_documents(
        db=db,
        query=request.question,
        limit=request.max_results,
        document_id=request.document_id,
        document_ids=request.document_ids,
        user_id=current_user.id,
    )
    if is_openai_configured():
        try:
            answer = generate_answer(request.question, results)
        except Exception:
            logger.exception("OpenAI answer generation failed; falling back to local answer builder")
            answer = build_document_answer(request.question, results)
    else:
        answer = build_document_answer(request.question, results)

    return {
        "question": request.question,
        "answer": answer,
        "sources": results,
    }
