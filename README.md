# Enterprise AI Workspace API

A cloud-ready backend API for businesses to upload documents, search company knowledge with AI, manage teams, and generate workspace analytics.

Built with **Python**, **FastAPI**, **PostgreSQL**, **Docker**, and deployed on **AWS EC2 + RDS**.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | Python 3.13 |
| Framework | FastAPI |
| Database | PostgreSQL (SQLAlchemy ORM) |
| Authentication | JWT (JSON Web Tokens) + bcrypt |
| PDF Processing | pypdf |
| Containerisation | Docker + Docker Compose |
| Cloud | AWS EC2 + RDS |

---

## Features

- **User Authentication** — register, login, JWT-protected endpoints
- **Document Management** — upload, list, download, extract PDF text, delete
- **AI Document Search** — keyword-ranked passage search across uploaded PDFs
- **AI Document Chat** — ask questions, receive answers grounded in document content
- **Team Management** — create teams, add/remove members with admin or member roles
- **Workspace Analytics** — total documents, users, teams, storage, and per-user upload counts
- **Docker** — fully containerised, runs locally with `docker compose up`
- **AWS Deployment** — EC2 setup scripts and production compose file for RDS-backed deployment

---

## Project Structure

```
enterprise-ai-workspace/
└── backend/
    ├── main.py                   # FastAPI app entry point
    ├── database.py               # SQLAlchemy engine and session
    ├── models.py                 # Database models (User, Document, Team, TeamMember)
    ├── schemas.py                # Pydantic request/response schemas
    ├── dependencies.py           # Reusable FastAPI dependencies (get_current_user)
    ├── routers/
    │   ├── auth.py               # POST /auth/register, POST /auth/login
    │   ├── documents.py          # Document upload, download, content, delete
    │   ├── ai.py                 # GET /ai/search, POST /ai/chat
    │   ├── teams.py              # Team CRUD and membership management
    │   └── reports.py            # GET /reports/summary, GET /reports/documents/by-user
    ├── services/
    │   ├── auth.py               # Password hashing, JWT creation/decoding
    │   ├── pdf_reader.py         # PDF text extraction
    │   └── document_search.py    # Passage ranking and answer generation
    ├── Dockerfile
    ├── docker-compose.yml        # Local development (backend + PostgreSQL)
    ├── docker-compose.prod.yml   # Production (backend only, connects to RDS)
    ├── .env.example              # Environment variable template
    ├── requirements.txt
    └── aws/
        ├── ec2-setup.sh          # Bootstrap a fresh EC2 instance
        └── deploy.sh             # Pull latest code and restart container
```

---

## Running Locally

### Prerequisites

- Python 3.13
- PostgreSQL running locally

### Setup

```bash
cd enterprise-ai-workspace/backend

python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

pip install -r requirements.txt

cp .env.example .env
# Edit .env with your local PostgreSQL credentials

uvicorn main:app --reload
```

API docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## Running with Docker

```bash
cd enterprise-ai-workspace/backend

cp .env.example .env
# Edit .env with your credentials

docker compose up --build
```

This starts both the FastAPI backend and a PostgreSQL container.

---

## Deploying to AWS

### Architecture

```
Internet → EC2 (FastAPI on port 8000) → RDS (PostgreSQL)
```

### Steps

1. Create an **RDS PostgreSQL** instance in AWS Console
2. Launch an **EC2** instance (Amazon Linux 2023, t2.micro)
3. Configure Security Groups:
   - EC2: allow port 22 (your IP only) and port 8000 (internet)
   - RDS: allow port 5432 from EC2 security group only
4. SSH into EC2 and run `aws/ec2-setup.sh` once
5. Clone this repository, fill in `.env` with the RDS endpoint
6. Run `aws/deploy.sh`

Full step-by-step instructions are in [LEARNING_LOG.md](LEARNING_LOG.md).

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | No | Health check |
| GET | `/health` | No | Health check |
| POST | `/auth/register` | No | Create user account |
| POST | `/auth/login` | No | Login and receive JWT |
| POST | `/upload` | Yes | Upload a document |
| GET | `/documents` | No | List all documents |
| GET | `/documents/{id}` | No | Get document details |
| GET | `/documents/{id}/download` | No | Download document file |
| GET | `/documents/{id}/content` | No | Extract PDF text |
| DELETE | `/documents/{id}` | Yes | Delete document |
| GET | `/ai/search` | Yes | Search documents by keyword |
| POST | `/ai/chat` | Yes | Ask a question about documents |
| POST | `/teams` | Yes | Create a team |
| GET | `/teams` | Yes | List your teams |
| GET | `/teams/{id}` | Yes | Get team details |
| POST | `/teams/{id}/members` | Yes (admin) | Add a team member |
| DELETE | `/teams/{id}/members/{uid}` | Yes (admin) | Remove a team member |
| DELETE | `/teams/{id}` | Yes (owner) | Delete a team |
| GET | `/reports/summary` | Yes | Workspace statistics |
| GET | `/reports/documents/by-user` | Yes | Per-user upload counts |

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DB_USER` | PostgreSQL username |
| `DB_PASSWORD` | PostgreSQL password |
| `DB_HOST` | Database host (`localhost` or RDS endpoint) |
| `DB_PORT` | Database port (default: 5432) |
| `DB_NAME` | Database name |
| `SECRET_KEY` | Secret key for signing JWT tokens |

---

## Author

Oghale Gladys Eni
