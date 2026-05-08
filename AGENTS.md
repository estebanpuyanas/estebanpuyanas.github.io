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

The frontend is deployed as a static site. The backend runs as a sidecar service
(port 8080) and currently proxies the Last.fm API to avoid exposing the API key.

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

Environment variables (copy `.env.example` → `.env`):
- `LASTFM_API_KEY` — required
- `LASTFM_USERNAME` — required
- `PORT` — optional, defaults to `8080`

---

## Architecture

### Frontend layers

```
src/services/   → API calls only
src/hooks/      → state, side effects, calls services
src/components/ → rendering only, call a hook
src/pages/      → page-level layout, compose components
src/data/       → static data (no network)
```

**Services** (`src/services/`) — one file per backend resource.
Call `fetch` or a typed wrapper. No state, no hooks, no React.
Return typed data or throw. Example: `lastfmService.ts`.

**Hooks** (`src/hooks/`) — own state and side effects.
Call services, set up data fetching, return state + handlers.
Never return JSX — that belongs in a component.

**Components** (`src/components/`) — receive props, call a hook if needed, render.
No direct `fetch` calls. No business logic.

**Pages** (`src/pages/`) — assemble components into a full page layout.
Import `useNavBar`, render `<Footer />`, compose section components.

**Data** (`src/data/`) — static TypeScript files (arrays, maps, constants).
For anything that doesn't come from a network.

### Backend layers (Go)

```
internal/handler/  → HTTP only
internal/service/  → business logic
internal/model/    → data types (structs)
```

**Handlers** (`internal/handler/`) — parse `r`, call one service method, write `w`.
Zero business logic. One file per domain (e.g. `lastfm.go`).

**Services** (`internal/service/`) — all logic. No `http.Request`, no `http.ResponseWriter`.
Pure functions/methods that take typed arguments and return typed data or an error.

**Models** (`internal/model/`) — Go structs only. No methods, no logic.
Two layers: raw API shapes (e.g. `LastFMTrack`) and clean output types (e.g. `Track`).

---

## CSS Rules

- `frontend/src/index.css` owns **all** design tokens as CSS custom properties under `:root`.
- Never hardcode a color, spacing value, font, or z-index in a component file — always use `var(--...)`.
- Light theme overrides live under `[data-theme="light"]` in `index.css`. No JS-in-CSS, no inline styles for theming.
- Each component gets its own `.css` file next to it (`TravelsMap.css` alongside `TravelsMap.tsx`).
- CSS class names use `kebab-case` prefixed with the component name (e.g. `.tmap-header`, `.tmap-btn`).
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
| Files (utilities, services, data) | `camelCase.ts` | `lastfmService.ts` |
| React component files | `PascalCase.tsx` | `TravelsMap.tsx` |
| React components | `PascalCase` | `TravelsMap` |
| Hooks | `useCamelCase` | `useMusicSection` |
| CSS classes | `kebab-case`, component-prefixed | `.tmap-canvas` |
| Go files | `snake_case.go` (stdlib convention) | `lastfm.go` |
| Go types/interfaces | `PascalCase` | `LastFMService` |
| Go unexported | `camelCase` | `lastFMBaseURL` |

---

## Adding a New Backend Endpoint

1. Add struct(s) to `internal/model/<domain>.go`
2. Add method(s) to `internal/service/<domain>.go`
3. Add handler in `internal/handler/<domain>.go`
4. Register the route in `main.go`

## Adding a New Frontend Section / Page

1. Add the service function to `src/services/<domain>Service.ts` (if it needs network data)
2. Create `src/hooks/use<Domain>.ts` — fetch via the service, manage state, return data
3. Create `src/components/<Domain>.tsx` + `<Domain>.css` — render using the hook's return value
4. Add a page in `src/pages/<Domain>Page.tsx` if it needs its own route
5. Register the route in `src/main.tsx`

---

## Common Gotchas

- **Hooks must not return JSX.** Return state and handlers; let the component render.
- **Never fetch inside a component body.** Always go through a hook (which calls a service).
- **`var(--nav-height)` is `60px`.** Account for it in any full-height layout (`calc(100vh - var(--nav-height))`).
- **The Go backend is a proxy**, not a database. It holds no state between requests. Keep it stateless.
- **CORS is open (`*`) in development.** Lock it down before any production deployment that handles sensitive data.
- **`react-leaflet` requires the Leaflet CSS** (`leaflet/dist/leaflet.css`) to be imported alongside the component — it is imported in `TravelsMap.tsx`.
