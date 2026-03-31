import fs from 'node:fs';
import path from 'node:path';
import { getDatabaseHost, loadEnvTarget } from './env-loader.mjs';

const root = process.cwd();
const localEnvPath = path.join(root, '.env.local');
const loaded = loadEnvTarget('vps');
const databaseUrl = process.env.DATABASE_URL || '';
const host = getDatabaseHost(databaseUrl);

if (!databaseUrl) {
  process.stderr.write('[vps-env] DATABASE_URL missing in .env\n');
  process.exit(1);
}

if (!['127.0.0.1', 'localhost'].includes(host)) {
  process.stderr.write(
    `[vps-env] DATABASE_URL must point to VPS local MySQL (127.0.0.1/localhost). Current host: ${host || 'unknown'}\n`
  );
  process.exit(1);
}

if (fs.existsSync(localEnvPath)) {
  process.stderr.write('[vps-env] .env.local detected. Remove it from VPS to prevent env override confusion.\n');
  process.exit(1);
}

process.stdout.write(
  `[vps-env] OK. host=${host} files=${loaded.loadedFiles.join(',') || 'none'}\n`
);

