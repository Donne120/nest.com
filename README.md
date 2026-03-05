# Nest Interactive Video Onboarding Platform

Transform passive video watching into an active learning experience. Employees ask questions timestamped directly to video moments. Answers build a permanent, searchable knowledge base for all future hires.

---

## Features

| Feature | Description |
|---|---|
| **Interactive Video Timeline** | Click anywhere on the timeline to ask a question at that exact timestamp |
| **Timeline Markers** | Visual pins on the video scrubber show where Q&A exists |
| **Q&A Sidebar** | Real-time question/answer panel with filter, search, and reply |
| **Admin Dashboard** | Analytics, pending queue, resolution metrics |
| **WebSocket Real-time** | Instant notifications when questions are asked or answered |
| **Module Library** | Progress tracking, completion status per module |
| **Role-based Access** | Employee / Manager / Admin roles |

---

## Quick Start (Development)

### Prerequisites
- Python 3.11+
- Node.js 18+

### Backend
```bash
cd backend
cp .env.example .env
pip install -r requirements.txt
python seed.py          # Seeds demo data
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

### Or run both at once
```bash
chmod +x start-dev.sh
./start-dev.sh
```

---

## Demo Accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@nestonboarding.com | admin123 |
| Manager | manager@nestonboarding.com | manager123 |
| Employee | alice@nestonboarding.com | employee123 |
| Employee | bob@nestonboarding.com | employee123 |

---

## Docker (Production)

```bash
# Copy and configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with production values

docker-compose up -d
```

App runs on port 80. Backend on 8000.

---

## Architecture

```
nest-onboarding/
├── backend/                # FastAPI
│   ├── main.py             # App entry + middleware
│   ├── models.py           # SQLAlchemy ORM models
│   ├── schemas.py          # Pydantic request/response schemas
│   ├── auth.py             # JWT authentication
│   ├── seed.py             # Demo data seeder
│   └── routers/
│       ├── auth.py         # Login, register, /me
│       ├── modules.py      # Module CRUD
│       ├── videos.py       # Video CRUD + timeline markers
│       ├── questions.py    # Question + answer CRUD
│       ├── analytics.py    # Dashboard stats, notifications
│       ├── progress.py     # User progress tracking
│       └── ws.py           # WebSocket connection manager
│
└── frontend/               # React + TypeScript + Vite
    └── src/
        ├── components/
        │   ├── VideoPlayer/ # Custom player + timeline + controls
        │   ├── QA/          # Sidebar, question cards, form
        │   ├── ModuleLibrary/ # Module grid cards
        │   └── UI/          # Button, Badge, Avatar, Skeleton
        ├── pages/
        │   ├── LoginPage
        │   ├── ModulesPage
        │   ├── ModuleDetailPage
        │   ├── VideoPage    # Main video + Q&A view
        │   └── admin/       # Dashboard, Questions, Analytics
        ├── store/           # Zustand (auth, player, UI state)
        ├── api/             # Axios client
        └── hooks/           # WebSocket, query invalidation
```

---

## API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/auth/login` | POST | Login (returns JWT) |
| `/api/auth/register` | POST | Register user |
| `/api/modules` | GET/POST | List or create modules |
| `/api/videos/module/{id}` | GET | Videos in a module |
| `/api/videos/{id}/timeline` | GET | Timeline markers for video |
| `/api/questions` | GET/POST | List or create questions |
| `/api/questions/{id}/answers` | POST | Add answer to question |
| `/api/analytics/dashboard` | GET | Admin stats |
| `/api/analytics/modules` | GET | Per-module analytics |
| `/ws/{user_id}` | WS | Real-time event stream |

---

## Production Checklist

- [ ] Change `SECRET_KEY` in `.env` (min 32 chars, random)
- [ ] Set `CORS_ORIGINS` to your actual domain
- [ ] Switch to PostgreSQL: `DATABASE_URL=postgresql://user:pass@host/db`
- [ ] Configure SSL (Let's Encrypt + nginx)
- [ ] Set up proper video hosting (S3, Cloudflare R2, or Bunny CDN)
- [ ] Configure email notifications (add SMTP settings)
- [ ] Enable rate limiting (nginx or FastAPI middleware)
