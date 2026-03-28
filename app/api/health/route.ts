import { NextResponse } from 'next/server';
import { db, isDatabaseConfigured } from '@/lib/db';

export async function GET() {
  try {
    if (!isDatabaseConfigured) {
      return NextResponse.json(
        { ok: false, db: 'down', error: 'DATABASE_URL is missing or invalid for MySQL.' },
        { status: 503 }
      );
    }
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, db: 'up' });
  } catch (error) {
    console.error('[API:health]', error);
    return NextResponse.json({ ok: false, db: 'down' }, { status: 503 });
  }
}
