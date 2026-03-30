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
    const rule = await db.partnerRewardRule.update({
      where: { id },
      data: {
        stage: body.stage === undefined ? undefined : String(body.stage || '').trim(),
        minAmount: body.minAmount === undefined ? undefined : Number(body.minAmount || 0),
        maxAmount: body.maxAmount === undefined ? undefined : Number(body.maxAmount || 0),
        minTurnover: body.minTurnover === undefined ? undefined : Number(body.minTurnover || 0),
        bonusAmount: body.bonusAmount === undefined ? undefined : Number(body.bonusAmount || 0),
        order: body.order === undefined ? undefined : Number(body.order || 0),
        isActive: body.isActive === undefined ? undefined : Boolean(body.isActive)
      }
    });
    return NextResponse.json({ rule });
  } catch (error) {
    return apiError('admin.partner-reward-rules.id.put', error);
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await context.params;
    await db.partnerRewardRule.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError('admin.partner-reward-rules.id.delete', error);
  }
}

