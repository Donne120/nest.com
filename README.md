# Nest — Interactive Learning Platform

Transform passive video watching into an active learning experience. Learners ask questions timestamped directly to video moments. AI answers using the actual video transcript. Every answer builds a permanent, searchable knowledge base for the whole community.

**Live:** [nest-com.vercel.app](https://nest-com.vercel.app) · Backend: [nest-com.onrender.com](https://nest-com.onrender.com)

---

## Features

| Feature | Description |
|---|---|
| **Interactive Video Timeline** | Ask questions at exact timestamps — pins appear on the scrubber |
| **AI-Powered Answers** | Groq LLM answers using the video transcript as context |
| **Nest Assistant** | Global AI chat (✨ in navbar) — knows all platform features, multi-turn, streaming |
| **Timestamped Q&A** | Reusable knowledge base — every question/answer persists for future learners |
| **Module Library** | Progress tracking and completion status per module |
| **Onboarding Tour** | 6-step first-login walkthrough for learners and educators |
| **Role-based Access** | Learner / Educator / Admin / Super Admin roles |
| **Payment System** | MoMo/bank transfer proof-of-payment — admin approval flow with email notifications |
| **Real-time Notifications** | WebSocket push for new questions, answers, and approvals |
| **Admin Dashboard** | Analytics, pending queue, resolution metrics, org management |

---

## Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI + SQLAlchemy + PostgreSQL (Supabase) |
| Frontend | React + TypeScript + Vite + Tailwind CSS |
| AI | Groq LLM (transcript-aware Q&A + platform assistant) |
| Storage | Supabase (videos, thumbnails) |
| Email | SendGrid HTTP API |
| Hosting | Render (backend) + Vercel (frontend) |

---

## Quick Start (Development)

### Prerequisites
- Python 3.11+
- Node.js 18+

### Backend
```bash
cd backend
cp .env.example .env
# Set GROQ_API_KEY, DATABASE_URL, SECRET_KEY in .env
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API docs: http://localhost:8000/api/docs

### Frontend
```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:5173

---

## Roles

| Role | Access |
|---|---|
| **Learner** | Watch videos, ask questions, view answers |
| **Educator** | Upload videos, answer questions, manage modules |
| **Admin** | Manage users, approve payments, view analytics |
| **Super Admin** | Full org management |

---

## Architecture

```
nest.com/
├── backend/                # FastAPI
│   ├── main.py             # App entry, middleware, security headers
│   ├── models.py           # SQLAlchemy ORM models
│   ├── schemas.py          # Pydantic request/response schemas
│   ├── auth.py             # JWT authentication (HS256, iat claim)
│   ├── config.py           # Settings — crashes on weak SECRET_KEY in prod
│   └── routers/
│       ├── auth.py         # Login, register, password reset
│       ├── modules.py      # Module CRUD
│       ├── videos.py       # Video CRUD + timeline markers
│       ├── questions.py    # Question + answer CRUD
│       ├── analytics.py    # Dashboard stats, notifications
│       ├── progress.py     # User progress tracking
│       ├── payments.py     # Proof-of-payment submission and approval
│       ├── ai_assist.py    # Transcript Q&A + platform assistant endpoints
│       └── ws.py           # WebSocket connection manager
│
└── frontend/               # React + TypeScript + Vite
    └── src/
        ├── components/
        │   ├── VideoPlayer/   # Custom player + timeline + controls
        │   ├── QA/            # Sidebar, question cards, form
        │   ├── ModuleLibrary/ # Module grid cards
        │   ├── NestAssistant/ # Global AI chat widget
        │   └── UI/            # Button, Badge, Avatar, Skeleton
        ├── pages/
        │   ├── LoginPage
        │   ├── ModulesPage
        │   ├── ModuleDetailPage
        │   ├── VideoPage      # Main video + Q&A view
        │   └── admin/         # Dashboard, Questions, Analytics
        ├── store/             # Zustand (auth, player, UI state)
        ├── api/               # Axios client
        └── hooks/             # WebSocket, query invalidation
```

---

## Key API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/auth/login` | POST | Login (returns JWT) |
| `/api/auth/register` | POST | Register user |
| `/api/modules` | GET/POST | List or create modules |
| `/api/videos/{id}/timeline` | GET | Timeline markers for video |
| `/api/questions` | GET/POST | List or create questions |
| `/api/questions/{id}/answers` | POST | Add answer |
| `/api/ai/ask` | POST | AI answer using video transcript |
| `/api/ai/platform-ask` | POST | Nest Assistant (platform-wide chat) |
| `/api/payments/submit` | POST | Submit proof of payment |
| `/api/payments/{id}/approve` | POST | Approve payment (admin only) |
| `/api/analytics/dashboard` | GET | Admin stats |
| `/ws/{user_id}` | WS | Real-time event stream |

---

## Security

- JWT signed HS256 with `iat` claim — algorithm hardcoded, not env-swappable
- CSP, HSTS (2yr + preload), Permissions-Policy headers
- Rate limiting on all AI, auth, and payment endpoints
- DOMPurify sanitization on all AI-rendered HTML
- API docs disabled in production
- Payment approval restricted to owner/super_admin only

---

## Production Checklist

- [ ] `SECRET_KEY` — strong random value: `python -c "import secrets; print(secrets.token_hex(32))"`
- [ ] `GROQ_API_KEY` — set in Render env vars
- [ ] `CORS_ORIGINS` — set to your actual domain
- [ ] `DATABASE_URL` — PostgreSQL connection string (Supabase)
- [ ] `SENDGRID_API_KEY` + `SENDGRID_FROM` — single sender verified in SendGrid
- [ ] `FRONTEND_URL` — set to Vercel deployment URL
- [ ] Make GitHub repo private (Settings → Danger Zone)
- [ ] Move JWT from localStorage to httpOnly cookies (future hardening)
