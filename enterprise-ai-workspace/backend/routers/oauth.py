"""
Google OAuth 2.0 login.

Flow:
  1. User clicks "Sign in with Google" → frontend redirects to GET /auth/google
  2. Backend redirects to Google consent screen
  3. Google redirects back to GET /auth/google/callback?code=...
  4. Backend exchanges code → gets email/name → creates/finds user → issues JWT
  5. Backend redirects to FRONTEND_URL/oauth-callback?token=...
  6. Frontend reads token and logs user in
"""
import os
import secrets
import urllib.parse

import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

import models
from database import get_db
from services.auth import create_access_token, hash_password

router = APIRouter(prefix="/auth", tags=["oauth"])

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
BACKEND_URL = os.getenv("BACKEND_URL", "https://ogelytics-ai-workspace.onrender.com").rstrip("/")

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"


def _google_configured() -> bool:
    return bool(GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET)


@router.get("/google")
def google_login():
    """Redirect the user to Google's OAuth consent screen."""
    if not _google_configured():
        raise HTTPException(status_code=503, detail="Google OAuth not configured.")

    redirect_uri = f"{BACKEND_URL}/auth/google/callback"
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "select_account",
    }
    url = f"{GOOGLE_AUTH_URL}?{urllib.parse.urlencode(params)}"
    return RedirectResponse(url=url)


@router.get("/google/callback")
def google_callback(code: str, db: Session = Depends(get_db)):
    """Handle Google's OAuth callback, issue a JWT, and redirect to the frontend."""
    if not _google_configured():
        raise HTTPException(status_code=503, detail="Google OAuth not configured.")

    redirect_uri = f"{BACKEND_URL}/auth/google/callback"

    # 1. Exchange auth code for tokens
    try:
        token_resp = httpx.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
            },
            timeout=15,
        )
        token_resp.raise_for_status()
        access_token = token_resp.json()["access_token"]
    except Exception as exc:
        return RedirectResponse(
            url=f"{FRONTEND_URL}/login?error=google_token_failed"
        )

    # 2. Fetch user info from Google
    try:
        info_resp = httpx.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=15,
        )
        info_resp.raise_for_status()
        info = info_resp.json()
        email = info.get("email")
        name = info.get("name") or email.split("@")[0]
    except Exception:
        return RedirectResponse(
            url=f"{FRONTEND_URL}/login?error=google_userinfo_failed"
        )

    if not email:
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error=no_email")

    # 3. Find or create user
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        # Create a new user — random secure password since they use Google to sign in
        user = models.User(
            username=name,
            email=email,
            hashed_password=hash_password(secrets.token_urlsafe(32)),
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # 4. Issue our own JWT — sub must be email to match get_current_user in dependencies.py
    jwt_token = create_access_token({"sub": user.email})

    # 5. Redirect to frontend with token
    return RedirectResponse(
        url=f"{FRONTEND_URL}/oauth-callback?token={jwt_token}&username={urllib.parse.quote(user.username)}"
    )
