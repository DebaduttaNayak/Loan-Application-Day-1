# LendSwift

A production-grade multi-step loan application form for a fictional Indian fintech startup.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at `/api`)
- `pnpm --filter @workspace/lendswift run dev` — run the frontend (proxied at `/`)
- `pnpm run typecheck` — full typecheck across all packages (builds libs first)
- `pnpm run typecheck:libs` — build composite libs (run before API server typecheck)
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, shadcn/ui, Zustand (persist), React Hook Form + Zod
- API: Express 5 + pino logging
- DB: PostgreSQL + Drizzle ORM (`lib/db`)
- Validation: Zod (`zod/v4`), `drizzle-zod`, `@workspace/api-zod`
- API codegen: Orval (from OpenAPI spec at `lib/api-spec/openapi.yaml`)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/lendswift/` — React+Vite frontend (8-step loan form)
  - `src/lib/store.ts` — Zustand form state (persisted to localStorage key `lendswift-application`)
  - `src/lib/constants.ts` — Step definitions
  - `src/components/steps/Step{1-8}.tsx` — The 8 form steps
  - `src/pages/` — home.tsx, apply.tsx, summary.tsx, resume.tsx
- `artifacts/api-server/src/routes/` — Express routes: applications, verification, address, documents, health
- `lib/db/src/schema/` — `applications.ts`, `documents.ts` (Drizzle ORM tables)
- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/api-client-react/src/generated/api.ts` — Generated React Query hooks + types
- `lib/api-zod/src/generated/` — Generated Zod schemas for API routes

## Architecture decisions

- Contract-first API: OpenAPI spec → codegen produces both React Query hooks (frontend) and Zod validators (backend)
- Zustand with `persist` middleware stores all 8 steps in localStorage for auto-save/resume
- PAN/Aadhaar verification is simulated server-side (delays + realistic rules)
- Address autocomplete calls `/api/address/autocomplete?query=...` with debounce
- Pre-approval scoring on the server uses credit score + income-to-loan ratio heuristics
- Co-applicant step is always shown but auto-flags when amount > ₹5L or loan is home type

## Product

- 8-step loan application: Loan Details → Personal Info (PAN/Aadhaar verification) → Employment → Address (autocomplete) → Financial Profile → Document Upload (with preview) → Co-applicant + E-signature → Review & Submit
- 3 loan types: Personal (₹50K–₹10L), Home (₹5L–₹1Cr), Business (₹1L–₹50L)
- Pre-approval summary page with eligibility score gauge, indicative rate, EMI estimate
- Resume application by ID or from localStorage auto-save

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm run typecheck:libs` before `pnpm --filter @workspace/api-server run typecheck` — the API server needs emitted declarations from `lib/db`
- Do NOT run `pnpm dev` at workspace root — apps need PORT/BASE_PATH from workflow config
- The shared proxy routes `/api` → API server (port 8080), `/` → frontend (dynamic port)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
