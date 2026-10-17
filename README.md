# Company Portfolio

Company portfolio site with a Cloudflare-hosted Next.js frontend and a separately hosted FastAPI/PostgreSQL API.

## Repository layout

- `frontend/`: Next.js App Router application using Cloudflare's `vinext` deployment path.
- `backend/`: FastAPI, SQLAlchemy 2.x, PostgreSQL, and Alembic service.

The API runs as a TypeScript Cloudflare Worker (`api/`) on the Workers free plan. It was ported from the FastAPI backend in `backend/`, which remains the reference implementation and migration source, because the Python runtime and Containers need the paid plan for the CPU and hosting this project needs. Cloudflare also serves the public frontend and R2 media storage. The database is Supabase Postgres, reached through Hyperdrive using the Session pooler.

## Local prerequisites

- Node.js and npm
- Python 3.12 or newer
- PostgreSQL 15 or newer

Install `uv` for the backend workflow, or use a regular virtual environment and pip. Cloudflare deployment additionally needs a Cloudflare account and the `wrangler` CLI.

## Run the frontend

```powershell
cd frontend
npm run dev
```

The generated starter currently uses Vite with `vinext`; `npm run build` builds its Worker output. Check compatibility with the current vinext release before production deployment. No Cloudflare deployment is performed by local setup.

Before deploying the frontend, set `NEXT_PUBLIC_SITE_URL` to the real HTTPS website origin (for example, `https://your-company-domain`). The value is used for canonical metadata and `sitemap.xml`; `robots.txt` includes its sitemap URL when configured. Do not leave the local sitemap fallback as a production URL.

The public pages, navigation, service/project detail templates, local replaceable image assets, logo and address-targeted Google Maps embed are implemented. The Contact page submits the inquiry form to `POST /api/v1/inquiries`, which stores each enquiry in the database; the admin console lists them.

## Run the API

```powershell
cd backend
Copy-Item .env.example .env
uv sync --all-groups
docker compose up -d postgres
uv run alembic upgrade head
uv run python -m scripts.seed_services
uv run uvicorn app.main:app --reload
```

The `backend/compose.yaml` service is development-only. Set `DATABASE_URL` in `backend/.env` to the same local database. The API exposes `/health`, `/ready`, public services/projects reads under `/api/v1`, and OpenAPI documentation at `/api/v1/docs`. `/ready` checks database connectivity. The service does not create or alter tables at startup; schema changes are applied through Alembic migrations.

The service seed script contains only the company-provided services catalogue. It does not create project case studies, clients, or achievements. Project APIs return published database records only; the current development preview project cards are explicitly labeled templates.

## Connect the public site to the API

Copy `frontend/.env.example` to `frontend/.env.local`. Keep `NEXT_PUBLIC_API_URL=http://127.0.0.1:8000` for local development, then start the frontend in a separate terminal with `cd frontend; npm run dev`. The public Services and Projects pages read the published API endpoints. If the API is unavailable during development, clearly labeled development preview content is shown; in production, no draft or fallback project claims are exposed.

The public site reads only published content. Phase 4 adds the administrative API and the admin console described below.

## Administrative API and console (Phase 4)

The admin console is at `/admin` on the frontend (for example `http://localhost:5173/admin`). It is `noindex`, and the public header and footer are hidden there. Sign in with the administrator credentials configured below. The console edits board members, projects, services and reads contact enquiries. Set `NEXT_PUBLIC_API_URL` in `frontend/.env.local` to the API origin.

To run the admin locally:

1. Start Postgres on port 5433 (the `backend/.env` default): `cd backend; $env:POSTGRES_PORT=5433; docker compose up -d postgres`.
2. Apply migrations: `uv run alembic upgrade head`.
3. Start the API: `uv run uvicorn app.main:app --reload --port 8000`.
4. Start the frontend: `cd frontend; npm run dev`.

There is a single administrator, configured through environment variables in `backend/.env`:

