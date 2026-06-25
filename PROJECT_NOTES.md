Enterprise AI Workspace
Project Vision

Enterprise AI Workspace is a cloud-based AI platform for businesses.

The goal is to provide a single workspace where companies can:

Upload documents
Search company knowledge
Chat with company data using AI
Generate reports
Manage users and teams
Manage tasks
Store files securely
Integrate AI assistants into business workflows

The project will demonstrate:

Python Backend Development
FastAPI
PostgreSQL
AWS Cloud
Docker
Authentication & Security
AI Integration
REST APIs
Software Architecture

This project is intended to:

Strengthen my CV.
Help me obtain a paid Python/AWS job.
Demonstrate real-world software engineering skills.
Potentially become a SaaS business in the future.

Long-Term Modules

Module 1:
Backend Foundation

Module 2:
Database (PostgreSQL)

Module 3:
Authentication (JWT)

Module 4:
Document Upload

Module 5:
AI Document Search & Chat

Status:
Started on 25.06.2026.

Completed:
Added authenticated AI document search and chat API endpoints.
Verified the changed Python files with `py_compile`.

Files created:
`enterprise-ai-workspace/backend/services/document_search.py`

This file searches uploaded PDF document content by splitting extracted text into passages and ranking those passages against the user's query.

`enterprise-ai-workspace/backend/routers/ai.py`

This file exposes `/ai/search` and `/ai/chat` endpoints while keeping AI-related HTTP logic separate from document upload logic.

Files updated:
`enterprise-ai-workspace/backend/schemas.py`

This file now includes Pydantic models for search results and chat requests/responses. Chat requests validate the question and limit how many source passages can be returned.

`enterprise-ai-workspace/backend/main.py`

This file now registers the AI router with the FastAPI app.

Module 6:
Teams & Permissions

Status:
Completed on 25.06.2026.

Completed:
Added Team and TeamMember database models and all team management API endpoints.
Verified the changed Python files with `py_compile`.

Files created:
`enterprise-ai-workspace/backend/routers/teams.py`

This file exposes team management endpoints while keeping team HTTP logic separate from other routers.

Files updated:
`enterprise-ai-workspace/backend/models.py`

This file now includes the `Team` model (name, description, owner) and the `TeamMember` model (team_id, user_id, role).

`enterprise-ai-workspace/backend/schemas.py`

This file now includes Pydantic models for creating teams, returning team data, adding members, and returning member data.

`enterprise-ai-workspace/backend/main.py`

This file now registers the teams router with the FastAPI app.

Module 7:
Reports & Analytics

Status:
Completed on 25.06.2026.

Completed:
Added uploaded_by FK to the Document model, updated the upload endpoint to record the uploader, and added workspace analytics API endpoints.
Verified the changed Python files with `py_compile`.

Files created:
`enterprise-ai-workspace/backend/routers/reports.py`

This file exposes `/reports/summary` and `/reports/documents/by-user` endpoints for workspace analytics.

Files updated:
`enterprise-ai-workspace/backend/models.py`

The `Document` model now has an `uploaded_by` column (FK to `users.id`, nullable) so each document is linked to the user who uploaded it.

`enterprise-ai-workspace/backend/routers/documents.py`

The upload endpoint now stores `uploaded_by=current_user.id` when saving a new document.

`enterprise-ai-workspace/backend/schemas.py`

This file now includes `WorkspaceSummary` and `UserUploadStats` Pydantic models for report responses.

`enterprise-ai-workspace/backend/main.py`

This file now registers the reports router with the FastAPI app.

Module 8:
Docker

Status:
Completed on 25.06.2026.

Completed:
Containerised the FastAPI backend and PostgreSQL database using Docker and Docker Compose.

Files created:
`enterprise-ai-workspace/backend/Dockerfile`

Builds the FastAPI backend image from python:3.13-slim, installs dependencies, copies source code, and starts uvicorn.

`enterprise-ai-workspace/backend/docker-compose.yml`

Defines two services: `db` (PostgreSQL 16) and `backend` (the FastAPI image). The backend waits for the database to pass a healthcheck before starting.

`enterprise-ai-workspace/backend/.dockerignore`

Excludes venv, __pycache__, .env, and the uploads folder from the Docker image.

`enterprise-ai-workspace/backend/.env.example`

A safe placeholder version of .env with no real secrets. Safe to commit to GitHub.

Module 9:
AWS Deployment

Status:
Completed on 25.06.2026.

Completed:
Created all AWS deployment files for running the backend on EC2 with an RDS PostgreSQL database.

Files created:
`enterprise-ai-workspace/backend/docker-compose.prod.yml`

Production compose file. Runs only the backend service — no local database. The database connection points to RDS via the .env file on the EC2 instance.

`enterprise-ai-workspace/backend/aws/ec2-setup.sh`

Bootstrap script to run once on a fresh Amazon Linux 2023 EC2 instance. Installs Docker, Git, and the Docker Compose plugin.

`enterprise-ai-workspace/backend/aws/deploy.sh`

Deployment script. Pulls the latest code from Git, rebuilds the Docker image, and restarts the backend container.

Files updated:
`enterprise-ai-workspace/backend/.dockerignore`

Added `aws/` so the deployment scripts are not baked into the Docker image.

Module 10:
Production Release

Day1--- 23.06.2026:   BACKEND FOUNDATION
Workflow Achieved:-


