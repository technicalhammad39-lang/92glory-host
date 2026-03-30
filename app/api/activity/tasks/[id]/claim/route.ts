import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/api-helpers';
import { apiError } from '@/lib/api-error';
import { dayKey, parseMeta, startOfDay, startOfWeek, toMoney, weekKey } from '@/lib/feature-utils';
import { TX_OPTIONS } from '@/lib/tx-options';

type PeriodKind = 'DAILY' | 'WEEKLY';

function getRange(period: PeriodKind) {
  const now = new Date();
  if (period === 'WEEKLY') {
    return { start: startOfWeek(now), end: now, periodKey: weekKey(now) };
  }
  return {
    start: startOfDay(now),
    end: now,
    periodKey: dayKey(now)
  };
}

function classifyGame(meta: Record<string, unknown>) {
  const raw = String(meta.game || meta.gameType || meta.category || '').toUpperCase();
  if (raw.includes('WINGO') || raw.includes('LOTTERY')) return 'LOTTERY';
  if (raw.includes('FISH')) return 'FISH';
  if (raw.includes('VIDEO') || raw.includes('CASINO')) return 'CASINO';
  return 'SLOT';
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await context.params;

    const task = await db.activityTask.findUnique({ where: { id } });
    if (!task || !task.isActive) {
      return NextResponse.json({ error: 'Task not available.' }, { status: 404 });
    }

    const range = getRange(task.period);
    const losses = await db.transaction.findMany({
      where: {
        userId: user.id,
        type: 'GAME_LOSS',
        status: 'COMPLETED',
        createdAt: { gte: range.start, lte: range.end }
      },
      select: { amount: true, meta: true }
    });

    const taskGame = String(task.gameType || 'SLOT').toUpperCase();
    const progress = toMoney(
      losses.reduce((sum, row) => {
        const category = classifyGame(parseMeta<Record<string, unknown>>(row.meta));
        if (taskGame !== 'ALL' && category !== taskGame) return sum;
        return sum + Number(row.amount || 0);
      }, 0)
    );

    if (progress < Number(task.targetAmount || 0)) {
      return NextResponse.json({ error: 'Task target not completed.' }, { status: 400 });
    }

    const claimed = await db.$transaction(async (tx) => {
      const existing = await tx.activityTaskClaim.findUnique({
        where: {
          taskId_userId_periodKey: {
            taskId: task.id,
            userId: user.id,
            periodKey: range.periodKey
          }
        }
      });
      if (existing) throw new Error('ALREADY');

      const rewardAmount = toMoney(task.rewardAmount);
      const claim = await tx.activityTaskClaim.create({
        data: {
          taskId: task.id,
          userId: user.id,
          periodKey: range.periodKey,
          amount: rewardAmount
        }
      });

      await tx.activityTaskProgress.upsert({
        where: {
          taskId_userId_periodKey: {
            taskId: task.id,
            userId: user.id,
            periodKey: range.periodKey
          }
        },
        update: { progressAmount: progress },
        create: {
          taskId: task.id,
          userId: user.id,
          periodKey: range.periodKey,
          progressAmount: progress
        }
      });

      await tx.user.update({
        where: { id: user.id },
        data: { balance: { increment: rewardAmount } }
      });

      await tx.transaction.create({
        data: {
          userId: user.id,
          type: 'BONUS',
          amount: rewardAmount,
          status: 'COMPLETED',
          meta: JSON.stringify({
            source: 'activity_task',
            taskId: task.id,
            periodKey: range.periodKey
          })
        }
      });

      return claim;
    }, TX_OPTIONS);

    return NextResponse.json({ success: true, claim: claimed });
  } catch (error) {
    if (error instanceof Error && error.message === 'ALREADY') {
      return NextResponse.json({ error: 'Reward already claimed for this period.' }, { status: 400 });
    }
    return apiError('activity.tasks.id.claim.post', error);
  }
}
