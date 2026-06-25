from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from dependencies import get_current_user
from services.document_search import build_document_answer, search_documents

router = APIRouter(prefix="/ai", tags=["ai"])


@router.get("/search", response_model=schemas.SearchResponse)
def search_company_documents(
    query: str = Query(..., min_length=1),
    limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    results = search_documents(db=db, query=query, limit=limit)
    return {"query": query, "results": results}


@router.post("/chat", response_model=schemas.ChatResponse)
def chat_with_documents(
    request: schemas.ChatRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    results = search_documents(
        db=db,
        query=request.question,
        limit=request.max_results,
        document_id=request.document_id,
    )
    answer = build_document_answer(request.question, results)

    return {
        "question": request.question,
        "answer": answer,
        "sources": results,
    }
