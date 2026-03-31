# 92 Glory0 (Next.js + Prisma + MySQL)

## Environment Matrix
- Local development/testing (VS Code/Codex): `.env.local` -> **Hostinger MySQL**
- VPS production: `.env` -> **VPS local MySQL (127.0.0.1)**
- Prisma provider remains `mysql` and `schema.prisma` continues to use `env("DATABASE_URL")`.

## Required Env Files

### Local (`.env.local`)
Use this exact DB URL for local dev/test:
```env
DATABASE_URL="mysql://u956471375_gloryuser:92Glory786@srv547.hstgr.io:3306/u956471375_92glorydb"
```

### VPS (`.env`)
Use this exact DB URL on production VPS only:
```env
DATABASE_URL="mysql://gloryuser:92Glory786@127.0.0.1:3306/glorydb"
```

### Examples in repo
- `.env.local.example` (Hostinger/local dev profile)
- `.env.vps.example` (VPS production profile)
- `.env.example` (base fallback + quick reference)

## Local Development Workflow
1. Install:
```bash
npm install
```
2. Create local env:
```bash
cp .env.local.example .env.local
```
3. Prisma (local profile is auto-selected by scripts):
```bash
npm run db:generate
npm run db:push
npm run db:sync
```
4. Run app:
```bash
npm run dev
```

## VPS Production Workflow
1. Ensure `.env.local` is **not present** on VPS.
2. Create/verify production env:
```bash
cp .env.vps.example .env
```
3. Before deploy/start:
```bash
npm install
npm run db:migrate:deploy
npm run db:sync:vps
npm run build:vps
```
4. Start production server:
```bash
npm run start:vps
```

`build:vps` and `start:vps` run a guard (`scripts/verify-vps-env.mjs`) that blocks startup if:
- `DATABASE_URL` is not local VPS MySQL (`127.0.0.1` / `localhost`)
- `.env.local` exists on VPS and may override `.env`

## After Git Push (on VPS)
```bash
git pull origin main
npm install
npm run db:migrate:deploy
npm run db:sync:vps
npm run build:vps
# restart app process (pm2/systemd) using npm run start:vps
```

## Notes
- `.env*` files are git-ignored; only example env files are tracked.
- Keep production and development databases isolated.
- Do not reuse Hostinger dev DB in VPS production runtime.

