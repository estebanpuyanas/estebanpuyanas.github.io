# AGENTS.md

Guidance for AI agents (and humans) working on this codebase.
Read this before making any changes.

---

## Project at a Glance

Personal website with two workspaces:

| Workspace | Path | Role |
|---|---|---|
| `frontend` | `frontend/` | React 19 + Vite + TypeScript SPA |
| `backend` | `backend/` | Go HTTP API (stdlib `net/http`) |

The frontend is a static SPA. The backend serves travel pin data (stored in SQLite), proxies Last.fm, and fetches Cloudinary image URLs. Both are deployed independently on Railway via Railpack.

---

## Essential Commands

### Frontend (run from `frontend/`)

```bash
npm run dev          # Vite dev server (port 5173)
npm run build        # tsc -b && vite build
npm run lint         # ESLint
npx tsc --noEmit     # Type-check without emitting
```

### Backend (run from `backend/`)

```bash
go run ./...         # Start server (port 8080)
go build ./...       # Compile
go vet ./...         # Static analysis
```

### Full stack (from repo root)

```bash
docker-compose up --build   # both services via Docker
make dev                    # shortcut
```

### Environment variables

**Frontend (`frontend/.env`)**
- `VITE_API_BASE_URL` — backend base URL, e.g. `http://localhost:8080`
- `VITE_MAPTILER_API_KEY` — MapTiler key for the travels map

**Backend (`backend/.env`)**
- `LASTFM_API_KEY` — required
- `LASTFM_USERNAME` — required
- `CLOUDINARY_CLOUD_NAME` — required for travel pin images
- `CLOUDINARY_API_KEY` — required for travel pin images
- `CLOUDINARY_API_SECRET` — required for travel pin images
- `ADMIN_TOKEN` — required; protects `POST /api/travel/pins` and `DELETE /api/travel/pins/:id`
- `DB_PATH` — optional; path to SQLite file, defaults to `./travels.db`
- `PORT` — optional, defaults to `8080`

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/music/recent-tracks?limit=N` | — | Last.fm recent scrobbles (max 50) |
| `GET` | `/api/travel/pins` | — | All travel pins without images |
| `POST` | `/api/travel/pins` | Bearer | Create a pin |
| `DELETE` | `/api/travel/pins/:id` | Bearer | Delete a pin |
| `GET` | `/api/travel/pins/:id/images` | — | Lazy-fetch Cloudinary images for one pin |

Images are intentionally **not** included in `GET /api/travel/pins` — they are fetched lazily per pin when the user clicks a map marker (via `GET /api/travel/pins/:id/images`). This avoids N Cloudinary API calls on every page load.

---

## Architecture

### Frontend layers

```
src/services/   → API calls only
src/hooks/      → state, side effects, calls services
src/components/ → rendering only, call a hook if needed
src/data/       → static data (no network)
```

**Services** (`src/services/`) — one file per backend resource, named `<domain>Service.ts`.
Call `fetch`. No state, no hooks, no React. Return typed data or throw.
Example: `travelPinService.ts` exports `getPins()`, `getPinImages(id)`, `createPin()`, `deletePin()`.

**Hooks** (`src/hooks/`) — own state and side effects.
Call services, set up data fetching, return state + handlers.
Never return JSX — that belongs in a component.
Named `use<Domain>.ts`.

**Components** (`src/components/`) — every component lives in its own folder:
```
src/components/
  NavBar/
    index.tsx
    index.css   (only if the component has styles)
  ScrobbleCarousel/
    index.tsx
    index.css
  PinModal/
    index.tsx
    index.css
