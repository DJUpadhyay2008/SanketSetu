<!-- SANKET SETU LOGO -->
<p align="center">
  <img src="./frontend/public/favicon.svg" width="64" alt="Sanket Setu Logo" />
</p>

<h1 align="center">🤲 Sanket Setu</h1>
<p align="center"><strong>"Learn ISL. Use ISL. Build an ISL-Ready India."</strong></p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Hackathon%20Prototype-orange?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Phase-10%20Complete-teal?style=for-the-badge&color=14b8a6" />
  <img src="https://img.shields.io/badge/ISL-Accessibility%20Ecosystem-blue?style=for-the-badge" />
</p>

---

## 🎯 Problem Statement

> **Indian Sign Language for All**
> Despite being officially recognised under the RPwD Act, ISL remains absent from most public services, leaving millions of hearing-impaired citizens excluded from healthcare, education, workplaces, and civic systems.

**Sanket Setu** is a national-scale ISL accessibility ecosystem — not just a translator.

---

## 🌐 What Sanket Setu Does

| Module | Purpose |
|---|---|
| **Sanket Learn** | Structured ISL courses by category, with gamification, quizzes, and AI recommendations |
| **Sanket Schemes** | Government scheme discovery with deterministic eligibility matching + AI explanations |
| **Sanket Assist** | QR-based accessible service portals for hospitals, colleges, government offices |
| **ISL-Ready Index** | Transparent institutional scoring (0–100) for ISL accessibility |
| **Sanket Community** | Practice partner matching, verified mentor directory, moderated interactions |
| **Sanket Passport** | Digital ISL credential with verifiable certificate and public QR |
| **Sanket Live** | Modular, real-time ISL recognition interface (CV model-agnostic) |
| **Offline Learning** | Service Worker + IndexedDB for full offline course access and sync |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React/Vite)                  │
│   React + TypeScript + TanStack Query + Tailwind CSS      │
│   Service Worker · IndexedDB · PWA-capable                │
└─────────────┬───────────────────────────────────────────┘
              │ REST API over HTTP (Axios / fetch)
┌─────────────▼───────────────────────────────────────────┐
│                   BACKEND (FastAPI)                        │
│   FastAPI + SQLAlchemy + Pydantic + Uvicorn               │
│   Business Logic · Rule Engine · Gemini AI integration    │
└─────────────┬───────────────────────────────────────────┘
              │ Supabase Client + SQLAlchemy ORM
┌─────────────▼───────────────────────────────────────────┐
│              SUPABASE (PostgreSQL + Auth + Storage)        │
│   PostgreSQL · Email & Password Auth · Supabase Storage   │
│   Row Level Security · Realtime subscriptions             │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, TanStack Query |
| **Styling** | Tailwind CSS v4, Geist Variable font |
| **Routing** | React Router v6 |
| **Icons** | Lucide React |
| **State Management** | TanStack Query + React Context |
| **Backend** | Python 3.12, FastAPI, SQLAlchemy ORM |
| **Database** | Supabase PostgreSQL |
| **Auth** | Supabase Auth (Email & Password) |
| **Storage** | Supabase Storage |
| **AI** | Google Gemini (via `google.genai`) |
| **Offline** | Service Worker, Cache Storage, IndexedDB |
| **Testing** | Python `unittest` + FastAPI `TestClient` |

---

## 🔑 Required Environment Variables

### Backend (`backend/.env`)

```env
# Project
PROJECT_NAME="Sanket Setu API"
ENVIRONMENT="development"

# Supabase
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_KEY=your-supabase-key

# PostgreSQL (Supabase direct URI)
DATABASE_URL=postgresql://postgres:PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres

# JWT
JWT_SECRET=change-this-to-a-secure-random-string

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key
```

### Frontend (`frontend/.env.local`)

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_BASE_URL=http://localhost:8000/api
```

---

## 🗄️ Supabase Setup

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Copy **Project URL** + **anon key** from `Project Settings → API`
3. Go to **Authentication → Providers → Email**
4. Enable Email / Password authentication

---

## 🗃️ Database Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # fill in your values

# Create tables + seed demo data
python seed_db.py
```

---

## 🚀 Running Locally

### Backend

```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
# API docs at: http://localhost:8000/api/docs
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# App at: http://localhost:5173
```

---

## 🧪 Running Tests

```bash
cd backend
source venv/bin/activate

# All test phases
python test_phase7.py    # ISL-Ready Index + Passport
python test_phase8.py    # Community + Mentorship
python test_phase9.py    # Offline Sync + Sanket Live

# Quick combined run
for f in test_phase7.py test_phase8.py test_phase9.py; do python $f; done
```

Expected: **18 tests, 0 failures**

---

## 🎭 Demo Accounts & Data

The seed script (`seed_db.py`) creates:

| Type | Details |
|---|---|
| Courses | 3 courses: Everyday ISL Greetings, Healthcare Vocab, Emergency Signs |
| Lessons | 6+ lessons with quizzes, scenarios, practice prompts |
| Schemes | ADIP Scheme (Central), Viklaang Pension Yojana (Gujarat) |
| Institutions | AIIMS Delhi, Gujarat University, KPGU Vadodara (demo) |
| Users | Created on email registration/login |

> ⚠️ All demo institution names and government scheme references are used for demonstration. Scheme data must be verified at official sources before actual use.

