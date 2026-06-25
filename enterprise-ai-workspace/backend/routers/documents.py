import shutil
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

import models
from database import get_db
from dependencies import get_current_user
from services.pdf_reader import read_pdf

router = APIRouter()
UPLOAD_DIR = Path("uploads")


@router.get("/documents")
def get_documents(db: Session = Depends(get_db)):
    return db.query(models.Document).all()


@router.get("/documents/{document_id}")
def get_document(document_id: int, db: Session = Depends(get_db)):
    document = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document


@router.post("/upload")
def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    UPLOAD_DIR.mkdir(exist_ok=True)
    safe_filename = Path(file.filename).name
    file_path = UPLOAD_DIR / safe_filename

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    document = models.Document(
        filename=safe_filename,
        content_type=file.content_type,
        file_path=str(file_path),
        file_size=file_path.stat().st_size,
        uploaded_by=current_user.id,
    )
    db.add(document)
    db.commit()
    db.refresh(document)

    return {
        "id": document.id,
        "filename": document.filename,
        "content_type": document.content_type,
        "file_size": document.file_size,
        "message": "File uploaded successfully",
    }


@router.get("/documents/{document_id}/download")
def download_document(document_id: int, db: Session = Depends(get_db)):
    document = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    file_path = Path(document.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")

    return FileResponse(
        path=str(file_path),
        filename=document.filename,
        media_type=document.content_type or "application/octet-stream",
    )


@router.get("/documents/{document_id}/content")
def read_document_content(document_id: int, db: Session = Depends(get_db)):
    document = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    if document.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Content extraction only supported for PDF files")

    file_path = Path(document.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")

    text = read_pdf(str(file_path))
    return {"id": document.id, "filename": document.filename, "content": text}


@router.delete("/documents/{document_id}")
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    document = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    file_path = Path(document.file_path)
    if file_path.exists():
        file_path.unlink()

    db.delete(document)
    db.commit()

    return {"message": f"Document '{document.filename}' deleted successfully"}