```
No `pages/` directory — page-level components (routes) live in `src/components/` too,
e.g. `TravelsPage/index.tsx`, `AdminPage/index.tsx`.
Components receive props, call a hook if needed, render. No direct `fetch` calls.

**Data** (`src/data/`) — static TypeScript files (arrays, maps, constants).
For anything that doesn't come from a network.

### Backend layers (Go)

```
internal/cloudinary/ → Cloudinary SDK client
internal/handler/    → HTTP only
internal/service/    → business logic
internal/model/      → data types (structs)
```

**Cloudinary** (`internal/cloudinary/`) — `CloudinaryService` wraps the Cloudinary Go SDK.
Injected into services that need it. Not called directly from handlers.

**Handlers** (`internal/handler/`) — parse `r`, call one service method, write `w`.
Zero business logic. One file per domain (e.g. `travel-pin.go`).

**Services** (`internal/service/`) — all logic. No `http.Request`, no `http.ResponseWriter`.
Pure functions/methods that take typed arguments and return typed data or an error.
Services receive infrastructure clients (DB, Cloudinary) via constructor injection.

**Models** (`internal/model/`) — Go structs only. No methods, no logic.
Two layers: raw API shapes (e.g. `LastFMRecentTracksResponse`) and clean output types (e.g. `Track`).

### SQLite (travel pins)

`travels.db` stores the `travel_pins` table. Schema is auto-migrated in `internal/db/db.go` on startup.
Locally the file lives at `./travels.db` (relative to the `backend/` dir).
In production (Railway), set `DB_PATH=/data/travels.db` and attach a Railway Volume at `/data` so the file survives redeployment.

---

## Data Migration (SQLite → Neon Postgres)

`backend/cmd/migrate/main.go` is a one-shot tool for migrating all data from the local SQLite `travels.db` into a Neon Postgres database. Run it **once** when switching the backend's storage layer from SQLite to Postgres.

### When to use

Only when intentionally moving the production database to Neon. Do **not** run this against a Postgres DB that already has live data without confirming the target tables are empty first (inserts use `ON CONFLICT DO NOTHING`, so re-running is safe but will not overwrite existing rows).

### Prerequisites

1. Create a Neon project and a database named `personal-website` via the Neon dashboard.
2. Copy the connection string (format: `postgresql://user:password@ep-xxx.region.aws.neon.tech/personal-website?sslmode=require`).
3. Add `NEON_DATABASE_URL=<connection string>` to `backend/.env` (or export it in the shell).

### Running the migration

```bash
# Build the tool (outputs to backend/bin/migrate, which is gitignored)
make migrate-build

# Run from the backend directory so the default --sqlite path resolves correctly
cd backend
NEON_DATABASE_URL="postgresql://..." ./bin/migrate

# Or point at a different SQLite file
NEON_DATABASE_URL="postgresql://..." ./bin/migrate --sqlite /path/to/travels.db

# Clean up the binary when done
make clean
```

### What it does

1. Creates the schema in Postgres if tables do not yet exist (`travel_pins`, `pin_images`, `blog_posts`).
2. Copies all rows from SQLite, converting types where needed (`REAL` → `DOUBLE PRECISION`, `INTEGER` published flag → `BOOLEAN`, `DATETIME` strings → `TIMESTAMPTZ`).
3. Uses `ON CONFLICT DO NOTHING` — safe to re-run; existing rows are left untouched.

---

## Deployment (Railway + Railpack)

Each service has a `railway.toml` at its root that sets `builder = "railpack"`. Railpack auto-detects the language and build steps — no Dockerfile is needed for Railway (the Dockerfiles still exist for local `docker-compose`).

Deploy order matters:
1. Deploy the **backend** first and note its public Railway URL.
2. Set `VITE_API_BASE_URL` on the **frontend** service to that URL.
3. Deploy the **frontend** — Vite bakes `VITE_API_BASE_URL` into the bundle at build time.

---

## CSS Rules

- `frontend/src/index.css` owns **all** design tokens as CSS custom properties under `:root`.
- Never hardcode a color, spacing value, font, or z-index in a component file — always use `var(--...)`.
- Light theme overrides live under `[data-theme="light"]` in `index.css`. No JS-in-CSS, no inline styles for theming.
- Each component that needs styles gets an `index.css` inside its folder.
- CSS class names use `kebab-case` prefixed with a short component abbreviation (e.g. `.tmap-header`, `.pmodal-card`, `.scrobble-nav`).
- Never use inline `style={{}}` for anything that belongs in CSS — layout, color, spacing, transitions.
  Inline styles are only acceptable for values that are genuinely dynamic at runtime (e.g. a calculated pixel offset).

