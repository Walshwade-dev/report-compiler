# Report Compiler Frontend

Next.js frontend for the Daily Report Automation report builder.

## Development

```bash
npm install
npm run dev
```

Open the local URL printed by the dev server.

For a fixed local frontend URL, use:

```bash
npm run dev:local
```

## Backend API

API URL construction lives in:

```txt
lib/api.ts
```

Local browser sessions default to:

```txt
http://127.0.0.1:8000/api
```

Hosted browser sessions call same-origin `/api/*`, and the hosting platform rewrites those requests to:

```txt
https://report-app-px6c.onrender.com/api
```

Set `NEXT_PUBLIC_API_BASE_URL` to override both defaults.

## Admin Console

Administrative report history and deletion controls live at:

```txt
/admin
```

The admin page asks for the backend `ADMIN_PASSWORD`. The password is sent only
as an `X-Admin-Password` request header when calling protected backend routes.
It is kept in browser session storage for the current tab session and is not
compiled into the frontend bundle.

Admin-only UI includes:

- Report history
- Report deletion
- System status
- Session/debug payload details
- Developer prompt access for submitted tickets

Protected backend actions:

```txt
GET /api/report-sessions
DELETE /api/report-sessions/:report_id
```

Set `ADMIN_PASSWORD` on the Render backend service before deploying the
admin-gated backend. Ordinary report creation, uploads, previews, downloads,
SMS summaries, and dashboard analytics do not require the admin password.

When running the backend locally, start FastAPI from `report-app/backend`:

```bash
APP_ENV=development MPLCONFIGDIR=/tmp/matplotlib-cache .venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

If port `8000` is unavailable, use another port and set the frontend override before starting Next.js:

```txt
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8001
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
