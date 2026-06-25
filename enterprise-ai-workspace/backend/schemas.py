from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class UserCreate(BaseModel):
    username: str
    email: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class DocumentSearchResult(BaseModel):
    document_id: int
    filename: str
    score: int
    passage: str


class SearchResponse(BaseModel):
    query: str
    results: list[DocumentSearchResult]


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1)
    document_id: int | None = None
    max_results: int = Field(default=5, ge=1, le=20)


class ChatResponse(BaseModel):
    question: str
    answer: str
    sources: list[DocumentSearchResult]


class TeamCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = None


class TeamOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None
    owner_id: int
    created_at: datetime


class TeamMemberAdd(BaseModel):
    user_id: int
    role: Literal["admin", "member"] = "member"


class TeamMemberOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    role: str
    joined_at: datetime


class WorkspaceSummary(BaseModel):
    total_documents: int
    total_users: int
    total_teams: int
    total_storage_bytes: int
    recent_uploads_7_days: int


class UserUploadStats(BaseModel):
    username: str
    document_count: int
