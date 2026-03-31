import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const ROOT_ENV = path.join(ROOT, '.env');
const LOCAL_ENV = path.join(ROOT, '.env.local');

function parseEnvContent(content) {
  const parsed = {};
  const lines = content.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const eqIndex = line.indexOf('=');
    if (eqIndex <= 0) continue;

    const key = line.slice(0, eqIndex).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;

    let value = line.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    parsed[key] = value;
  }

  return parsed;
}

function applyEnvValues(values, override = false) {
  for (const [key, value] of Object.entries(values)) {
    if (override || process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf8');
  return parseEnvContent(content);
}

function normalizeTarget(target) {
  const normalized = String(target || 'auto').toLowerCase();
  if (normalized === 'local' || normalized === 'vps' || normalized === 'auto') return normalized;
  return 'auto';
}

export function getDatabaseHost(databaseUrl) {
  try {
    return new URL(String(databaseUrl || '')).hostname || '';
  } catch {
    return '';
  }
}

export function loadEnvTarget(target = 'auto') {
  const normalizedTarget = normalizeTarget(target);
  const loadedFiles = [];

  if (normalizedTarget === 'vps') {
    if (fs.existsSync(ROOT_ENV)) {
      applyEnvValues(readEnvFile(ROOT_ENV), true);
      loadedFiles.push('.env');
    }
  } else {
    if (fs.existsSync(ROOT_ENV)) {
      applyEnvValues(readEnvFile(ROOT_ENV), false);
      loadedFiles.push('.env');
    }

    if (fs.existsSync(LOCAL_ENV)) {
      const shouldOverride = normalizedTarget === 'local' || normalizedTarget === 'auto';
      applyEnvValues(readEnvFile(LOCAL_ENV), shouldOverride);
      loadedFiles.push('.env.local');
    }
  }

  return {
    target: normalizedTarget,
    loadedFiles,
    databaseUrl: process.env.DATABASE_URL || '',
    databaseHost: getDatabaseHost(process.env.DATABASE_URL || '')
  };
}