---

## TypeScript Conventions

- Prefer `interface` for object shapes; use `type` for unions and aliases.
- No `any`. Use `unknown` and narrow, or use specific generics.
- Prefix intentionally unused parameters with `_` (`_e`, `_props`).
- Use `as const` for literal arrays/objects that should not be widened.

---

## Naming

| Thing | Convention | Example |
|---|---|---|
| Service files | `camelCase.ts` | `travelPinService.ts` |
| Hook files | `camelCase.ts` | `useTravelPins.ts` |
| Data files | `camelCase.ts` | `blogPosts.ts` |
| Component folders | `PascalCase/` | `PinModal/` |
| Component files | `index.tsx` | `PinModal/index.tsx` |
| Component CSS | `index.css` | `PinModal/index.css` |
| React components | `PascalCase` | `PinModal` |
| Hooks | `useCamelCase` | `useLastFM` |
| CSS classes | `kebab-case`, component-prefixed | `.pmodal-card` |
| Go files | `kebab-case.go` (stdlib convention) | `travel-pin.go` |
| Go types/interfaces | `PascalCase` | `TravelPinService` |
| Go unexported | `camelCase` | `lastFMBaseURL` |

---

## Adding a New Backend Endpoint

1. Add struct(s) to `internal/model/<domain>.go`
2. Add method(s) to `internal/service/<domain>.go`
3. Add handler in `internal/handler/<domain>.go`
4. Register the route in `main.go`

## Adding a New Frontend Feature

1. Add the service function to `src/services/<domain>Service.ts` (if it needs network data)
2. Create `src/hooks/use<Domain>.ts` — call the service, manage state, return `{ data, loading, error }`
3. Create `src/components/<Domain>/index.tsx` + `index.css` — render using the hook's return value
4. If it needs its own route, add `src/components/<Domain>Page/index.tsx` and register in `src/main.tsx`

---

## Common Gotchas

- **Hooks must not return JSX.** Return state and handlers; let the component render.
- **Never fetch inside a component body.** Always go through a hook (which calls a service).
- **`var(--nav-height)` is `60px`.** Account for it in any full-height layout (`calc(100vh - var(--nav-height))`).
- **CORS is open (`*`).** Lock it down before handling anything sensitive in production.
- **`react-leaflet` requires the Leaflet CSS** (`leaflet/dist/leaflet.css`) imported in `TravelsMap/index.tsx`.
- **Cloudinary images** are served via Cloudinary's CDN using `CloudinarySecureURL`. Never proxy image bytes through the Go backend.
- **Do NOT use the Cloudinary Admin API to list or look up assets** (`client.Admin.Assets`, `client.Admin.Asset`, etc.). It returns unreliable/empty results even when assets exist, which has previously caused images to appear missing and triggered spurious DB deletions during sync. The only Admin API calls that are acceptable are `RootFolders`/`SubFolders` for the folder combobox in the admin UI. For everything else: use the Upload API (`Upload`, `Destroy`) for write operations, and HEAD requests to the CDN URL to verify whether an asset still exists.
- **Pin images are lazy-loaded.** `GET /api/travel/pins` returns empty `images: []` for every pin. Images are only fetched when a user clicks a pin, via `GET /api/travel/pins/:id/images`. Do not add eager image fetching back to `GetAllPins` — it makes N Cloudinary API calls on every page load.
- **`VITE_API_BASE_URL` is a build-time constant.** Changing it in Railway requires a frontend redeploy to take effect.
- **SQLite on Railway needs a Volume.** Without a Volume mounted at `/data` and `DB_PATH=/data/travels.db`, the database resets on every deploy.
- **The Dockerfiles exist for local `docker-compose` only.** Railway uses `railway.toml` + Railpack and ignores the Dockerfiles.
