import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/api-helpers';
import { apiError } from '@/lib/api-error';
import { parseMeta, startOfDay, startOfMonth, startOfWeek, toMoney } from '@/lib/feature-utils';

type PeriodKey = 'today' | 'yesterday' | 'week' | 'month';
type StatKey = 'lottery' | 'video' | 'slot' | 'fish';

function getRange(period: PeriodKey) {
  const now = new Date();
  if (period === 'today') {
    const start = startOfDay(now);
    return { start, end: new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1) };
  }

  if (period === 'yesterday') {
    const today = startOfDay(now);
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
    return { start, end: today };
  }

  if (period === 'week') {
    const start = startOfWeek(now);
    return { start, end: now };
  }

  const start = startOfMonth(now);
  return { start, end: now };
}

function normalizeCategory(meta: Record<string, unknown>): StatKey {
  const rawGame = String(meta.game || meta.gameType || meta.category || '').toUpperCase();
  if (rawGame.includes('WINGO') || rawGame.includes('LOTTERY')) return 'lottery';
  if (rawGame.includes('VIDEO') || rawGame.includes('CASINO')) return 'video';
  if (rawGame.includes('FISH')) return 'fish';
  return 'slot';
}

function baseStats() {
  return {
    lottery: { totalBet: 0, betCount: 0, winningAmount: 0 },
    video: { totalBet: 0, betCount: 0, winningAmount: 0 },
    slot: { totalBet: 0, betCount: 0, winningAmount: 0 },
    fish: { totalBet: 0, betCount: 0, winningAmount: 0 }
  };
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const period = (String(url.searchParams.get('period') || 'today').toLowerCase() as PeriodKey);
    const safePeriod: PeriodKey = ['today', 'yesterday', 'week', 'month'].includes(period) ? period : 'today';
    const { start, end } = getRange(safePeriod);

    const [transactions, wingoCount] = await Promise.all([
      db.transaction.findMany({
        where: {
          userId: user.id,
          type: { in: ['GAME_LOSS', 'GAME_WIN'] },
          status: 'COMPLETED',
          createdAt: { gte: start, lt: end }
        },
        select: {
          type: true,
          amount: true,
          meta: true
        }
      }),
      db.wingoBet.count({
        where: {
          userId: user.id,
          createdAt: { gte: start, lt: end }
        }
      })
    ]);

    const stats = baseStats();
    for (const trx of transactions) {
      const meta = parseMeta<Record<string, unknown>>(trx.meta);
      const key = normalizeCategory(meta);
      if (trx.type === 'GAME_LOSS') {
        stats[key].totalBet = toMoney(stats[key].totalBet + Number(trx.amount || 0));
        stats[key].betCount += 1;
      } else if (trx.type === 'GAME_WIN') {
        stats[key].winningAmount = toMoney(stats[key].winningAmount + Number(trx.amount || 0));
      }
    }

    stats.lottery.betCount = Math.max(stats.lottery.betCount, wingoCount);
    const totalBet = toMoney(
      stats.lottery.totalBet + stats.video.totalBet + stats.slot.totalBet + stats.fish.totalBet
    );

    return NextResponse.json({
      period: safePeriod,
      totalBet,
      categories: stats
    });
  } catch (error) {
    return apiError('account.game-statistics.get', error);
  }
}

