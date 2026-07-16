import logging
import re
from pathlib import Path

import models
from services.pdf_reader import read_pdf, read_pdf_from_bytes

logger = logging.getLogger(__name__)

STOPWORDS = {
    "a", "about", "all", "am", "an", "and", "anything", "are", "auf",
    "bitte", "can", "der", "die", "das", "document", "documents", "ein",
    "eine", "for", "from", "is", "it", "me", "mir", "of", "please",
    "sage", "say", "tell", "the", "this", "to", "und", "was", "what",
    "with", "you",
}

# Broad/overview queries — treat as summarise-all
OVERVIEW_PHRASES = {
    "topics", "topic", "summary", "summarize", "summarise", "overview",
    "covered", "about", "contain", "contents", "content", "cover", "describe",
    "learn", "learning", "expect", "achieve", "study", "chapters", "chapter",
    "teaches", "teach", "cover", "structured", "curriculum",
    "themen", "inhalt", "zusammenfassung", "überblick", "lernen", "lerne",  # German
    "sujets", "résumé", "contenu", "aperçu",                                 # French
}


def _tokenize(text: str) -> list[str]:
    return re.findall(r"[a-zA-Z0-9]+", text.lower())


def _query_tokens(text: str) -> set[str]:
    return {token for token in _tokenize(text) if token not in STOPWORDS and len(token) > 2}


def _is_overview_query(query_tokens: set[str]) -> bool:
    """Return True when the query is asking for a broad summary rather than a specific fact."""
    if len(query_tokens) <= 2:
        return True
    overview_hits = query_tokens & OVERVIEW_PHRASES
    return len(overview_hits) >= 1


def _split_passages(text: str, max_words: int = 90) -> list[str]:
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    paragraphs = []
    current_words = []

    for line in lines:
        words = line.split()
        if len(words) <= 3 and current_words:
            paragraphs.append(" ".join(current_words))
            current_words = words
            continue
        current_words.extend(words)
        if len(current_words) >= max_words:
            paragraphs.append(" ".join(current_words))
            current_words = []

    if current_words:
        paragraphs.append(" ".join(current_words))

    passages = []
    for paragraph in paragraphs:
        words = paragraph.split()
        for start in range(0, len(words), max_words):
            passage = " ".join(words[start : start + max_words]).strip()
            if passage:
                passages.append(passage)

    return passages


def _is_useful_overview_passage(passage: str) -> bool:
    return len(passage.split()) >= 8


def _score_passage(query_tokens: set[str], passage: str) -> int:
    passage_tokens = _tokenize(passage)
    return sum(1 for token in passage_tokens if token in query_tokens)


def _is_pdf_document(document: models.Document) -> bool:
    return document.content_type == "application/pdf" or document.filename.lower().endswith(".pdf")


def _document_passages(document: models.Document) -> list[str]:
    # 1. Use cached text (extracted once at upload — zero memory spike, zero download)
    if getattr(document, "text_content", None):
        return _split_passages(document.text_content)

    # 2. Try Supabase Storage (permanent cloud storage)
    if getattr(document, "storage_url", None):
        try:
            from services.supabase_storage import download_file
            pdf_bytes = download_file(document.storage_url)
            text = read_pdf_from_bytes(pdf_bytes)
            return _split_passages(text)
        except Exception as exc:
            logger.error("Supabase download failed for %s: %s", document.filename, exc)
            return []

    # 3. Fallback: local filesystem
    file_path = Path(document.file_path)
    if not file_path.exists():
        logger.warning("File not found on disk: %s", document.file_path)
        return []
    text = read_pdf(str(file_path))
    return _split_passages(text)


def _metadata_passage(document: models.Document, passages: list[str]) -> str:
    readable_name = Path(document.filename).stem.replace("_", " ").replace("-", " ")
    extracted_summary = " ".join(passages[:3]).strip()
    if extracted_summary:
        return f"Document title: {readable_name}. Extracted certificate/document text: {extracted_summary}"
    return f"Document title: {readable_name}."


