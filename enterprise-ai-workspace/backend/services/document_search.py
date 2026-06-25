import re
from pathlib import Path

import models
from services.pdf_reader import read_pdf


def _tokenize(text: str) -> list[str]:
    return re.findall(r"[a-zA-Z0-9]+", text.lower())


def _split_passages(text: str, max_words: int = 90) -> list[str]:
    paragraphs = [paragraph.strip() for paragraph in text.split("\n") if paragraph.strip()]
    passages = []

    for paragraph in paragraphs:
        words = paragraph.split()
        for start in range(0, len(words), max_words):
            passage = " ".join(words[start : start + max_words]).strip()
            if passage:
                passages.append(passage)

    return passages


def _score_passage(query_tokens: set[str], passage: str) -> int:
    passage_tokens = _tokenize(passage)
    return sum(1 for token in passage_tokens if token in query_tokens)


def _is_pdf_document(document: models.Document) -> bool:
    return document.content_type == "application/pdf" or document.filename.lower().endswith(".pdf")


def search_documents(db, query: str, limit: int = 5, document_id: int | None = None) -> list[dict]:
    query_tokens = set(_tokenize(query))
    if not query_tokens:
        return []

    documents_query = db.query(models.Document)
    if document_id is not None:
        documents_query = documents_query.filter(models.Document.id == document_id)

    results = []
    for document in documents_query.all():
        if not _is_pdf_document(document):
            continue

        file_path = Path(document.file_path)
        if not file_path.exists():
            continue

        text = read_pdf(str(file_path))
        for passage in _split_passages(text):
            score = _score_passage(query_tokens, passage)
            if score > 0:
                results.append(
                    {
                        "document_id": document.id,
                        "filename": document.filename,
                        "score": score,
                        "passage": passage,
                    }
                )

    results.sort(key=lambda result: result["score"], reverse=True)
    return results[:limit]


def build_document_answer(query: str, results: list[dict]) -> str:
    if not results:
        return "I could not find a relevant answer in the uploaded PDF documents."

    best_passage = results[0]["passage"]
    filename = results[0]["filename"]
    return f"Based on {filename}, the most relevant information I found is: {best_passage}"
