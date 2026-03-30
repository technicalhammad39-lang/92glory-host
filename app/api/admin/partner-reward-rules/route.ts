import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-helpers';
import { db } from '@/lib/db';
import { apiError } from '@/lib/api-error';

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const rules = await db.partnerRewardRule.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }]
    });
    return NextResponse.json({ rules });
  } catch (error) {
    return apiError('admin.partner-reward-rules.get', error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const rule = await db.partnerRewardRule.create({
      data: {
        stage: String(body.stage || '').trim(),
        minAmount: Number(body.minAmount || 0),
        maxAmount: Number(body.maxAmount || 0),
        minTurnover: Number(body.minTurnover || 0),
        bonusAmount: Number(body.bonusAmount || 0),
        order: Number(body.order || 0),
        isActive: body.isActive === undefined ? true : Boolean(body.isActive)
      }
    });
    return NextResponse.json({ rule });
  } catch (error) {
    return apiError('admin.partner-reward-rules.post', error);
  }
}

