import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { loadEnvTarget } from './env-loader.mjs';

const target = process.argv[2] || 'auto';
const prismaArgs = process.argv.slice(3);

if (!prismaArgs.length) {
  process.stderr.write('Usage: node scripts/run-prisma.mjs <local|vps|auto> <prisma args...>\n');
  process.exit(1);
}

const loaded = loadEnvTarget(target);
const isGenerateCommand = prismaArgs[0] === 'generate';

if (!process.env.DATABASE_URL) {
  if (isGenerateCommand) {
    process.env.DATABASE_URL = 'mysql://user:pass@127.0.0.1:3306/tempdb';
    process.stderr.write(
      `[prisma-env] DATABASE_URL missing. Using temporary URL for prisma generate. loaded=${loaded.loadedFiles.join(',') || 'none'}\n`
    );
  } else {
    process.stderr.write(`[prisma-env] DATABASE_URL not found. loaded=${loaded.loadedFiles.join(',') || 'none'}\n`);
    process.exit(1);
  }
}

process.stdout.write(
  `[prisma-env] target=${loaded.target} host=${loaded.databaseHost || 'unknown'} files=${loaded.loadedFiles.join(',') || 'none'}\n`
);

const prismaCliPath = path.join(process.cwd(), 'node_modules', 'prisma', 'build', 'index.js');
const result = spawnSync(process.execPath, [prismaCliPath, ...prismaArgs], {
  env: process.env,
  stdio: 'inherit'
});

if (result.error) {
  process.stderr.write(`${result.error.message}\n`);
  process.exit(1);
}

process.exit(result.status ?? 1);
