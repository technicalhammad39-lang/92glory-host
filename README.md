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
- `pnpm db:migrate:dev` -> create/apply new migration in development
- `pnpm db:status` -> migration status
- `pnpm build:hostinger` -> migrate + build

## Hostinger Git Deployment (Node.js App)
1. In Hostinger Node.js app, connect this GitHub repo/branch.
2. Set Node.js version to `20+`.
3. Add env vars in Hostinger:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `ADMIN_PANEL_EMAIL`
   - `ADMIN_PANEL_PASSWORD`
   - Optional: `ENABLE_RUNTIME_SEED=true` (only for first bootstrap)
4. Build command:
   - `pnpm install --frozen-lockfile && pnpm build:hostinger`
5. Start command:
   - `pnpm start`
6. Redeploy after each push to GitHub.

## Health Checks
- `GET /api/health` -> DB connectivity status
- `GET /api/home` -> homepage payload

If `DATABASE_URL` is missing/invalid, `/api/health` returns `503` with a config error message.
