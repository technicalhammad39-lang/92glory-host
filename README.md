# 92Glory0

Next.js + Prisma (MySQL) project.

## Requirements
- Node.js `20+`
- `pnpm` `10+`

## Environment Variables
Create `.env.local` for local, and add the same keys in Hostinger App settings for production.

```env
# Required (MySQL only)
DATABASE_URL="mysql://DB_USER:DB_PASSWORD@DB_HOST:3306/DB_NAME?connection_limit=5&pool_timeout=20"

# Required
JWT_SECRET="replace-with-a-long-random-secret"
ADMIN_PANEL_EMAIL="admin@clyrotech.com"
ADMIN_PANEL_PASSWORD="admin@786"

# Optional (production): set true only when you want automatic first-time data seed
# ENABLE_RUNTIME_SEED="true"
```

Do not paste markdown/email wrappers into `DATABASE_URL`.
Valid example with your Hostinger host:
`mysql://u956471375_gloryuser:92Glory786@srv547.hstgr.io:3306/u956471375_92glorydb`

## Local Setup
1. Install dependencies:
   - `pnpm install`
2. Set MySQL env in `.env.local`.
3. Run migrations (creates tables):
   - `pnpm db:migrate`
4. Start dev server:
   - `pnpm dev`

## Scripts
- `pnpm db:migrate` -> apply committed migrations (`prisma migrate deploy`)
- `pnpm db:prepare` -> deploy migrations, and auto-baseline on `P3005` (non-empty DB without migration history)
- `pnpm db:migrate:dev` -> create/apply new migration in development
- `pnpm db:status` -> migration status
- `pnpm build:hostinger` -> db prepare + build

## Hostinger Git Deployment (Node.js App)
1. In Hostinger Node.js app, connect this GitHub repo/branch.
2. Set Node.js version to `20+`.
3. Add env vars in Hostinger:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `ADMIN_PANEL_EMAIL`
   - `ADMIN_PANEL_PASSWORD`
   - Optional: `ENABLE_RUNTIME_SEED=true` (recommended for first bootstrap)
4. Build command:
   - `pnpm install --frozen-lockfile && pnpm build:hostinger`
5. Start command:
   - `pnpm start`
6. Redeploy after each push to GitHub.

If your DB already had tables but no `_prisma_migrations`, `db:prepare` handles this automatically.

## Health Checks
- `GET /api/health` -> DB connectivity status
- `GET /api/home` -> homepage payload

If `DATABASE_URL` is missing/invalid, `/api/health` returns `503` with a config error message.
