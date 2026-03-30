import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-helpers';
import { db } from '@/lib/db';
import { apiError } from '@/lib/api-error';

const defaultSetting = {
  minDepositAmount: 500,
  oneTimeOnly: false,
  day1Reward: 15,
  day2Reward: 25,
  day3Reward: 45,
  day4Reward: 85,
  day5Reward: 110,
  day6Reward: 140,
  day7Reward: 180
};

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const item = await db.attendanceSetting.findFirst();
    return NextResponse.json({ setting: item || defaultSetting });
  } catch (error) {
    return apiError('admin.attendance-setting.get', error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const existing = await db.attendanceSetting.findFirst();

    const payload = {
      minDepositAmount: Number(body.minDepositAmount ?? existing?.minDepositAmount ?? 500),
      oneTimeOnly: Boolean(body.oneTimeOnly ?? existing?.oneTimeOnly ?? false),
      day1Reward: Number(body.day1Reward ?? existing?.day1Reward ?? 15),
      day2Reward: Number(body.day2Reward ?? existing?.day2Reward ?? 25),
      day3Reward: Number(body.day3Reward ?? existing?.day3Reward ?? 45),
      day4Reward: Number(body.day4Reward ?? existing?.day4Reward ?? 85),
      day5Reward: Number(body.day5Reward ?? existing?.day5Reward ?? 110),
      day6Reward: Number(body.day6Reward ?? existing?.day6Reward ?? 140),
      day7Reward: Number(body.day7Reward ?? existing?.day7Reward ?? 180)
    };

    const setting = existing
      ? await db.attendanceSetting.update({ where: { id: existing.id }, data: payload })
      : await db.attendanceSetting.create({ data: payload });

    return NextResponse.json({ setting });
  } catch (error) {
    return apiError('admin.attendance-setting.put', error);
  }
}

