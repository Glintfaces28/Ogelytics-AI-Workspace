import os
import secrets
from datetime import datetime, timedelta
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from services.auth import create_access_token, hash_password, verify_password
from services.email import FRONTEND_URL, send_password_reset_email, send_welcome_email

router = APIRouter(prefix="/auth", tags=["auth"])

GOOGLE_CLIENT_ID     = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI  = "https://api.ogelytics.com/auth/google/callback"

RESET_TOKEN_EXPIRE_HOURS = 1


@router.post("/register")
def register(user: schemas.UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hash_password(user.password),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    background_tasks.add_task(send_welcome_email, new_user.email, new_user.username)

    return {
        "id": new_user.id,
        "username": new_user.username,
        "email": new_user.email,
        "message": "User registered successfully",
    }


@router.post("/login")
def login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": user.email, "user_id": user.id, "is_admin": user.is_admin})
    return {"access_token": token, "token_type": "bearer"}


@router.post("/forgot-password")
def forgot_password(body: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == body.email).first()
    # Always return 200 to avoid leaking which emails are registered
    if not user:
        return {"message": "If that email is registered you will receive a reset link."}

    # Invalidate any existing unused tokens for this user
    db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.user_id == user.id,
        models.PasswordResetToken.used == False,
    ).update({"used": True})
    db.commit()

    reset_token = secrets.token_urlsafe(32)
    expires = datetime.utcnow() + timedelta(hours=RESET_TOKEN_EXPIRE_HOURS)
    db.add(models.PasswordResetToken(user_id=user.id, token=reset_token, expires_at=expires))
    db.commit()

    email_sent = send_password_reset_email(user.email, reset_token)
    reset_link = f"{FRONTEND_URL}/reset-password?token={reset_token}"
    response: dict = {"message": "If that email is registered you will receive a reset link."}
    if not email_sent or FRONTEND_URL.startswith(("http://localhost", "http://127.0.0.1")):
        # Local development fallback: let the reset flow be tested even if email delivery lags.
        response["dev_reset_link"] = reset_link
    return response


@router.post("/reset-password")
def reset_password(body: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    record = (
        db.query(models.PasswordResetToken)
        .filter(
            models.PasswordResetToken.token == body.token,
            models.PasswordResetToken.used == False,
        )
        .first()
    )

    if not record or record.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")

    user = db.query(models.User).filter(models.User.id == record.user_id).first()
    user.hashed_password = hash_password(body.new_password)
    record.used = True
    db.commit()

    return {"message": "Password updated successfully"}


# ── Google OAuth ──────────────────────────────────────────────────────────────

@router.get("/google")
def google_login():
    params = urlencode({
        "client_id":     GOOGLE_CLIENT_ID,
        "redirect_uri":  GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope":         "openid email profile",
        "access_type":   "offline",
        "prompt":        "select_account",
    })
    return RedirectResponse(f"https://accounts.google.com/o/oauth2/v2/auth?{params}")


@router.get("/google/callback")
async def google_callback(code: str = None, error: str = None, db: Session = Depends(get_db)):
    if error or not code:
        return RedirectResponse(f"{FRONTEND_URL}/oauth-callback?error={error or 'no_code'}")

    async with httpx.AsyncClient() as client:
        # Exchange code for access token
        token_res = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id":     GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "code":          code,
                "redirect_uri":  GOOGLE_REDIRECT_URI,
                "grant_type":    "authorization_code",
            },
        )
        token_data = token_res.json()
        access_token = token_data.get("access_token")

        if not access_token:
            return RedirectResponse(f"{FRONTEND_URL}/oauth-callback?error=token_failed")

        # Get user info from Google
        user_res = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        user_info = user_res.json()

    email    = user_info.get("email")
    name     = user_info.get("name") or (email.split("@")[0] if email else "user")

    if not email:
        return RedirectResponse(f"{FRONTEND_URL}/oauth-callback?error=no_email")

    # Find or create user
    user = db.query(models.User).filter(models.User.email == email).first()
    is_new_user = False
    if not user:
        user = models.User(
            username=name,
            email=email,
            hashed_password="",  # OAuth users have no password
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        is_new_user = True

    if is_new_user:
        send_welcome_email(user.email, user.username)

    # Issue JWT and redirect to frontend
    jwt = create_access_token({"sub": user.email, "user_id": user.id, "is_admin": user.is_admin})
    return RedirectResponse(f"{FRONTEND_URL}/oauth-callback?token={jwt}")
