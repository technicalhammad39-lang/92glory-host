import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/api-helpers';
import { apiError } from '@/lib/api-error';
import { dayKey, toMoney } from '@/lib/feature-utils';

function rewardByDay(setting: {
  day1Reward: number;
  day2Reward: number;
  day3Reward: number;
  day4Reward: number;
  day5Reward: number;
  day6Reward: number;
  day7Reward: number;
}, dayNumber: number) {
  const d = Math.max(1, Math.min(7, dayNumber));
  if (d === 1) return Number(setting.day1Reward || 0);
  if (d === 2) return Number(setting.day2Reward || 0);
  if (d === 3) return Number(setting.day3Reward || 0);
  if (d === 4) return Number(setting.day4Reward || 0);
  if (d === 5) return Number(setting.day5Reward || 0);
  if (d === 6) return Number(setting.day6Reward || 0);
  return Number(setting.day7Reward || 0);
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const todayKey = dayKey();
    const [setting, latestRecord, claimedToday, totalClaims, claims, depositTotal] = await Promise.all([
      db.attendanceSetting.findFirst(),
      db.attendanceRecord.findFirst({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } }),
      db.attendanceClaim.findUnique({ where: { userId_dayKey: { userId: user.id, dayKey: todayKey } } }),
      db.attendanceClaim.count({ where: { userId: user.id } }),
      db.attendanceClaim.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 60 }),
      db.transaction.aggregate({
        _sum: { amount: true },
        where: { userId: user.id, type: 'DEPOSIT', status: 'COMPLETED' }
      })
    ]);

    if (!setting) {
      return NextResponse.json({ error: 'Attendance setting not configured.' }, { status: 503 });
    }

    const consecutiveDays = latestRecord?.consecutiveDays || 0;
    const currentDay = Math.max(1, Math.min(7, consecutiveDays || 1));
    const rewardToday = toMoney(rewardByDay(setting, currentDay));
    const deposited = Number(depositTotal._sum.amount || 0);
    const oneTimeBlocked = setting.oneTimeOnly && totalClaims > 0;
    const eligible =
      deposited >= Number(setting.minDepositAmount || 500) &&
      !claimedToday &&
      !oneTimeBlocked &&
      Boolean(latestRecord && latestRecord.dayKey === todayKey);

    return NextResponse.json({
      setting,
      state: {
        dayKey: todayKey,
        consecutiveDays,
        currentDay,
        rewardToday,
        minDepositAmount: Number(setting.minDepositAmount || 500),
        totalDeposited: toMoney(deposited),
        claimedToday: Boolean(claimedToday),
        oneTimeBlocked,
        eligible
      },
      claims
    });
  } catch (error) {
    return apiError('attendance.get', error);
  }
}

