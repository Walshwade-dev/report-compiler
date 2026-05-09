# Report Compiler Frontend

Next.js frontend for the Daily Report Automation report builder.

## Development

```bash
npm install
npm run dev
```

Open the local URL printed by the dev server.

## Backend API

API URL construction lives in:

```txt
lib/api.ts
```

Local development defaults to:

```txt
http://127.0.0.1:8000/api
```

Hosted deployments call same-origin `/api/*`, and the hosting platform rewrites those requests to:

```txt
https://report-app-px6c.onrender.com/api
```

## Build

```bash
npm run lint
npm run build
```

The app is configured for static export in `next.config.ts`, so production output is written to:

```txt
out/
```

## Netlify

The root `netlify.toml` sets:

```txt
base = frontend
command = npm run build
publish = out
```

## Preview Limitation

DOCX previews work in production. PNG/PDF previews require the backend deployment to include `libreoffice` and `poppler-utils`.
