# Deployment

## Local (no Docker)

```bash
# API: http://localhost:8000/docs  (SQLite file, seeded automatically)
cd backend && python -m venv .venv && . .venv/Scripts/activate   # Windows; use .venv/bin/activate on macOS/Linux
pip install -r requirements-dev.txt
uvicorn app.main:app --reload

# Frontend: http://localhost:5173
cd frontend && cp .env.example .env && npm install && npm run dev
```

## Local with Docker (PostgreSQL)

```bash
docker compose up --build
# frontend http://localhost:5173 · API http://localhost:8000/docs · postgres localhost:5432 (lumora/lumora)
```

## Production: Render (API + PostgreSQL)

1. Push to GitHub. In Render, choose **New → Blueprint**, pick this repository, and Render reads [`render.yaml`](../render.yaml).
2. It creates the **lumora-db** PostgreSQL database and the **lumora-api** web service (root `backend/`). The start command runs `alembic upgrade head && python -m app.seed && uvicorn ...`.
3. Edit `CORS_ORIGINS` and `FRONTEND_URL` to your Vercel URL, then fill in the variables marked `sync: false`:
   - (optional) add `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` to send real emails. Without SMTP, `DEMO_MODE=true` returns the tokens in the API.
   - `FIRST_ADMIN_PASSWORD`: change it from the default.
4. Check that `https://<api>.onrender.com/health` returns `{"status":"ok","database":"postgresql"}`.

## Production: Vercel (frontend)

1. Choose **Add New → Project**, import the repository and set **Root Directory** to `frontend`. Vite is detected (build `npm run build`, output `dist`).
2. Set the environment variables `VITE_API_BASE_URL=https://<api>.onrender.com` and `VITE_USE_MOCK_DATA=false`.
3. Deploy. `frontend/vercel.json` rewrites every route to `index.html` so deep links work.

## Environment variables (backend)

| Variable | Default | Notes |
| --- | --- | --- |
| DATABASE_URL | sqlite:///./lumora.db | `postgres://` URLs from Render are normalised automatically |
| SECRET_KEY | dev value | **must** be set in production (Render generates one) |
| ACCESS_TOKEN_EXPIRE_MINUTES | 10080 (7 days) | JWT lifetime |
| CORS_ORIGINS | http://localhost:5173 | comma-separated |
| FRONTEND_URL | http://localhost:5173 | used in email links |
| DEMO_MODE | true | return one-time tokens when no SMTP is configured |
| SMTP_HOST / PORT / USER / PASSWORD / FROM | – | real email delivery |
| AUTH_RATE_LIMIT_PER_MINUTE | 20 | 0 disables |
| AUTO_CREATE_TABLES | true | false when Alembic manages the schema |
| SEED_ON_STARTUP | true | idempotent catalogue + demo users |
| FIRST_ADMIN_EMAIL / FIRST_ADMIN_PASSWORD | admin@lumora.app / Admin@2026 | change in production |

## Backups (NFR-019)

Render PostgreSQL (paid plans) takes daily snapshots automatically. On the free plan, run `pg_dump $DATABASE_URL > backup.sql` from a scheduled job.