def _overview_results(documents: list[models.Document], limit: int) -> list[dict]:
    """Return passages spread across the document so overview questions get representative context."""
    results = []

    for document in documents:
        if not _is_pdf_document(document):
            continue

        passages = _document_passages(document)
        useful = [p for p in passages if _is_useful_overview_passage(p)]

        if not useful:
            continue

        # Sample up to 10 passages spread evenly across the whole document
        # so we get context from beginning, middle AND end — not just the preface
        n = len(useful)
        sample_count = min(10, n)
        if n <= sample_count:
            sampled = useful
        else:
            step = n / sample_count
            sampled = [useful[int(i * step)] for i in range(sample_count)]

        for passage in sampled:
            results.append({
                "document_id": document.id,
                "filename": document.filename,
                "score": 0,
                "passage": passage,
            })

        if len(results) >= limit:
            break

    return results[:limit]


def _diversified_results(results: list[dict], document_ids: list[int], limit: int) -> list[dict]:
    selected = []
    used_indexes = set()

    for document_id in document_ids:
        for index, result in enumerate(results):
            if index not in used_indexes and result["document_id"] == document_id:
                selected.append(result)
                used_indexes.add(index)
                break
        if len(selected) >= limit:
            return selected

    for index, result in enumerate(results):
        if index not in used_indexes:
            selected.append(result)
        if len(selected) >= limit:
            break

    return selected


def search_documents(
    db,
    query: str,
    limit: int = 5,
    document_id: int | None = None,
    document_ids: list[int] | None = None,
    user_id: int | None = None,
    shared_document_ids: list[int] | None = None,
) -> list[dict]:
    query_tokens = _query_tokens(query)

    from sqlalchemy import or_
    documents_query = db.query(models.Document)

    if document_ids:
        # Explicit filter — only search these (ignore user/shared scope)
        documents_query = documents_query.filter(models.Document.id.in_(document_ids))
    elif document_id is not None:
        documents_query = documents_query.filter(models.Document.id == document_id)
    elif user_id is not None:
        # Own docs + shared docs
        if shared_document_ids:
            documents_query = documents_query.filter(
                or_(
                    models.Document.uploaded_by == user_id,
                    models.Document.id.in_(shared_document_ids),
                )
            )
        else:
            documents_query = documents_query.filter(models.Document.uploaded_by == user_id)

    documents = documents_query.all()
    logger.warning(
        "Document search filter document_ids=%s document_id=%s matched_documents=%s",
        document_ids,
        document_id,
        [d.id for d in documents],
    )

    # Broad/overview questions — skip keyword search and return rich passages
    if not query_tokens or _is_overview_query(query_tokens):
        logger.warning("Overview query detected — returning rich multi-passage overview")
        overview_limit = max(limit, len(documents) * 3)
        return _overview_results(documents, overview_limit)

    results = []
    chunk_stats = {}
    for document in documents:
        if not _is_pdf_document(document):
            continue

        passages = _document_passages(document)
        passages_with_metadata = [_metadata_passage(document, passages), *passages]
        matches_for_document = 0

        for passage in passages_with_metadata:
            score = _score_passage(query_tokens, passage)
            if score > 0:
                matches_for_document += 1
                results.append({
                    "document_id": document.id,
                    "filename": document.filename,
                    "score": score,
                    "passage": passage,
                })
        chunk_stats[document.id] = {
            "filename": document.filename,
            "chunks": len(passages_with_metadata),
            "matching_chunks": matches_for_document,
        }

    logger.warning("Document search chunk stats=%s", chunk_stats)

    results.sort(key=lambda r: r["score"], reverse=True)
    if results:
        if document_ids and len(document_ids) > 1:
            return _diversified_results(results, document_ids, limit)
        return results[:limit]

    # No keyword hits — fall back to rich overview
    logger.warning("No keyword matches — falling back to overview results")
    return _overview_results(documents, max(limit, len(documents) * 3))


def build_document_answer(query: str, results: list[dict]) -> str:
    if not results:
        return (
            "I found no readable text in the uploaded PDF documents. "
            "If the PDF is scanned, it may need OCR before I can search it."
        )

    unique_filenames = []
    for result in results:
        if result["filename"] not in unique_filenames:
            unique_filenames.append(result["filename"])

    if len(unique_filenames) > 1:
        source_list = ", ".join(unique_filenames)
        evidence = " ".join(
            f"{result['filename']}: {result['passage']}"
            for result in results[: min(len(results), 4)]
        )
        return f"Based on {source_list}, the relevant information I found is: {evidence}"

    best_passage = results[0]["passage"]
    filename = results[0]["filename"]
    if results[0]["score"] == 0:
        return f"Based on {filename}, here is the first readable context I found: {best_passage}"

    return f"Based on {filename}, the most relevant information I found is: {best_passage}"
