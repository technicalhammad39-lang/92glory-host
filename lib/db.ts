import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

const rawDatabaseUrl = process.env.DATABASE_URL?.trim();
const fallbackUrl = 'mysql://invalid:invalid@127.0.0.1:1/invalid';

function sanitizeDatabaseUrl(url?: string) {
  if (!url) return url;
  if (!url.includes('(mailto:') || !url.includes('[') || !url.includes(']')) return url;

  // Handle accidentally pasted markdown-style DSN:
  // mysql://user:[password@host](mailto:password@host):3306/db
  const match = url.match(/^(mysql:\/\/[^:]+:)\[([^\]]+)\]\(mailto:[^)]+\)(:[0-9]+\/.+)$/i);
  if (!match) return url;

  const prefix = match[1];
  const combined = match[2];
  const suffix = match[3];
  const at = combined.lastIndexOf('@');
  if (at === -1) return url;

  const password = combined.slice(0, at);
  const host = combined.slice(at + 1);
  const normalized = `${prefix}${password}@${host}${suffix}`;
  return normalized;
}

const normalizedDatabaseUrl = sanitizeDatabaseUrl(rawDatabaseUrl);
if (normalizedDatabaseUrl && normalizedDatabaseUrl !== rawDatabaseUrl) {
  process.env.DATABASE_URL = normalizedDatabaseUrl;
  console.warn('[DB] DATABASE_URL was auto-normalized from markdown format.');
}

function validateDatabaseUrl(url?: string) {
  if (!url) return { ok: false, message: 'DATABASE_URL is missing.' };
  if (!url.toLowerCase().startsWith('mysql://')) {
    return { ok: false, message: 'DATABASE_URL must start with mysql://.' };
  }
  if (url.includes('mailto:') || url.includes('[') || url.includes(']') || url.includes('(') || url.includes(')')) {
    return {
      ok: false,
      message: 'DATABASE_URL includes invalid formatting. Use a plain MySQL URL.'
    };
  }

  try {
    const parsed = new URL(url);
    if (!parsed.hostname) return { ok: false, message: 'DATABASE_URL host is missing.' };
    if (!parsed.pathname || parsed.pathname === '/') {
      return { ok: false, message: 'DATABASE_URL database name is missing.' };
    }
    return { ok: true, message: '' };
  } catch {
    return { ok: false, message: 'DATABASE_URL is not a valid URL.' };
  }
}

const databaseUrlValidation = validateDatabaseUrl(normalizedDatabaseUrl);
if (!databaseUrlValidation.ok) {
  console.error(`[DB] ${databaseUrlValidation.message}`);
}

const createClient = () =>
  new PrismaClient(
    databaseUrlValidation.ok
      ? undefined
      : {
          datasources: {
            db: {
              url: fallbackUrl
            }
          }
        }
  );

export const db = global.prisma || createClient();
export const isDatabaseConfigured = databaseUrlValidation.ok;
export const databaseConfigError = databaseUrlValidation.ok ? '' : databaseUrlValidation.message;

if (process.env.NODE_ENV !== "production") global.prisma = db;
