import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, requireAdmin } from '@/lib/api-helpers';
import { apiError } from '@/lib/api-error';
import { dayKey, parseMeta, startOfDay, startOfWeek, toMoney, weekKey } from '@/lib/feature-utils';

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

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const user = admin ? null : await getAuthUser(req);
    if (!admin && !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const includeInactive = admin && url.searchParams.get('all') === '1';
    const tasks = await db.activityTask.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }]
    });

    if (!user) {
      return NextResponse.json({ tasks });
    }

    const dailyRange = getRange('DAILY');
    const weeklyRange = getRange('WEEKLY');
    const [trxDaily, trxWeekly] = await Promise.all([
      db.transaction.findMany({
        where: {
          userId: user.id,
          type: 'GAME_LOSS',
          status: 'COMPLETED',
          createdAt: { gte: dailyRange.start, lte: dailyRange.end }
        },
        select: { amount: true, meta: true }
      }),
      db.transaction.findMany({
        where: {
          userId: user.id,
          type: 'GAME_LOSS',
          status: 'COMPLETED',
          createdAt: { gte: weeklyRange.start, lte: weeklyRange.end }
        },
        select: { amount: true, meta: true }
      })
    ]);

    const getProgress = (task: { gameType: string; period: PeriodKind }) => {
      const source = task.period === 'WEEKLY' ? trxWeekly : trxDaily;
      const taskGame = String(task.gameType || 'SLOT').toUpperCase();
      return toMoney(
        source.reduce((sum, trx) => {
          const category = classifyGame(parseMeta<Record<string, unknown>>(trx.meta));
          if (taskGame !== 'ALL' && category !== taskGame) return sum;
          return sum + Number(trx.amount || 0);
        }, 0)
      );
    };

    const result = await Promise.all(
      tasks.map(async (task) => {
        const periodKey = task.period === 'WEEKLY' ? weeklyRange.periodKey : dailyRange.periodKey;
        const progress = getProgress(task);
        const [claimed, stored] = await Promise.all([
          db.activityTaskClaim.findUnique({
            where: { taskId_userId_periodKey: { taskId: task.id, userId: user.id, periodKey } }
          }),
          db.activityTaskProgress.upsert({
            where: { taskId_userId_periodKey: { taskId: task.id, userId: user.id, periodKey } },
            update: { progressAmount: progress },
            create: { taskId: task.id, userId: user.id, periodKey, progressAmount: progress }
          })
        ]);

        return {
          ...task,
          periodKey,
          progressAmount: stored.progressAmount,
          progressPercent: task.targetAmount > 0 ? Math.min(100, Math.round((progress / task.targetAmount) * 100)) : 0,
          canClaim: !claimed && progress >= Number(task.targetAmount || 0),
          claimed: Boolean(claimed)
        };
      })
    );

    return NextResponse.json({ tasks: result });
  } catch (error) {
    return apiError('activity.tasks.get', error);
  }
}

