# Tracre One API

Backend-only API for Tracre One, an AI-powered real estate CRM whose Android app is already live on Google Play. This project is API-only — no frontend/UI/Android code lives here.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port from `PORT` env var)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-server run typecheck` — typecheck just the API server
- `pnpm --filter @workspace/api-server run test` — run the vitest unit/integration suite (all Prisma calls mocked; never touches the real DB)
- Required env: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` (external production Postgres), `SESSION_SECRET` (JWT signing), `REDIS_URL` (BullMQ queues)
- `cd artifacts/api-server && DATABASE_URL="postgresql://$(node -e "console.log(encodeURIComponent(process.env.DB_USER))"):$(node -e "console.log(encodeURIComponent(process.env.DB_PASSWORD))")@$DB_HOST:$DB_PORT/$DB_NAME" npx prisma db push` — push additive-only Prisma schema changes to the external DB (never destructive; see Gotchas — the plain `npx prisma db push` will silently target the wrong local DB)
- `docker compose -f artifacts/api-server/docker-compose.yml up` — run API + worker + Redis in containers (Postgres is external, not containerized)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: **PostgreSQL via Prisma ORM** (not Drizzle — deliberate deviation, see Architecture decisions)
- Auth: JWT (access + refresh), bcrypt password hashing, OTP (phone), Google ID token field ready
- Queues: Redis + BullMQ (notifications, follow-up reminders)
- Docs: Swagger UI at `/api/docs`
- Tests: Vitest (unit + controller-level integration tests with mocked Prisma client)
- Build: esbuild (ESM bundle)

## Where things live

- `artifacts/api-server/prisma/schema.prisma` — source of truth for DB schema (introspected + hand-extended)
- `artifacts/api-server/src/modules/*` — one folder per domain, each with `*.schema.ts` (zod), `*.controller.ts`, `*.routes.ts`, and co-located `*.test.ts` where covered. Domains: auth, companies, users, pipeline, tags, leads, followups, activity, landing-pages, lead-capture (public), campaigns, notifications, settings, custom-fields, lead-sources, lead-statuses, analytics (dashboard/pipeline/team-performance), reports (CSV export via `lib/csv.ts`), search, profile, roles, uploads (object storage + `FileAsset`)
- `artifacts/api-server/src/providers/*` — provider-based scaffolds (types/config/service/routes) for ai-calling, whatsapp, payments, image-generation. Each throws `ProviderNotConfiguredError` (503) until real credentials are supplied, so wiring a provider later needs no architecture changes.
- `artifacts/api-server/src/lib/` — shared helpers: `pagination.ts`, `csv.ts`, `notify.ts` (notifications + BullMQ enqueue), `permissions.ts` (permission catalog + default role grants), `objectStorage.ts`/`objectAcl.ts` (Replit object storage)
- `artifacts/api-server/src/config/database.ts` — builds `DATABASE_URL` from discrete env vars (see Gotchas)
- `artifacts/api-server/src/queues/` — BullMQ queue definitions (`index.ts`) and background worker process (`worker.ts`)
- `artifacts/api-server/src/middlewares/` — `auth.ts` (JWT verification), `rbac.ts` (role checks + `requirePermission`), `errorHandler.ts` (mounted as the final Express error middleware in `app.ts`)
- `artifacts/api-server/src/docs/openapi.ts` — hand-maintained OpenAPI path list served at `/api/docs`
- `artifacts/api-server/Dockerfile`, `Dockerfile.worker`, `docker-compose.yml` — container setup for API, worker, and Redis

## Architecture decisions

