# Running the Portfolio Locally

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- npm (comes with Node)

## Setup

```bash
# From the repo root, navigate to the frontend app:
cd frontend/my-app

# Install dependencies (only needed once, or after pulling new changes):
npm install
```

## Start the dev server

```bash
npm run dev
```

Vite will start a local server. Open the URL it prints (usually **http://localhost:5173**) in your browser.

The dev server supports **Hot Module Replacement** — edits to `src/` files reload instantly without a full page refresh.

## Other useful commands

| Command | What it does |
|---|---|
| `npm run dev` | Start local dev server with HMR |
| `npm run build` | Compile TypeScript + bundle for production (output → `dist/`) |
| `npm run preview` | Serve the production build locally for a final check |
| `npm run lint` | Run ESLint across all source files |

## Project structure

```
frontend/my-app/
├── src/
│   ├── App.tsx          # Main portfolio page (all sections)
│   ├── index.css        # Global styles, CSS variables, design system
│   ├── App.css          # (cleared — styles live in index.css)
│   ├── main.tsx         # React entry point
│   └── hooks/
│       └── useInView.ts # Scroll-triggered animation hook
├── public/              # Static assets served as-is
├── index.html           # HTML shell
├── vite.config.ts       # Vite configuration
└── package.json
```

## Notes

- All design tokens (colors, fonts, spacing) are CSS custom properties defined at the top of `src/index.css`.
- The `useInView` hook wires up `IntersectionObserver` to elements with `data-inview` attributes. Add `data-delay="1"` through `data-delay="8"` to stagger animations within a section.
- To add a new section, create a `<section>` with a `ref` from `useInView()`, add `data-inview` to child elements, and wire a nav link to the section's `id`.
