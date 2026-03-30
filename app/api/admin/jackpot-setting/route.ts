import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-helpers';
import { db } from '@/lib/db';
import { apiError } from '@/lib/api-error';

const defaultSetting = {
  minBetAmount: 10000,
  rewardAmount: 180,
  validDays: 7,
  isActive: true
};

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const setting = await db.jackpotSetting.findFirst();
    return NextResponse.json({ setting: setting || defaultSetting });
  } catch (error) {
    return apiError('admin.jackpot-setting.get', error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const existing = await db.jackpotSetting.findFirst();
    const payload = {
      minBetAmount: Number(body.minBetAmount ?? existing?.minBetAmount ?? 10000),
      rewardAmount: Number(body.rewardAmount ?? existing?.rewardAmount ?? 180),
      validDays: Number(body.validDays ?? existing?.validDays ?? 7),
      isActive: body.isActive === undefined ? (existing?.isActive ?? true) : Boolean(body.isActive)
    };
    const setting = existing
      ? await db.jackpotSetting.update({ where: { id: existing.id }, data: payload })
      : await db.jackpotSetting.create({ data: payload });
    return NextResponse.json({ setting });
  } catch (error) {
    return apiError('admin.jackpot-setting.put', error);
  }
}

