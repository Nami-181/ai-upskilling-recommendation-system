# LUMORA backend (FastAPI + PostgreSQL)

Member 2 (database and API) and Member 3 (`ai_engine/`). Layout adapted from [fastapi/full-stack-fastapi-template](https://github.com/fastapi/full-stack-fastapi-template).

```
app/
  main.py            FastAPI app, CORS, routers, /health
  core/              config (env), db (engine/session), security (bcrypt, JWT, tokens), errors, ratelimit
  models.py          21 SQLAlchemy tables (docs/database.md)
  schemas.py         pydantic request/response models + validation
  api/deps.py        CurrentUser, AdminUser, SessionDep
  api/routes/        auth, profile, catalog, recommendations, progress, admin
  services/          students, paths (store + adapt learning paths), progress analytics, catalogue cache, email
  seed.py            loads ai_engine/data/*.csv + demo/admin users (idempotent)
ai_engine/           pure-Python recommendation engine + datasets + evaluation (docs/ai-engine.md)
alembic/             migrations (0001_initial_schema)
scripts/gen_db_docs.py   regenerates docs/database.md from the models
tests/               pytest: auth, profile/catalogue, recommendations, AI engine
```

## Run

```bash
pip install -r requirements-dev.txt
uvicorn app.main:app --reload              # http://localhost:8000/docs, SQLite + auto-seed
```

PostgreSQL:

```bash
export DATABASE_URL=postgresql+psycopg2://lumora:lumora@localhost:5432/lumora AUTO_CREATE_TABLES=false
alembic upgrade head && python -m app.seed && uvicorn app.main:app
```

Settings are read from environment variables or `.env` (see `.env.example` and [docs/deployment.md](../docs/deployment.md)).

## Test

```bash
pytest --cov=app --cov=ai_engine     # 52 tests, 93% coverage (SQLite temp DB; set DATABASE_URL to use Postgres)
flake8 app ai_engine tests scripts
python -m ai_engine.evaluate         # precision@3 / prerequisite order / level fit on sample profiles
```

## Changing the schema

1. Edit `app/models.py`.
2. Run `alembic revision --autogenerate -m "describe change"`, then review the file in `alembic/versions/`.
3. Run `alembic upgrade head`.
4. Run `python scripts/gen_db_docs.py` to refresh the ER diagram and data dictionary.

CI runs `alembic check`, so a model change without a migration fails the build.
