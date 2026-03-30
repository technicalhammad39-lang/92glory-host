import { access, cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

const rootDir = process.cwd();
const nextDir = path.join(rootDir, '.next');
const standaloneDir = path.join(nextDir, 'standalone');
const staticSrcDir = path.join(nextDir, 'static');
const staticDestDir = path.join(standaloneDir, '.next', 'static');
const publicSrcDir = path.join(rootDir, 'public');
const publicDestDir = path.join(standaloneDir, 'public');

async function exists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function copyDir(source, destination) {
  await mkdir(path.dirname(destination), { recursive: true });
  await rm(destination, { recursive: true, force: true });
  await cp(source, destination, { recursive: true, force: true });
}

async function main() {
  if (!(await exists(standaloneDir))) {
    console.log('[prepare-standalone] Skipped: .next/standalone not found.');
    return;
  }

  if (await exists(staticSrcDir)) {
    await copyDir(staticSrcDir, staticDestDir);
    console.log('[prepare-standalone] Copied .next/static -> .next/standalone/.next/static');
  } else {
    console.warn('[prepare-standalone] Warning: .next/static not found.');
  }

  if (await exists(publicSrcDir)) {
    await copyDir(publicSrcDir, publicDestDir);
    console.log('[prepare-standalone] Copied public -> .next/standalone/public');
  } else {
    console.warn('[prepare-standalone] Warning: public directory not found.');
  }
}

main().catch((error) => {
  console.error('[prepare-standalone] Failed:', error);
  process.exit(1);
});
