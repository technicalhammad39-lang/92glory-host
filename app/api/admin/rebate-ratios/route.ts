import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-helpers';
import { db } from '@/lib/db';
import { apiError } from '@/lib/api-error';

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const ratios = await db.rebateRatio.findMany({
      orderBy: [{ category: 'asc' }, { level: 'asc' }, { order: 'asc' }]
    });
    return NextResponse.json({ ratios });
  } catch (error) {
    return apiError('admin.rebate-ratios.get', error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const ratio = await db.rebateRatio.create({
      data: {
        category: String(body.category || 'LOTTERY').trim().toUpperCase(),
        level: Number(body.level || 0),
        depth: Number(body.depth || 1),
        ratio: Number(body.ratio || 0),
        order: Number(body.order || 0)
      }
    });
    return NextResponse.json({ ratio });
  } catch (error) {
    return apiError('admin.rebate-ratios.post', error);
  }
}

