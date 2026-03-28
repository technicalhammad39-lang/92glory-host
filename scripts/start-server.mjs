import { spawn } from 'node:child_process';
import process from 'node:process';
import { createRequire } from 'node:module';

const port = process.env.PORT || '3000';
const host = process.env.HOST || '0.0.0.0';
const require = createRequire(import.meta.url);

const child = spawn(
  process.execPath,
  [require.resolve('next/dist/bin/next'), 'start', '-p', String(port), '-H', String(host)],
  { stdio: 'inherit', env: process.env }
);

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
