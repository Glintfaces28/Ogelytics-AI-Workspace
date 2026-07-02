import io

from pypdf import PdfReader


def read_pdf(file_path: str) -> str:
    reader = PdfReader(file_path)
    return "".join(page.extract_text() or "" for page in reader.pages)


def read_pdf_from_bytes(pdf_bytes: bytes) -> str:
    reader = PdfReader(io.BytesIO(pdf_bytes))
    return "".join(page.extract_text() or "" for page in reader.pages)