- **Prisma instead of the house Drizzle convention.** The user explicitly required Prisma ORM. This project bypasses `@workspace/db` (Drizzle) and does not use `lib/api-spec` OpenAPI codegen for validation — routes use hand-written Zod schemas per module instead. This is scoped entirely inside `artifacts/api-server`.
- **External production database, never destructive.** The Postgres database is an existing external instance (not Replit-managed) with live production data (`leads`, `whatsapp_*`, `landing_pages` tables). All new schema changes are additive only: new tables, or new nullable columns with `@map`/`@@map` onto existing snake_case columns. No existing table has been dropped, renamed, or had a column removed.
- **JWT secrets derived from `SESSION_SECRET`.** Rather than requesting brand-new secrets for access/refresh token signing, both are derived via SHA-256(`SESSION_SECRET` + purpose) so only one secret needs to be managed.
- **Redis/BullMQ degrade gracefully.** If Redis is unreachable, the API server still starts and serves requests; only background jobs (notifications, follow-up reminders) are unavailable until Redis is reachable.
- **Provider-based architecture for unbuilt integrations.** AI calling, WhatsApp, Payments, and Image Generation each have a full interface/service/route/config scaffold under `src/providers/*`. Every entry point throws a typed `ProviderNotConfiguredError` (mapped to HTTP 503) until real vendor credentials are added — the routes, permission checks, and request/response contracts are already final.
- **Permission catalog seeded at startup.** `ensurePermissionCatalogSeeded()` (in `modules/roles/role.controller.ts`) runs once on server boot to upsert the `Permission` catalog rows; per-role grants live in `role_permissions` and default to `DEFAULT_ROLE_PERMISSIONS` until a company customizes them via the roles module.

## Product

- Multi-tenant real estate CRM API: companies (workspaces) contain users (owner/admin/manager/agent roles) who manage leads through a pipeline, with notes, tags, follow-ups, and an audit/activity log.
- Auth supports email+password, phone OTP, and is structured for Google Sign-In (fields exist; token verification not yet wired to a Google client ID).
- Full CRM surface now built: landing pages (+ public slug endpoint for the Android app), public rate-limited lead capture, campaigns, notifications, company settings, custom fields (definitions + per-lead values), lead sources, lead statuses, dashboard/pipeline/team-performance analytics, CSV/JSON reports, global search, user profile, role/permission management, and file uploads backed by object storage + a `FileAsset` table.
- Legacy WhatsApp automation and landing page tables (pre-existing) are preserved as-is; the new `whatsapp` provider scaffold wraps the legacy `whatsapp_chats`/`whatsapp_messages` tables but has no live vendor wired in yet.

## User preferences

- Backend-only: never add frontend/UI/Android code to this project.
- Never run destructive migrations against the database. All schema changes must be additive (new tables/nullable columns only).

## Gotchas

- **DB password contains `@` and `#`.** Always build `DATABASE_URL` via `encodeURIComponent(DB_PASSWORD)` — never inline it in a raw string, or the URL parser misreads the host/port.
- **Replit auto-injects its own `DATABASE_URL`** for a local provisioned Postgres. `src/config/database.ts` deliberately ignores any pre-set `DATABASE_URL` when `DB_HOST`/`DB_PORT`/`DB_NAME`/`DB_USER`/`DB_PASSWORD` are present, to avoid silently connecting to the wrong (empty) database. **This override only applies to the running app** — raw `npx prisma db push`/`migrate` CLI calls read `DATABASE_URL` directly from the shell and will silently hit the wrong (local) DB unless you pass the correct external `DATABASE_URL` inline (see the Run & Operate command above). Always confirm the CLI's printed "Datasource" line shows the external host before trusting the result.
- **BigInt columns** (e.g. legacy `timestamp` field on `leads`) aren't JSON-serializable by default — `src/lib/bigint.ts` patches `BigInt.prototype.toJSON` globally; it's imported first in `src/index.ts`.
- AI calling, WhatsApp automation (beyond the existing legacy tables), AI poster generation, and subscription/billing modules have provider scaffolds in place but are **not connected to a live vendor** — they require external provider credentials (e.g. Twilio/WhatsApp Business API, an AI calling vendor, Razorpay/Stripe) that haven't been supplied yet. Endpoints return HTTP 503 until configured.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
