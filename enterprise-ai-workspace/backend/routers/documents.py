import logging
import shutil
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

import models
from database import get_db
from dependencies import get_current_user
from services.pdf_reader import read_pdf, read_pdf_from_bytes
from services.supabase_storage import (
    delete_file as supabase_delete,
    download_file as supabase_download,
    is_configured as supabase_configured,
    upload_file as supabase_upload,
)

router = APIRouter()
UPLOAD_DIR = Path("uploads")
logger = logging.getLogger(__name__)


def _extract_text(file_bytes: bytes, content_type: str, filename: str) -> str | None:
    """Extract text from PDF at upload time and cache it. Never crashes the upload."""
    try:
        if content_type == "application/pdf" or filename.lower().endswith(".pdf"):
            return read_pdf_from_bytes(file_bytes)
    except Exception as exc:
        logger.warning("Text extraction failed for %s: %s", filename, exc)
    return None


@router.get("/documents")
def get_documents(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return db.query(models.Document).filter(
        models.Document.uploaded_by == current_user.id
    ).all()


@router.get("/documents/{document_id}")
def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    document = db.query(models.Document).filter(
        models.Document.id == document_id,
        models.Document.uploaded_by == current_user.id,
    ).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document


@router.post("/upload")
def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    file_bytes = file.file.read()
    safe_filename = Path(file.filename).name
    content_type = file.content_type or "application/octet-stream"
    storage_url = None
    file_path = ""

    # Extract text once at upload — cached forever, no re-processing needed
    text_content = _extract_text(file_bytes, content_type, safe_filename)

    if supabase_configured():
        # ✅ Permanent cloud storage — survives all redeployments
        storage_url = supabase_upload(file_bytes, safe_filename, content_type)
        file_path = storage_url
        logger.info("Uploaded %s to Supabase Storage", safe_filename)
    else:
        # Fallback: local filesystem
        UPLOAD_DIR.mkdir(exist_ok=True)
        local_path = UPLOAD_DIR / safe_filename
        local_path.write_bytes(file_bytes)
        file_path = str(local_path)
        logger.warning("Supabase not configured — saved %s to local disk (ephemeral!)", safe_filename)

    document = models.Document(
        filename=safe_filename,
        content_type=content_type,
        file_path=file_path,
        file_size=len(file_bytes),
        storage_url=storage_url,
        text_content=text_content,
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
def download_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    document = db.query(models.Document).filter(
        models.Document.id == document_id,
        models.Document.uploaded_by == current_user.id,
    ).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    if document.storage_url:
        file_bytes = supabase_download(document.storage_url)
        from fastapi.responses import Response
        return Response(
            content=file_bytes,
            media_type=document.content_type or "application/octet-stream",
            headers={"Content-Disposition": f'attachment; filename="{document.filename}"'},
        )

    file_path = Path(document.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")
    return FileResponse(path=str(file_path), filename=document.filename,
                        media_type=document.content_type or "application/octet-stream")


@router.get("/documents/{document_id}/content")
def read_document_content(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    document = db.query(models.Document).filter(
        models.Document.id == document_id,
        models.Document.uploaded_by == current_user.id,
    ).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    if document.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Content extraction only supported for PDF files")

    # Use cached text if available
    if document.text_content:
        return {"id": document.id, "filename": document.filename, "content": document.text_content}

    if document.storage_url:
        pdf_bytes = supabase_download(document.storage_url)
        text = read_pdf_from_bytes(pdf_bytes)
    else:
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
    document = db.query(models.Document).filter(
        models.Document.id == document_id,
        models.Document.uploaded_by == current_user.id,
    ).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    if document.storage_url:
        supabase_delete(document.filename)
    else:
        file_path = Path(document.file_path)
        if file_path.exists():
            file_path.unlink()

    db.delete(document)
    db.commit()
    return {"message": f"Document '{document.filename}' deleted successfully"}
