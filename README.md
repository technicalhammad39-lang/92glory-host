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
- `DATABASE_URL` (MySQL connection string)
- `JWT_SECRET`
- `ADMIN_PANEL_EMAIL`
- `ADMIN_PANEL_PASSWORD`
- `AUTO_SEED=true` (default)

4. Push Prisma schema to your database:
```bash
npx prisma db push
```

5. Start dev server:
```bash
npm run dev
```

## Production
1. Build:
```bash
npm run build
```
2. Start:
```bash
npm run start
```

## Notes
- The app seeds default home/admin data automatically (unless `AUTO_SEED=false`).
- If your DB is new/empty, run `npx prisma db push` before first deployment.
