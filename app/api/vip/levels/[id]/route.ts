import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-helpers';
import { apiError } from '@/lib/api-error';

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));

    const levelValue = Number(body.level);
    if (!Number.isFinite(levelValue) || levelValue < 0) {
      return NextResponse.json({ error: 'Invalid level value.' }, { status: 400 });
    }

    const level = await db.vipLevel.update({
      where: { id },
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
    return apiError('vip.levels.put', error);
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await db.vipLevel.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError('vip.levels.delete', error);
  }
}
