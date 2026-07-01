# Ogelytics AI Workspace

**AI-powered document intelligence for teams**

Ogelytics AI Workspace is a full-stack collaboration platform that helps teams upload business documents, search their knowledge base, and chat with document content using AI. It combines secure authentication, team-based access patterns, document intelligence, and usage analytics in one workspace.

Built by **Oghale Gladys Eni**.

---

## What It Does

Ogelytics AI Workspace turns uploaded documents into searchable team knowledge.

Users can create an account, upload PDF documents, ask questions about those documents, manage team collaboration, reset passwords by email, and view analytics based on real workspace activity. The backend exposes a FastAPI REST API, while the frontend provides a clean React workspace experience for documents, chat, teams, and analytics.

---

## Key Features

- **Upload and chat with documents using AI**<br>
  Upload documents, extract readable content, search document passages, and generate AI-assisted answers grounded in uploaded files.

- **Multilingual support**<br>
  The AI chat can respond in the user's language when OpenAI is configured, making the workspace usable across multilingual teams.

- **Team collaboration**<br>
  Organize users into teams with owner, admin, and member roles for realistic workspace permissions.

- **Analytics dashboard**<br>
  View real usage data such as uploaded documents, team counts, user activity, storage usage, and workspace-level trends.

- **Secure authentication**<br>
  Register and sign in with JWT authentication, bcrypt password hashing, and email-based password reset powered by SendGrid.

---

## Tech Stack

| Area | Technology |
| --- | --- |
| Backend API | FastAPI |
| Frontend | React, TypeScript-ready Vite architecture |
| Database | PostgreSQL |
| Cache / async-ready infrastructure | Redis |
| AI | OpenAI |
| Email delivery | SendGrid |
| Authentication | JWT, bcrypt |
| Document processing | pypdf |
| Containers | Docker, Docker Compose |

---

## Project Structure

```text
.
├── README.md
├── LEARNING_LOG.md
├── PROJECT_NOTES.md
├── Procfile
├── railway.toml
└── enterprise-ai-workspace/
    ├── backend/
    │   ├── main.py
    │   ├── database.py
    │   ├── models.py
    │   ├── schemas.py
    │   ├── dependencies.py
    │   ├── routers/
    │   │   ├── auth.py
    │   │   ├── documents.py
    │   │   ├── ai.py
    │   │   ├── teams.py
    │   │   ├── reports.py
    │   │   └── analytics.py
    │   ├── services/
    │   │   ├── auth.py
    │   │   ├── email.py
    │   │   ├── openai_answer.py
    │   │   ├── pdf_reader.py
    │   │   └── document_search.py
    │   ├── requirements.txt
    │   ├── Dockerfile
    │   └── docker-compose.yml
    └── frontend/
        ├── src/
        ├── package.json
        └── vite.config.js
```

---

## Run Locally

### Prerequisites

Install the following before starting:

- Python 3.13+
- Node.js 20+
- PostgreSQL
- Redis
- Docker Desktop, optional but recommended
- SendGrid API key, optional for password reset email delivery
- OpenAI API key, optional for AI-generated answers

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd Enterprise-AI-Workspace
```

### 2. Configure the Backend

```bash
cd enterprise-ai-workspace/backend
python -m venv venv
```

Activate the virtual environment:

```bash
# Windows PowerShell
.\venv\Scripts\Activate.ps1

# macOS / Linux
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create your environment file:

```bash
cp .env.example .env
```

Update `.env` with your local values:

```env
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_HOST=localhost
DB_PORT=5432
DB_NAME=enterprise_ai_workspace
SECRET_KEY=replace_with_a_secure_secret
SENDGRID_API_KEY=your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=verified_sender@example.com
FRONTEND_URL=http://localhost:5173
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
```

Start the backend:

```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Backend health check:

```text
http://127.0.0.1:8000/health
```

Interactive API docs:

```text
http://127.0.0.1:8000/docs
```

### 3. Configure the Frontend

Open a second terminal:

```bash
cd enterprise-ai-workspace/frontend
npm install
```

Create or update `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
```

Start the frontend:

```bash
npm run dev
```

Open the app:

```text
http://localhost:5173
```

### 4. Run with Docker

From the backend directory:

```bash
cd enterprise-ai-workspace/backend
docker compose up --build
```

Docker Compose starts the backend and supporting services defined for local development.

---

## Core API Areas

| Area | Example Endpoints |
| --- | --- |
| Authentication | `POST /auth/register`, `POST /auth/login`, `POST /auth/forgot-password`, `POST /auth/reset-password` |
| Documents | `POST /upload`, `GET /documents`, `GET /documents/{id}/content`, `DELETE /documents/{id}` |
| AI | `GET /ai/search`, `POST /ai/chat` |
| Teams | `POST /teams`, `GET /teams`, `POST /teams/{id}/members`, `DELETE /teams/{id}` |
| Analytics | `GET /reports/summary`, `GET /reports/documents/by-user` |

---

## Environment Variables

| Variable | Purpose |
| --- | --- |
| `DB_USER` | PostgreSQL username |
| `DB_PASSWORD` | PostgreSQL password |
| `DB_HOST` | PostgreSQL host |
| `DB_PORT` | PostgreSQL port |
| `DB_NAME` | PostgreSQL database name |
| `SECRET_KEY` | JWT signing secret |
| `SENDGRID_API_KEY` | SendGrid key for password reset emails |
| `SENDGRID_FROM_EMAIL` | Verified sender address for outgoing email |
| `FRONTEND_URL` | Frontend base URL used in reset links |
| `OPENAI_API_KEY` | OpenAI key for AI-generated document answers |
| `OPENAI_MODEL` | OpenAI model name used by the AI service |
| `VITE_API_URL` | Frontend API base URL |

---

## Development Notes

- Uploaded files are stored locally during development.
- PostgreSQL stores users, documents, teams, password reset tokens, and analytics data.
- AI chat works with local document search and upgrades to OpenAI-generated answers when `OPENAI_API_KEY` is configured.
- SendGrid password reset email falls back to a development reset link when email delivery is not configured.
- Redis is included in the target stack for cache/session/task infrastructure as the project grows.

---

## Author

**Oghale Gladys Eni**<br>
Builder of Ogelytics AI Workspace
