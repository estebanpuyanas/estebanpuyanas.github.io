---
name: project-railway-setup
description: Railway/Railpack deployment configuration for this monorepo (frontend Vite+Caddy, backend Go)
metadata:
  type: project
---

Personal website monorepo with two Railway services, both using Railpack auto-detection.

**Frontend service** (`frontend/` root directory in Railway):
- Railpack detects as Vite SPA, serves with Caddy on `$PORT`
- Built with `npm run build` → `dist/` directory
- `VITE_API_BASE_URL` must be set to the backend's Railway public URL (baked into JS bundle at build time)
- `VITE_MAPTILER_API_KEY` must be set (also baked in at build time)
- Health check path: `/health` (Caddy auto-responds 200)
- Config files: `frontend/railway.toml`, `frontend/railpack.json`

**Backend service** (`backend/` root directory in Railway):
- Railpack detects as Go, builds `go build -ldflags="-w -s" -o out`, starts `./out`
- Already respects `$PORT` env var (falls back to 8080)
- Required env vars: `LASTFM_API_KEY`, `LASTFM_USERNAME`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `ADMIN_TOKEN`
- SQLite database (`travels.db`) needs a Railway Volume mounted at `/app/travels.db`
- Health check path: `/api/travel/pins`
- Config file: `backend/railway.toml`

**Key architectural difference from Docker compose:**
Docker compose uses nginx to proxy `/api/*` to the backend container. On Railway, both services get separate public URLs — the frontend calls the backend directly via its Railway URL (set in `VITE_API_BASE_URL` at build time). No nginx proxy needed.

**Why:** Railway deploys each service independently with separate ingress URLs. No shared Docker network.

**How to apply:** When adding new env vars to either service, remember `VITE_*` vars are build-time secrets (baked into the JS bundle), not runtime env vars. Runtime env vars only affect the Go backend.
