import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-helpers';
import { db } from '@/lib/db';
import { apiError } from '@/lib/api-error';

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));

    const payload: Record<string, unknown> = {};
    if (body.code !== undefined) payload.code = String(body.code || '').trim().toUpperCase();
    if (body.rewardAmount !== undefined) payload.rewardAmount = Number(body.rewardAmount || 0);
    if (body.maxTotalClaims !== undefined) payload.maxTotalClaims = Number(body.maxTotalClaims || 0);
    if (body.perUserLimit !== undefined) payload.perUserLimit = Number(body.perUserLimit || 1);
    if (body.isActive !== undefined) payload.isActive = Boolean(body.isActive);
    if (body.expiresAt !== undefined) {
      const value = String(body.expiresAt || '').trim();
      payload.expiresAt = value ? new Date(value) : null;
    }

    const giftCode = await db.giftCode.update({
      where: { id },
      data: payload
    });
    return NextResponse.json({ giftCode });
  } catch (error) {
    return apiError('admin.gift-codes.id.put', error);
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await context.params;
    await db.giftCode.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError('admin.gift-codes.id.delete', error);
  }
}

