import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-helpers';
import { db } from '@/lib/db';
import { apiError } from '@/lib/api-error';

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const configs = await db.rebateConfig.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }]
    });
    return NextResponse.json({ configs });
  } catch (error) {
    return apiError('admin.rebate-config.get', error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));

    const config = await db.rebateConfig.create({
      data: {
        gameType: String(body.gameType || '').trim().toUpperCase(),
        title: String(body.title || '').trim() || String(body.gameType || '').trim().toUpperCase(),
        rate: Number(body.rate || 0),
        order: Number(body.order || 0),
        isActive: body.isActive === undefined ? true : Boolean(body.isActive)
      }
    });
    return NextResponse.json({ config });
  } catch (error) {
    return apiError('admin.rebate-config.post', error);
  }
}

