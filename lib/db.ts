import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
  var __dbUnavailableUntil: number | undefined;
  var __dbReadyUntil: number | undefined;
  var __dbReadinessProbe: Promise<boolean> | undefined;
}

if (!process.env.DATABASE_URL && process.env.NODE_ENV !== 'production') {
  console.warn('DATABASE_URL is not set. Configure it in your environment before using database-backed routes.');
}

const DB_UNAVAILABLE_COOLDOWN_MS = Number(process.env.DB_UNAVAILABLE_COOLDOWN_MS || 30_000);
const DB_READY_CACHE_MS = Number(process.env.DB_READY_CACHE_MS || 5_000);

function toBoundedInt(value: string | undefined, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const normalized = Math.floor(parsed);
  return Math.max(min, Math.min(max, normalized));
}

function getPrismaDatasourceUrl() {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) return undefined;
  if (!rawUrl.startsWith('mysql://')) return rawUrl;

  try {
    const url = new URL(rawUrl);
    const connectionLimit = toBoundedInt(process.env.DB_CONNECTION_LIMIT, 5, 1, 6);
    const poolTimeout = toBoundedInt(process.env.DB_POOL_TIMEOUT, 15, 10, 60);
    const connectTimeout = toBoundedInt(process.env.DB_CONNECT_TIMEOUT, 10, 5, 30);

    url.searchParams.set('connection_limit', String(connectionLimit));
    url.searchParams.set('pool_timeout', String(poolTimeout));
    url.searchParams.set('connect_timeout', String(connectTimeout));
    return url.toString();
  } catch {
    return rawUrl;
  }
}

const datasourceUrl = getPrismaDatasourceUrl();

export const db =
  global.prisma ||
  new PrismaClient(
    datasourceUrl
      ? {
          datasources: {
            db: { url: datasourceUrl }
          }
        }
      : undefined
  );

if (process.env.NODE_ENV !== "production") global.prisma = db;

export async function isDatabaseReady() {
  if (!process.env.DATABASE_URL) return false;
  if ((globalThis.__dbUnavailableUntil || 0) > Date.now()) return false;
  if ((globalThis.__dbReadyUntil || 0) > Date.now()) return true;
  if (globalThis.__dbReadinessProbe) return globalThis.__dbReadinessProbe;

  globalThis.__dbReadinessProbe = (async () => {
    try {
      await db.$queryRaw`SELECT 1`;
      globalThis.__dbUnavailableUntil = undefined;
      globalThis.__dbReadyUntil = Date.now() + DB_READY_CACHE_MS;
      return true;
    } catch (error) {
      globalThis.__dbUnavailableUntil = Date.now() + DB_UNAVAILABLE_COOLDOWN_MS;
      if (process.env.NODE_ENV !== 'production') {
        console.error('Database health check failed. Serving fallback temporarily.', error);
      }
      return false;
    } finally {
      globalThis.__dbReadinessProbe = undefined;
    }
  })();

  return globalThis.__dbReadinessProbe;
}
