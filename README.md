# report-compiler

Frontend report-builder for the Daily Report Automation system.

The app lets users create a report workspace, enter report metadata, upload required CSV/XLSX files, save manual inputs, preview generated report sections, build the final DOCX report, and download it.

## Project Layout

```txt
.
├── frontend/       # Next.js frontend app
├── netlify.toml    # Netlify static export + API rewrites
├── vercel.json     # Vercel API rewrites
└── FRONTEND_IMPLEMENTATION_GUIDE_UPDATED.md
```

## Current URLs

Production frontend:

```txt
https://dnkreport.netlify.app
```

Production backend:

```txt
https://report-app-px6c.onrender.com
```

Backend health check:

```txt
https://report-app-px6c.onrender.com/health
```

## Local Development

Run the frontend:

```bash
cd frontend
npm install
npm run dev
```

For local backend development, run FastAPI at:

```txt
http://127.0.0.1:8000
```

The frontend API helper falls back to that local backend during local development.

## API Routing

All backend URL construction is centralized in:

```txt
frontend/lib/api.ts
```

Hosted browsers call same-origin API paths:

```txt
/api/report-sessions
```

Netlify/Vercel rewrite those calls to:

```txt
https://report-app-px6c.onrender.com/api/...
```

This avoids frontend browser CORS issues.

## Deploying On Netlify

Netlify settings are captured in `netlify.toml`:

```toml
[build]
  base = "frontend"
  command = "npm run build"
  publish = "out"
```

The frontend uses Next static export, so Netlify should publish:

```txt
frontend/out
```

## Preview Note

DOCX previews work on the deployed backend.

PNG/PDF previews require backend system packages:

```txt
libreoffice
poppler-utils
```

If those packages are missing on Render, PNG/PDF preview endpoints may return `500`. The frontend shows a fallback link to open the DOCX preview.

## Useful Commands

```bash
cd frontend
npm run lint
npm run build
```
