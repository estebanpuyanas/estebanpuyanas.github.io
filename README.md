# estebanpuyanas.github.io

Personal portfolio site — React SPA frontend + Go API backend. Previously a Jekyll site; fully rewritten.

## Stack

**Frontend**
- **React 19 + TypeScript** — component tree, hooks
- **Vite** — build tooling and dev server
- **React Router v7** — client-side routing
- **Leaflet + react-leaflet** — interactive travel map with pin markers
- **CartoDB tiles** — map tile provider (no API key required)

**Backend**
- **Go** (`net/http`) — HTTP API server
- **SQLite** (`modernc.org/sqlite`) — stores travel pin metadata
- **Cloudinary** — hosts travel photos; backend fetches image URLs via the Cloudinary Admin API
- **Last.fm API** — proxied server-side to fetch recent scrobbles

**Infrastructure**
- **Docker + docker-compose** — local full-stack dev environment
- **Railway + Railpack** — production deployment (two services: `frontend/`, `backend/`)

---

## Running locally

### Option A — docker-compose (full stack)

```bash
docker-compose up --build
# frontend → http://localhost:5173
# backend  → http://localhost:8080
```

### Option B — services individually

**Backend** (from `backend/`):
```bash
go run ./...         # starts on :8080
```

**Frontend** (from `frontend/`):
```bash
npm install
npm run dev          # Vite dev server at http://localhost:5173
npm run build        # production build → dist/
npm run preview      # preview the production build
```

### Makefile shortcuts (from repo root)

```bash
make dev             # starts both services
make build           # builds both
```

---

## Environment variables

**Frontend (`frontend/.env`)**
```
VITE_API_BASE_URL=http://localhost:8080
VITE_MAPTILER_API_KEY=<your key>
```

**Backend (`backend/.env`)**
```
LASTFM_API_KEY=<required>
LASTFM_USERNAME=<required>
CLOUDINARY_CLOUD_NAME=<required>
CLOUDINARY_API_KEY=<required>
CLOUDINARY_API_SECRET=<required>
ADMIN_TOKEN=<required — protects POST/DELETE pin endpoints>
DB_PATH=<optional — defaults to ./travels.db>
PORT=<optional — defaults to 8080>
```

---

## Project structure

```
frontend/src/
  services/     # fetch calls only — one file per backend resource
  hooks/        # state + side effects, call services
  components/   # one folder per component (index.tsx + index.css)
  data/         # static TS files (no network)

backend/
  internal/
    cloudinary/ # Cloudinary SDK wrapper
    handler/    # HTTP layer only — parse request, call service, write response
    service/    # business logic
    model/      # Go structs (no methods)
  main.go       # wires everything, registers routes
  travels.db    # SQLite database (gitignored in prod; persisted via Railway Volume)
```

---

## API endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/music/recent-tracks?limit=N` | — | Last.fm recent scrobbles (max 50) |
| `GET` | `/api/travel/pins` | — | All travel pins (no images) |
| `POST` | `/api/travel/pins` | Bearer | Create a pin |
| `DELETE` | `/api/travel/pins/:id` | Bearer | Delete a pin |
| `GET` | `/api/travel/pins/:id/images` | — | Fetch Cloudinary images for a pin (lazy-loaded on click) |

`Bearer` = `Authorization: Bearer <ADMIN_TOKEN>` header required.

---

## Data migration (SQLite → Neon Postgres)

`backend/cmd/migrate/main.go` is a one-shot migration tool. Use it if/when the backend storage layer moves from SQLite to Neon Postgres.

```bash
# 1. Build the tool (lands in backend/bin/migrate, which is gitignored)
make migrate-build

# 2. Set your Neon connection string
export NEON_DATABASE_URL="postgresql://user:pass@ep-xxx.region.aws.neon.tech/personal-website?sslmode=require"

# 3. Run from backend/ so the default --sqlite path resolves
cd backend && ../bin/migrate        # or: ./bin/migrate --sqlite /custom/path.db

# 4. Clean up when done
make clean
```

The tool creates the schema if it doesn't exist, then copies all rows from `travel_pins`, `pin_images`, and `blog_posts`. It uses `ON CONFLICT DO NOTHING`, so re-running is safe. See `AGENTS.md` for the full checklist.

---

## Deployment (Railway)

Two Railway services from the same GitHub repo, each using Railpack (configured via `railway.toml`):

| Service | Root Directory | Health check |
|---------|---------------|--------------|
| Frontend | `frontend/` | `/health` |
| Backend | `backend/` | `/api/travel/pins` |

**Railway env vars to set:**

*Backend service*
```
LASTFM_API_KEY, LASTFM_USERNAME
CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
ADMIN_TOKEN
DB_PATH=/data/travels.db
```
Create a Railway Volume mounted at `/data` to persist `travels.db` across deploys.

*Frontend service*
```
VITE_API_BASE_URL=https://<backend-service>.up.railway.app
VITE_MAPTILER_API_KEY=<your key>
```
`VITE_API_BASE_URL` is baked into the JS bundle at build time — set it before the first deploy.

---

## Still TODO (backend)

These features still live fully in the frontend and would benefit from a backend:

- **GitHub projects** (`src/hooks/useProjectsSection.tsx`) — browser fetches GitHub API directly, hitting unauthenticated rate limits (60 req/hr/IP). Backend should proxy with a PAT and cache results.
- **Blog posts** (`src/data/blogPosts.ts`) — hardcoded in the JS bundle; adding a post requires a redeploy. Backend should serve from a `posts` table with draft/publish support.
- **Static content** (education, experience, about) — lower priority; tolerable to keep in source for a resume-style site.
