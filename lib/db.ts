import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

const rawDatabaseUrl = process.env.DATABASE_URL?.trim();
const hasMySqlDatabaseUrl = Boolean(rawDatabaseUrl && rawDatabaseUrl.toLowerCase().startsWith('mysql://'));
const fallbackUrl = 'mysql://invalid:invalid@127.0.0.1:1/invalid';

if (!hasMySqlDatabaseUrl) {
  console.error('[DB] DATABASE_URL is missing/invalid. Expected a MySQL URL (mysql://...).');
}

const createClient = () =>
  new PrismaClient(
    hasMySqlDatabaseUrl
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
export const isDatabaseConfigured = hasMySqlDatabaseUrl;

if (process.env.NODE_ENV !== "production") global.prisma = db;
