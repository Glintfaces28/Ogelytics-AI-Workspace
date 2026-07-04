# Ogelytics AI Workspace

An AI-powered enterprise document analysis platform that lets teams upload documents, ask questions using natural language, and collaborate — all with a subscription billing model.

**Live Demo:** https://ogelytics-frontend.onrender.com  
**API Docs:** https://ogelytics-ai-workspace.onrender.com/docs  
**GitHub:** https://github.com/Glintfaces28/Ogelytics-AI-Workspace

---

## What It Does

Users upload PDFs and documents to their workspace. They can then chat with an AI assistant that reads those documents and answers questions based on the actual content — not general knowledge. Teams can share documents, view analytics, and manage billing plans.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend API | FastAPI (Python) |
| Frontend | React + Tailwind CSS |
| Database | PostgreSQL (Supabase) |
| File Storage | Supabase Storage |
| AI | OpenAI GPT-4o-mini |
| Authentication | JWT (JSON Web Tokens) |
| Email | SendGrid (domain-authenticated) |
| Payments | Stripe (subscription billing) |
| Deployment | Render.com |
| Version Control | Git + GitHub |

---

## Architecture

```
Browser (React)
      │
      │  HTTPS
      ▼
FastAPI Backend  ──── PostgreSQL (Supabase)
      │          ──── Supabase Storage (files)
      │          ──── OpenAI API (AI answers)
      │          ──── SendGrid (emails)
      │          ──── Stripe (billing)
```

The backend follows a **router-per-feature** architecture — each feature (auth, documents, AI, billing, teams, admin) lives in its own router file under `backend/routers/`. A shared `database.py` manages SQLAlchemy sessions, and `dependencies.py` provides reusable auth guards.

---

## Features

### Authentication
- Register / login with email and password
- Passwords hashed with bcrypt
- JWT tokens issued on login, verified on every protected request
- Forgot password flow: time-limited (1 hour) single-use reset tokens sent via email
- Google OAuth login

### Document Management
- Upload PDFs and documents
- Text extracted at upload time and cached in the database
- Files stored permanently in Supabase Storage (survives redeployments)
- Documents can be shared with specific users

### AI Chat
- Ask questions about uploaded documents in natural language
- Backend searches document text for relevant passages, then sends them as context to GPT-4o-mini
- Chat history saved per session — users can return to previous conversations
- Responds in the same language the user writes in (multilingual)
- Export answers as PDF or Word document

### Teams
- Create teams and invite members
- Role-based membership (admin / member)

### Billing (Stripe)
- Three plans: Free ($0), Pro ($19/mo), Enterprise ($49/mo)
- Stripe Checkout for upgrades — no card data touches our servers
- Stripe Customer Portal for managing/cancelling subscriptions
- Webhook handler updates user plan automatically on payment events

### Admin Panel
- View all users and documents
- Activate/deactivate accounts
- Platform analytics (total users, documents, AI queries, storage used)

### Email
- Password reset emails sent from `noreply@ogelytics.com`
- SendGrid DKIM/SPF domain authentication (prevents spam folder)

---

## Folder Structure

```
├── backend/
│   ├── main.py              # FastAPI app, CORS config, router registration
│   ├── database.py          # SQLAlchemy engine, session, migrations
│   ├── models.py            # Database models (User, Document, Chat, Team…)
│   ├── schemas.py           # Pydantic request/response schemas
│   ├── dependencies.py      # JWT auth guard (get_current_user)
│   ├── requirements.txt
│   ├── routers/
│   │   ├── auth.py          # Register, login, forgot/reset password
│   │   ├── documents.py     # Upload, list, download, delete
│   │   ├── ai.py            # AI search, chat endpoint
│   │   ├── chat_history.py  # Chat sessions and messages
│   │   ├── billing.py       # Stripe checkout, portal, webhook
│   │   ├── teams.py         # Create/manage teams
│   │   ├── sharing.py       # Document sharing
│   │   ├── admin.py         # Admin-only endpoints
│   │   ├── analytics.py     # Usage analytics
│   │   ├── reports.py       # Export reports
│   │   └── oauth.py         # Google OAuth
│   └── services/
│       ├── auth.py          # Password hashing, JWT creation
│       ├── email.py         # SendGrid email service
│       ├── openai_answer.py # GPT-4o-mini integration (lazy-loaded)
│       ├── document_search.py # Text search across documents
│       ├── supabase_storage.py # File upload/download
│       └── pdf_reader.py    # PDF text extraction
├── frontend/
│   ├── src/
│   │   ├── pages/           # Login, Register, Dashboard, AiChat, Billing…
│   │   ├── components/      # Shared UI components
│   │   └── api/client.js    # Axios instance with base URL + auth header
│   └── vite.config.js
└── render.yaml              # Render deployment config
```

---

## Database Models

- **User** — id, username, email, hashed_password, is_admin, stripe_customer_id, subscription_plan
- **Document** — id, filename, file_path, storage_url, text_content, uploaded_by
- **ChatSession** — id, user_id, title, created_at
- **ChatMessage** — id, session_id, role (user/assistant), content
- **Team / TeamMember** — team management with roles
- **DocumentShare** — tracks who shared what with whom
- **PasswordResetToken** — one-time tokens with expiry
- **AIQuery** — logs every AI request for analytics

---

## API Endpoints (selected)

```
POST   /auth/register              Create account
POST   /auth/login                 Get JWT token
POST   /auth/forgot-password       Send reset email
POST   /auth/reset-password        Set new password

GET    /documents/                 List user's documents
POST   /documents/upload           Upload file
DELETE /documents/{id}             Delete file

POST   /ai/chat                    AI chat with document context
GET    /ai/search                  Semantic document search
GET    /chat-history/sessions      List chat sessions
GET    /chat-history/sessions/{id} Get messages in a session

POST   /billing/checkout?plan=pro  Create Stripe checkout session
POST   /billing/portal             Open Stripe customer portal
POST   /billing/webhook            Stripe event handler
GET    /billing/status             Current subscription status

GET    /admin/users                List all users (admin only)
GET    /admin/stats                Platform statistics (admin only)
```

---

## Security Practices

- Passwords never stored in plain text — bcrypt hashed
- JWT tokens signed with a secret key, validated on every request
- Password reset tokens are single-use and expire in 1 hour
- Stripe handles all card data — PCI compliant by design
- Environment variables for all secrets (never committed to Git)
- CORS configured to only allow known frontend origins
- Email enumeration protection (forgot-password always returns same response)

---

## Deployment

The app is deployed on **Render.com** (free tier):
- Backend: Python web service at `ogelytics-ai-workspace.onrender.com`
- Frontend: Static site at `ogelytics-frontend.onrender.com`
- Custom domain: `ogelytics.com`

CI/CD: every push to `main` triggers an automatic redeploy on Render.

---

## Running Locally

```bash
# Backend
cd backend
pip install -r requirements.txt
cp .env.example .env   # fill in your keys
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

Required environment variables: `DATABASE_URL`, `SECRET_KEY`, `OPENAI_API_KEY`, `SENDGRID_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `FRONTEND_URL`

---

## Status

This project is actively in development. Current focus: growing to first paying users before upgrading infrastructure.
