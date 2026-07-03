import os

import models
from database import Base, engine
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.admin import router as admin_router
from routers.ai import router as ai_router
from routers.billing import router as billing_router
from routers.analytics import router as analytics_router
from routers.auth import router as auth_router
from routers.chat_history import router as chat_history_router
from routers.documents import router as documents_router
from routers.oauth import router as oauth_router
from routers.reports import router as reports_router
from routers.sharing import router as sharing_router
from routers.teams import router as teams_router

Base.metadata.create_all(bind=engine)
from database import run_migrations
run_migrations(engine)

app = FastAPI(
    title="Ogelytics AI Workspace API",
    version="1.0.0"
)

# Build allowed origins — localhost for dev, onrender.com for production
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    allowed_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1):\d+|https://.*\.onrender\.com",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {"message": "Ogelytics AI Workspace API is running"}


@app.get("/health")
def health():
    return {"status": "healthy"}


app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(billing_router)
app.include_router(oauth_router)
app.include_router(documents_router)
app.include_router(ai_router)
app.include_router(chat_history_router)
app.include_router(sharing_router)
app.include_router(teams_router)
app.include_router(reports_router)
app.include_router(analytics_router)
