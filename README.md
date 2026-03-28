# 92Glory0

Production-ready Next.js + Prisma project for 92Glory0.

## Requirements
- Node.js `20+`
- `pnpm` `10+`

## Environment Variables
Create `.env` (or set these in Hostinger panel):

```env
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="change-me-please"
ADMIN_PANEL_EMAIL="admin@clyrotech.com"
ADMIN_PANEL_PASSWORD="admin@786"
# Optional: enable runtime seeding in production
# ENABLE_RUNTIME_SEED="true"
```

## Local Run
1. Install deps:
   - `pnpm install`
2. Create/update DB schema:
   - `pnpm db:migrate`
3. Run dev server:
   - `pnpm dev`

## Production Build
1. Install deps:
   - `pnpm install`
2. Build:
   - `pnpm build`
3. Start:
   - `pnpm start`

`pnpm start` now binds `0.0.0.0` and uses runtime `PORT` automatically.

## Hostinger Deploy (Recommended)
1. Set environment variables in Hostinger:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `ADMIN_PANEL_EMAIL`
   - `ADMIN_PANEL_PASSWORD`
2. Build command:
   - `pnpm install && pnpm build`
3. Start command:
   - `pnpm start`
4. One-time DB migration (run in Hostinger terminal):
   - `pnpm db:migrate`

## Health Check
Home page depends on `/api/home`. If needed, test directly:
- `https://your-domain.com/api/home`

