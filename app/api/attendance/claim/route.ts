import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/api-helpers';
import { apiError } from '@/lib/api-error';
import { dayKey, toMoney } from '@/lib/feature-utils';
import { TX_OPTIONS } from '@/lib/tx-options';

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

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const todayKey = dayKey();
    const setting = await db.attendanceSetting.findFirst();
    if (!setting) return NextResponse.json({ error: 'Attendance setting not configured.' }, { status: 503 });

    const [depositTotal, totalClaims] = await Promise.all([
      db.transaction.aggregate({
        _sum: { amount: true },
        where: { userId: user.id, type: 'DEPOSIT', status: 'COMPLETED' }
      }),
      db.attendanceClaim.count({ where: { userId: user.id } })
    ]);

    const deposited = Number(depositTotal._sum.amount || 0);
    if (deposited < Number(setting.minDepositAmount || 500)) {
      return NextResponse.json({ error: `Minimum deposit Rs${Number(setting.minDepositAmount || 500)} required.` }, { status: 400 });
    }

    if (setting.oneTimeOnly && totalClaims > 0) {
      return NextResponse.json({ error: 'Attendance can only be claimed once.' }, { status: 400 });
    }

    const claim = await db.$transaction(async (tx) => {
      const already = await tx.attendanceClaim.findUnique({
        where: { userId_dayKey: { userId: user.id, dayKey: todayKey } }
      });
      if (already) throw new Error('ALREADY_CLAIMED');

      let todayRecord = await tx.attendanceRecord.findUnique({
        where: { userId_dayKey: { userId: user.id, dayKey: todayKey } }
      });

      if (!todayRecord) {
        const now = new Date();
        const prev = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        const prevKey = dayKey(prev);
        const yesterday = await tx.attendanceRecord.findUnique({
          where: { userId_dayKey: { userId: user.id, dayKey: prevKey } }
        });
        todayRecord = await tx.attendanceRecord.create({
          data: {
            userId: user.id,
            dayKey: todayKey,
            consecutiveDays: yesterday ? Math.min(7, yesterday.consecutiveDays + 1) : 1
          }
        });
      }

      const dayNumber = Math.max(1, Math.min(7, todayRecord.consecutiveDays));
      const amount = toMoney(rewardByDay(setting, dayNumber));
      if (amount <= 0) throw new Error('INVALID_REWARD');

      const created = await tx.attendanceClaim.create({
        data: {
          userId: user.id,
          dayKey: todayKey,
          dayNumber,
          amount
        }
      });

      await tx.user.update({
        where: { id: user.id },
        data: { balance: { increment: amount } }
      });

      await tx.transaction.create({
        data: {
          userId: user.id,
          type: 'BONUS',
          amount,
          status: 'COMPLETED',
          meta: JSON.stringify({
            source: 'attendance_bonus',
            dayKey: todayKey,
            dayNumber
          })
        }
      });

      return created;
    }, TX_OPTIONS);

    return NextResponse.json({ success: true, claim });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'ALREADY_CLAIMED') {
        return NextResponse.json({ error: 'Attendance already claimed today.' }, { status: 400 });
      }
      if (error.message === 'INVALID_REWARD') {
        return NextResponse.json({ error: 'Attendance reward is invalid.' }, { status: 400 });
      }
    }
    return apiError('attendance.claim.post', error);
  }
}
