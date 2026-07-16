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


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6)


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
    document_ids: list[int] | None = None
    max_results: int = Field(default=15, ge=1, le=20)
    session_id: int | None = None


class ChatResponse(BaseModel):
    question: str
    answer: str
    sources: list[DocumentSearchResult]
    session_id: int


class ChatMessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    session_id: int
    role: str
    content: str
    sources: list[DocumentSearchResult] | None = None
    created_at: datetime


class ChatSessionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: int = 0


class ChatSessionDetailOut(ChatSessionOut):
    messages: list[ChatMessageOut] = []


class ChatSessionRename(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)


class TeamCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = None


class TeamOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None
    created_by: int
    created_at: datetime
    member_count: int = 0
    my_role: str | None = None
    is_owner: bool = False


class TeamMemberAdd(BaseModel):
    email: str
    role: Literal["admin", "member"] = "member"


class TeamMemberOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    username: str
    email: str
    role: str
    joined_at: datetime


class TeamDetailOut(TeamOut):
    members: list[TeamMemberOut] = []


class WorkspaceSummary(BaseModel):
    total_documents: int
    total_users: int
    total_teams: int
    total_storage_bytes: int
    recent_uploads_7_days: int


class UserUploadStats(BaseModel):
    username: str
    document_count: int
