"""
Supabase Storage service.
Files are uploaded once and survive all redeployments.
"""
import io
import logging
import os

import httpx

logger = logging.getLogger(__name__)

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
BUCKET = "documents"


def is_configured() -> bool:
    return bool(SUPABASE_URL and SUPABASE_SERVICE_KEY)


def _headers() -> dict:
    return {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    }


def _ensure_bucket() -> None:
    """Create the bucket if it doesn't exist yet."""
    url = f"{SUPABASE_URL}/storage/v1/bucket"
    resp = httpx.post(
        url,
        headers=_headers(),
        json={"id": BUCKET, "name": BUCKET, "public": True},
        timeout=15,
    )
    if resp.status_code not in (200, 201, 400):  # 400 = already exists
        logger.warning("Bucket creation response: %s %s", resp.status_code, resp.text)


def upload_file(file_bytes: bytes, filename: str, content_type: str) -> str:
    """Upload bytes to Supabase Storage and return the public URL."""
    _ensure_bucket()

    upload_url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{filename}"
    headers = {
        **_headers(),
        "Content-Type": content_type,
        "x-upsert": "true",   # overwrite if same name
    }
    resp = httpx.post(upload_url, headers=headers, content=file_bytes, timeout=60)
    resp.raise_for_status()

    public_url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{filename}"
    logger.info("Uploaded %s → %s", filename, public_url)
    return public_url


def download_file(storage_url: str) -> bytes:
    """Download a file from Supabase Storage by its public URL."""
    resp = httpx.get(storage_url, headers=_headers(), timeout=60)
    resp.raise_for_status()
    return resp.content


def delete_file(filename: str) -> None:
    """Remove a file from Supabase Storage."""
    url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{filename}"
    resp = httpx.delete(url, headers=_headers(), timeout=15)
    if resp.status_code not in (200, 204, 404):
        logger.warning("Delete response: %s %s", resp.status_code, resp.text)
