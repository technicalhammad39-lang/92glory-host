import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-helpers';
import { apiError } from '@/lib/api-error';

export async function GET() {
  try {
    const levels = await db.vipLevel.findMany({ orderBy: { level: 'asc' } });
    return NextResponse.json({ levels });
  } catch (error) {
    return apiError('vip.levels.get', error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const levelValue = Number(body.level);
    if (!Number.isFinite(levelValue) || levelValue < 0) {
      return NextResponse.json({ error: 'Invalid level value.' }, { status: 400 });
    }

    const level = await db.vipLevel.create({
      data: {
        level: levelValue,
        title: body.title ? String(body.title) : null,
        expRequired: Number(body.expRequired ?? 0),
        payoutDays: Number(body.payoutDays ?? 5),
        betToExp: Number(body.betToExp ?? 100),
        isOpen: body.isOpen ?? true,
        cardImage: body.cardImage || null,
        badgeImage: body.badgeImage || null
      }
    });
    return NextResponse.json({ level });
  } catch (error) {
    return apiError('vip.levels.post', error);
  }
}
