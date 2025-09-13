# GSOS–TATHAASTU

A neutral operating system for global trade.

## Structure
```
gsos-tathaastu/
├─ backend/   # FastAPI service (Railway)
└─ frontend/  # Next.js app (Vercel)
```

## Backend (FastAPI)
- Entry: `main.py`
- Run locally:
  ```bash
  cd backend
  pip install -r requirements.txt
  uvicorn main:app --reload --port 8000
  ```

## Frontend (Next.js 14)
- Run locally:
  ```bash
  cd frontend
  npm install
  npm run dev
  ```

## Deployment
- **Railway (backend)**: set envs `BACKEND_API_KEY`, `ALLOW_ORIGIN=*`, `OPENAI_API_KEY`.
- **Vercel (frontend)**: set envs
  - `NEXT_PUBLIC_SITE_URL=https://<your-domain>`
  - `MONGO_URI`, `MONGO_DB=gsos`
  - `BACKEND_URL`, `BACKEND_API_KEY`
  - SMTP settings (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, etc.)

## Features
- Readiness Survey (role-based dynamic Qs)
- Auto-email of blueprint + score
- MongoDB persistence
- Marketing pages: Home, How it works, Modules, Contact
- SEO: sitemap + robots.txt