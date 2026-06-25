import models
from database import Base, engine
from fastapi import FastAPI
from routers.ai import router as ai_router
from routers.auth import router as auth_router
from routers.documents import router as documents_router
from routers.reports import router as reports_router
from routers.teams import router as teams_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Enterprise AI Workspace API",
    version="1.0.0"
)


@app.get("/")
def home():
    return {"message": "Enterprise AI Workspace API is running"}


@app.get("/health")
def health():
    return {"status": "healthy"}


app.include_router(auth_router)
app.include_router(documents_router)
app.include_router(ai_router)
app.include_router(teams_router)
app.include_router(reports_router)
