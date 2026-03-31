import { spawnSync } from 'node:child_process';

const target = process.argv[2] || 'local';
const env = { ...process.env, DB_ENV_TARGET: target };

process.stdout.write(`[db-sync] target=${target}\n`);

const result = spawnSync(process.execPath, ['scripts/sync-db-schema.mjs'], {
  env,
  stdio: 'inherit'
});

if (result.error) {
  process.stderr.write(`${result.error.message}\n`);
  process.exit(1);
}

process.exit(result.status ?? 1);

