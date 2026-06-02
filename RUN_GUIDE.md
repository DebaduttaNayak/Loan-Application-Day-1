# LendSwift — Run Guide

## Prerequisites

- **Node.js 20+** (Node 24 recommended — tested on v24.13.0)
- **pnpm 10+** — install with `npm install -g pnpm`
- **No database needed** — data is stored in memory on the server and in the browser (localStorage)

---

## 1. Install dependencies

```bash
pnpm install
```

That's it. No database setup, no migrations, no environment config required.

---

## 2. Run the app (two terminals)

**Terminal 1 — API server (port 8080):**
```bash
$env:PORT="8081"
$env:BASE_PATH="/api"
pnpm.cmd --filter @workspace/api-server run dev
```

**Terminal 2 — Frontend (port 3000):**
```bash
$env:PORT="3000"
$env:BASE_PATH="/"
pnpm.cmd --filter @workspace/lendswift run dev
```

Then open **http://localhost:3000** in your browser.

---

## Pages

| URL | Description |
|-----|-------------|
| `http://localhost:3000/` | Landing page |
| `http://localhost:3000/apply` | 8-step loan application form |
| `http://localhost:3000/resume` | Resume a saved application |
| `http://localhost:3000/summary/:id` | Pre-approval result page |
| `http://localhost:3000/admin` | Admin dashboard — all applications |

---

## How data is stored

| Data | Where |
|------|-------|
| Form progress (all 8 steps) | Browser localStorage (auto-saved, survives refresh) |
| Submitted applications | Server in-memory (lost on server restart) |
| Document metadata | Server in-memory (lost on server restart) |

> **Note:** Application records live as long as the API server process is running.
> Form data typed into the browser is always safe — it persists in localStorage
> via Zustand's persist middleware regardless of server restarts.

---

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/healthz` | Health check |
| POST | `/api/applications` | Create application |
| GET | `/api/applications/:id` | Get application |
| PATCH | `/api/applications/:id` | Auto-save step |
| POST | `/api/applications/:id/submit` | Submit application |
| GET | `/api/applications/:id/pre-approval` | Pre-approval score |
| POST | `/api/verify/pan` | PAN verification (simulated) |
| POST | `/api/verify/aadhaar` | Aadhaar verification (simulated) |
| GET | `/api/address/autocomplete` | Address autocomplete |
| POST | `/api/documents/:applicationId` | Upload document metadata |
| GET | `/api/documents/:applicationId` | List documents |
| GET | `/api/admin/applications` | All applications (admin) |
| DELETE | `/api/admin/applications/:id` | Delete application (admin) |

---

## Project structure

```
lendswift/
├── artifacts/
│   ├── lendswift/              # React + Vite frontend
│   │   └── src/
│   │       ├── components/steps/   # Step1–Step8 form components
│   │       ├── pages/              # home, apply, resume, summary, admin
│   │       └── lib/store.ts        # Zustand form state (localStorage)
│   └── api-server/             # Express 5 API server
│       └── src/
│           ├── store.ts            # In-memory Maps (applications + documents)
│           └── routes/             # applications, admin, verification, address, documents
├── lib/
│   ├── api-spec/               # OpenAPI spec (source of truth)
│   ├── api-client-react/       # Generated React Query hooks
│   └── api-zod/                # Generated Zod validators
└── RUN_GUIDE.md                # This file
```

---

## Typecheck everything

```bash
pnpm run typecheck
```

## Regenerate API types (after editing openapi.yaml)

```bash
pnpm --filter @workspace/api-spec run codegen
```
