# 92 Glory0 (Next.js + Prisma)

## Requirements
- Node.js 20+
- MySQL database

## Local Setup
1. Install dependencies:
```bash
npm install
```
2. Create env file from example and set values:
```bash
cp .env.example .env.local
```
3. Update `.env.local`:
- `DATABASE_URL` (VPS local MySQL connection string)
- `JWT_SECRET`
- `ADMIN_PANEL_EMAIL`
- `ADMIN_PANEL_PASSWORD`
- `AUTO_SEED=true` (default)

4. Push/sync Prisma schema to your database:
```bash
npx prisma db push
npm run db:sync
```

5. Start dev server:
```bash
npm run dev
```

## Production
1. Build:
```bash
pnpm build
```
2. Start:
```bash
pnpm start
```

### VPS Runtime
- After `pnpm build`, run the standalone server:
```bash
pnpm start:standalone
```
- `build` now auto-copies `public` and `.next/static` into `.next/standalone` so chunk/css files are always available in production.

### VPS MySQL (required)
- Use only the VPS local database:
```env
DATABASE_URL="mysql://gloryuser:92Glory786@127.0.0.1:3306/glorydb"
```
- Do not use the old Hostinger managed MySQL URL.

## Notes
- The app seeds default home/admin data automatically (unless `AUTO_SEED=false`).
- If your DB is new/empty, run `npx prisma db push` before first deployment.
