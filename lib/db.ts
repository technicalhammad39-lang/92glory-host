import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

const rawDatabaseUrl = process.env.DATABASE_URL?.trim();
const fallbackUrl = 'mysql://invalid:invalid@127.0.0.1:1/invalid';

function validateDatabaseUrl(url?: string) {
  if (!url) return { ok: false, message: 'DATABASE_URL is missing.' };
  if (!url.toLowerCase().startsWith('mysql://')) {
    return { ok: false, message: 'DATABASE_URL must start with mysql://.' };
  }
  if (url.includes('mailto:') || url.includes('[') || url.includes(']')) {
    return {
      ok: false,
      message: 'DATABASE_URL includes invalid markdown/email formatting. Use plain MySQL URL only.'
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

const databaseUrlValidation = validateDatabaseUrl(rawDatabaseUrl);
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
