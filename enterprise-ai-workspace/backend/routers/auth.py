from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from services.auth import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register")
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
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

    token = create_access_token({"sub": user.email, "user_id": user.id})
    return {"access_token": token, "token_type": "bearer"}
