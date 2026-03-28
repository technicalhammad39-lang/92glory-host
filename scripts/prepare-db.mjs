import { spawnSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const prismaCliPath = path.join(process.cwd(), 'node_modules', 'prisma', 'build', 'index.js');

function runPrisma(args) {
  const result = spawnSync(process.execPath, [prismaCliPath, ...args], {
    env: process.env,
    stdio: 'pipe',
    encoding: 'utf8'
  });

  if (result.error) {
    return {
      code: 1,
      stdout: '',
      stderr: result.error.message
    };
  }

  return {
    code: result.status ?? 1,
    stdout: result.stdout || '',
    stderr: result.stderr || ''
  };
}

function printResult(result) {
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
}

const firstDeploy = runPrisma(['migrate', 'deploy']);
if (firstDeploy.code === 0) {
  printResult(firstDeploy);
  process.exit(0);
}

const output = `${firstDeploy.stdout}\n${firstDeploy.stderr}`;
if (!output.includes('P3005')) {
  printResult(firstDeploy);
  process.exit(firstDeploy.code);
}

const migrationsPath = path.join(process.cwd(), 'prisma', 'migrations');
const migrations = readdirSync(migrationsPath)
  .filter((name) => /^\d+_.+/.test(name))
  .filter((name) => statSync(path.join(migrationsPath, name)).isDirectory())
  .sort();

if (migrations.length === 0) {
  printResult(firstDeploy);
  process.stderr.write('\n[DB] Cannot resolve P3005: no migration directories found.\n');
  process.exit(firstDeploy.code);
}

const baselineMigration = migrations[0];
process.stderr.write(
  `[DB] P3005 detected. Marking baseline migration as applied: ${baselineMigration}\n`
);

const resolve = runPrisma(['migrate', 'resolve', '--applied', baselineMigration]);
printResult(resolve);
if (resolve.code !== 0) process.exit(resolve.code);

const secondDeploy = runPrisma(['migrate', 'deploy']);
printResult(secondDeploy);
process.exit(secondDeploy.code);