---

## 🎬 5-Minute Hackathon Demo Flow

**Role**: Priya Sharma — a deaf citizen in Vadodara, Gujarat.

| # | Step | Route | What to show |
|---|---|---|---|
| 1 | Email Login | `/` | Click "LOGIN" → enter email/password → sign in |
| 2 | Dashboard | `/` | Personalized greeting, streak, learning card, leaderboard |
| 3 | Start Learning | `/learn` | Healthcare ISL course → click lesson |
| 4 | Complete Lesson | `/learn` | Quiz → scenario → XP awarded |
| 5 | AI Recommendation | `/` | Dashboard updates with recommended next lesson |
| 6 | Find Schemes | `/schemes` | Wizard → ADIP Scheme match → official link |
| 7 | Hospital Assist | `/assist` | Select Hospital → Government Hospital → ISL-ready service portal |
| 8 | View Passport | `/passport` | Updated ISL badges, verifiable QR code |
| 9 | Practice Partner | `/community` | Find partner by interest, send practice request |
| 10 | ISL-Ready Index | `/institution` | AIIMS Delhi 94/100, score breakdown |
| 11 | Offline Mode | `/offline` | Download course, Emergency ISL pack |
| 12 | Sanket Live | `/live` | Enable camera → target sign "Namaste" → get confidence feedback |

---

## 🔒 Security Notes

- **No secrets stored in frontend** — all API keys in backend `.env`
- **Supabase RLS** should be enabled for `user_progress`, `profiles`, `reports` tables in production
- **JWT tokens** from Supabase are validated on every protected route
- **Input validation** via Pydantic models on all endpoints
- **CORS** restricted to `localhost:5173` in development; configure for your deploy URL
- Camera frames in Sanket Live are **not stored or transmitted beyond the local session**

---

## ♿ Accessibility Features

- Skip to main content link (keyboard navigation)
- ARIA labels on all interactive elements
- Focus-visible ring on all focusable elements
- Screen reader-friendly semantic HTML (`<header>`, `<main>`, `<nav>`, `<section>`, `<aside>`)
- High-contrast mode toggle in settings
- Font size scale toggle (Normal / Large / X-Large)
- Reduced motion support via CSS `@media (prefers-reduced-motion)`
- Touch targets ≥ 44px on all buttons
- Emergency ISL pack always available offline

---

## ⚠️ Known Limitations

1. **Sanket Live** — recognition is a modular placeholder. Real CV model (MediaPipe Hands / custom) integration is the next engineering step.
2. **Supabase RLS** — Row Level Security is not yet enabled. Must be configured before production deployment.
3. **ISL Content** — Video assets reference placeholder Supabase storage URLs. Real validated ISLRTC content must be uploaded.
4. **Scheme Data** — Schemes are seeded as demo data. Production requires a verified government data pipeline and regular audits.
5. **Community Messaging** — Full two-way messaging is not implemented; only practice request accept/decline.
6. **Mobile Camera** — Sanket Live has been tested on desktop Chrome. Camera API behaviour varies by mobile browser.

---

## 🗺️ Future Roadmap

- [ ] MediaPipe Hands integration for real ISL recognition
- [ ] Full AI chatbot (Gemini-powered) for scheme eligibility
- [ ] SMS/push notifications via Supabase Realtime
- [ ] Admin dashboard for scheme verification workflow
- [ ] Multi-language support (Hindi, Gujarati, Tamil)
- [ ] ISLRTC API integration for validated sign content
- [ ] State-level scheme data for 10+ states
- [ ] Accessibility audit with WCAG 2.1 AA certification

---

## 📁 Project Structure

```
Sanket Setu/
├── backend/
│   ├── app/
│   │   ├── auth/          # Supabase + Google OAuth
│   │   ├── community/     # Partners, mentors, reports
│   │   ├── institutions/  # ISL-Ready Index + scoring
│   │   ├── isl_live/      # Sanket Live CV contract
│   │   ├── learning/      # Courses, lessons, quizzes
│   │   ├── notifications/ # User notifications
│   │   ├── passport/      # ISL Passport + QR
│   │   ├── schemes/       # Eligibility + schemes DB
│   │   └── users/         # Profile management
│   ├── seed_db.py         # Demo data seeder
│   ├── test_phase7.py     # ISL Index tests
│   ├── test_phase8.py     # Community tests
│   ├── test_phase9.py     # Offline + Live tests
│   ├── .env.example       # Environment variable template
│   └── requirements.txt
├── frontend/
│   ├── public/
│   │   └── sw.js          # Service Worker (offline)
│   └── src/
│       ├── api/           # API client + SW registration
│       ├── components/    # Shared UI system
│       ├── hooks/         # useAuth, useOfflineSync
│       ├── layouts/       # AppShell (sidebar + header)
│       ├── lib/           # Supabase client, IndexedDB
│       └── pages/         # All application pages
└── README.md
```

---

## 👥 Team

Built for the national hackathon challenge:  
**"Indian Sign Language for All"**

> Sanket Setu is a prototype. It does not claim to fully replace professional ISL interpreters or make binding government commitments. All AI-generated content must be verified through official channels.

---

<p align="center">Made with ❤️ for accessibility · ISL-Ready India 🇮🇳</p>
