import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/api-helpers';
import { apiError } from '@/lib/api-error';
import { dayKey, startOfDay, toMoney } from '@/lib/feature-utils';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const periodKey = dayKey();
    const [setting, betTotal, existing, history] = await Promise.all([
      db.jackpotSetting.findFirst(),
      db.transaction.aggregate({
        _sum: { amount: true },
        where: {
          userId: user.id,
          type: 'GAME_LOSS',
          status: 'COMPLETED',
          createdAt: { gte: startOfDay() }
        }
      }),
      db.jackpotClaim.findUnique({
        where: { userId_periodKey: { userId: user.id, periodKey } }
      }),
      db.jackpotClaim.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 100
      })
    ]);

    if (!setting) return NextResponse.json({ error: 'Jackpot setting not configured.' }, { status: 503 });

    const eligibleAmount = toMoney(Number(betTotal._sum.amount || 0));
    let current = existing;
    if (!current && setting.isActive && eligibleAmount >= Number(setting.minBetAmount || 0)) {
      const now = new Date();
      current = await db.jackpotClaim.create({
        data: {
          userId: user.id,
          periodKey,
          eligibleAmount,
          rewardAmount: toMoney(setting.rewardAmount),
          status: 'ELIGIBLE',
          eligibleAt: now,
          expiresAt: new Date(now.getTime() + Number(setting.validDays || 7) * 24 * 60 * 60 * 1000)
        }
      });
    }

    return NextResponse.json({
      setting,
      periodKey,
      eligibleAmount,
      current,
      history
    });
  } catch (error) {
    return apiError('jackpot.get', error);
  }
}

