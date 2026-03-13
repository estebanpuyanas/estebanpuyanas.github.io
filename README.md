# estebanpuyanas.github.io

Personal portfolio site — built in React + TypeScript + Vite. Previously a Jekyll site; fully rewritten as a React SPA with client-side routing.

## Stack

- **React 19 + TypeScript** — component tree, hooks
- **Vite** — build tooling and dev server
- **React Router v7** — client-side routing (`/about`, `/education`, `/experience`, `/projects`, `/music`, `/travels`, `/music/:slug`)
- **Leaflet + react-leaflet** — interactive travel map with photo pins
- **CartoDB tiles** — map tile provider (no API key required)

## Running locally

```bash
cd frontend/my-app
npm install
npm run dev        # dev server at http://localhost:5173
npm run build      # production build → dist/
npm run preview    # preview the production build
```

## Project structure

```
frontend/my-app/src/
  components/       # pure presentational UI pieces
  hooks/            # section hooks (contain JSX + logic, call components)
  pages/            # one file per route
  data/             # hardcoded data that should eventually move to the backend
```

---

## What belongs on the backend

The following pieces currently live in the frontend but should be served by a backend API once one is written. Each entry notes the current location, the problem with keeping it in the FE, and what the backend should expose.

---

### 1. GitHub repositories — `src/hooks/useProjectsSection.tsx`

**Current approach:** The browser fetches `https://api.github.com/users/estebanpuyanas/repos` directly at page load.

**Problems:**
- Unauthenticated GitHub API requests are rate-limited to **60 requests/hour per IP**. Visitors on shared networks (offices, universities) can easily hit this.
- A GitHub personal access token would be needed to raise the limit or access private repos, but a token cannot be embedded in frontend code safely — it would be exposed in the JS bundle.
- No caching: every page load fires a fresh request even if the data hasn't changed.

**Backend should expose:**
- `GET /api/projects` — fetches from GitHub server-side using an auth token, filters forks, caches the result (e.g. TTL of 10–30 minutes), and returns the cleaned list.

---

### 2. Blog posts — `src/data/blogPosts.ts`

**Current approach:** Blog post content (title, slug, body paragraphs, excerpt) is a hardcoded TypeScript array compiled into the JS bundle.

**Problems:**
- Adding or editing a post requires a code change and a full frontend redeploy.
- There is no draft/publish workflow — everything in the array is live immediately.
- Long-form content bloats the JS bundle unnecessarily.

**Backend should expose:**
- `GET /api/posts` — returns list of published posts (slug, title, date, excerpt, wip flag).
- `GET /api/posts/:slug` — returns full post content (paragraphs, metadata).
- A simple database table (e.g. `posts` with `slug`, `title`, `date`, `excerpt`, `body`, `published`) is sufficient; no need for a full CMS.

---

### 3. Travel pins and photos — `src/components/TravelsMap.tsx`

**Current approach:** `TRAVEL_PINS` is a hardcoded array in the component file. Placeholder images point to `placehold.co`.

**Problems:**
- Adding a new pin or photo requires editing source code and redeploying.
- Real travel photos cannot be bundled into the frontend (file size). They need to be stored externally (S3, Cloudflare R2, Cloudinary, etc.) and served via URL.
- Metadata (location name, coordinates, date, caption) lives in code instead of a database.

**Backend should expose:**
- `GET /api/travels` — returns an array of pin objects: `{ id, lat, lng, location, country, date, imageUrl, caption }`.
- An image upload endpoint + object storage bucket to hold the actual photo files.
- The frontend `TRAVEL_PINS` constant is already typed as `TravelPin[]` and marked with a `// TODO: replace with GET /api/travels` comment to make the swap straightforward.

---

### 4. Static content — education, experience, about

**Current locations:**
- `src/hooks/useEducationSection.tsx` — `EDUCATION` constant
- `src/hooks/useExperienceSection.tsx` — `EXPERIENCES` constant
- `src/hooks/useAboutSection.tsx` — bio text and `INTERESTS` constant

**Problem:** Lower priority than the above, but updating a job title, date, or description requires touching source code and redeploying the frontend. For a resume-style site that changes a few times per year this is tolerable, but it's still worth noting.

**Backend could expose:**
- `GET /api/content/education`
- `GET /api/content/experience`
- `GET /api/content/about`

These could be a simple JSON file served by the backend, a single `content` database table keyed by section name, or a lightweight headless CMS — whatever fits the backend architecture.