- `ADMIN_EMAIL`: the administrator's login email.
- `ADMIN_PASSWORD_HASH`: generate it with `uv run python -m scripts.create_admin_password_hash` (prompts for a password of at least 12 characters and prints the hash).
- `SESSION_SECRET`: a long random string used to sign tokens. Generate one with `python -c "import secrets; print(secrets.token_urlsafe(48))"`.
- `ADMIN_TOKEN_TTL_MINUTES`: token lifetime (default 720).
- `STORAGE_BACKEND`: `local` (default) or `r2`. Local files are written to `UPLOAD_DIR` and served from `MEDIA_BASE_URL`.
- `UPLOAD_DIR`: where uploaded images are written when `STORAGE_BACKEND=local` (default `uploads`, git-ignored).
- `MEDIA_BASE_URL`: public base URL used to build uploaded image links (default `http://127.0.0.1:8000/media`). Set this to the public API origin in production.
- `R2_ENDPOINT_URL`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE_URL`: Cloudflare R2 settings, used when `STORAGE_BACKEND=r2`. Uploads return 503 if they are incomplete.
- `MAX_UPLOAD_BYTES`: maximum upload size (default 5 MB). Only JPEG, PNG and WebP are accepted; the file content is checked, not just the extension.

Sign in with `POST /api/v1/auth/login` (JSON `{"email", "password"}`). It returns a bearer token; send it as `Authorization: Bearer <token>` to the endpoints under `/api/v1/admin`:

- `GET|POST /admin/board-members`, `PUT|DELETE /admin/board-members/{id}`: board of members (PUT replaces the whole record).
- `GET|POST /admin/projects`, `PUT|DELETE /admin/projects/{id}`: projects (a duplicate slug returns 409).
- `GET|POST /admin/services`, `PUT|DELETE /admin/services/{id}`: services (a duplicate slug returns 409).
- `GET /admin/inquiries`: contact inquiries, newest first (`limit` and `offset` query parameters).
- `POST /admin/uploads`: multipart upload with the field name `file`. Returns `{filename, url}`; use the URL in the board member or project record.

Deleting a record does not remove its stored image file. Remove unused files from `UPLOAD_DIR` or the R2 bucket manually.

The public `GET /api/v1/board-members` returns only published members. Login is limited to 10 attempts per IP every 15 minutes. The limiter is in memory, so it is per process.

Run the backend tests with `cd backend; uv run pytest -q`.

## Database migrations

From `backend/`, after installing dependencies and setting `DATABASE_URL`:

```powershell
uv run alembic revision --autogenerate -m "describe schema change"
uv run alembic upgrade head
```

Autogeneration requires SQLAlchemy models to be imported into `app/database/base.py` or the migration environment before models are added. Never use autogeneration as a substitute for reviewing the resulting migration.

## Environment separation

Keep local values in ignored `.env` files. Production database credentials, session secrets, and R2 credentials belong in the respective hosting providers' secret managers. Configure `CORS_ORIGINS` with exact frontend origins; do not use wildcard origins with credentials enabled.

### API deployment (Cloudflare Workers)

The API lives in `api/`, a TypeScript Worker that serves the same `/api/v1` routes as the FastAPI backend. It runs on the Workers free plan, connects to Supabase Postgres through Hyperdrive, and stores uploads in the `MEDIA` R2 bucket.

- Run `npm install` in `api/`. Run `npm test` against a local Postgres test database (`TEST_DATABASE_URL`, the database name must end in `_test`).
- Create the Hyperdrive config with `npx wrangler hyperdrive create` using the Supabase Session pooler URL, then put its id in `api/wrangler.jsonc`.
- Create the R2 bucket with `npx wrangler r2 bucket create willyfab-media` and attach a public custom domain for media, then set `R2_PUBLIC_BASE_URL` in `api/wrangler.jsonc`.
- Set production secrets with `npx wrangler secret put`: `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` (generate with `npm run hash-password` in `api/`), and `SESSION_SECRET` (a long random value).
- Deploy with `npx wrangler deploy` from `api/`. Check `/health` and `/ready` on the deployed URL, then point `NEXT_PUBLIC_API_URL` at it.
- Run `alembic upgrade head` from `backend/` against Supabase when the schema changes. The Worker does not run migrations.
- Login uses a keyed HMAC-SHA256 password hash, not the Python scrypt hash, so the admin password hash must be regenerated with `npm run hash-password`.
- Rate limits are kept in memory per Worker isolate, so they are not shared across edge locations.
