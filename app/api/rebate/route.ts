import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/api-helpers';
import { apiError } from '@/lib/api-error';
import { dayKey, parseMeta, startOfDay, toMoney } from '@/lib/feature-utils';

type Category = 'LOTTERY' | 'CASINO' | 'SLOT' | 'FISH';

function classifyGame(meta: Record<string, unknown>): Category {
  const raw = String(meta.game || meta.gameType || meta.category || '').toUpperCase();
  if (raw.includes('WINGO') || raw.includes('LOTTERY')) return 'LOTTERY';
  if (raw.includes('FISH')) return 'FISH';
  if (raw.includes('VIDEO') || raw.includes('CASINO')) return 'CASINO';
  return 'SLOT';
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const today = dayKey();
    const start = startOfDay();
    const [configs, losses, claims] = await Promise.all([
      db.rebateConfig.findMany({ where: { isActive: true }, orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] }),
      db.transaction.findMany({
        where: {
          userId: user.id,
          type: 'GAME_LOSS',
          status: 'COMPLETED',
          createdAt: { gte: start }
        },
        select: { amount: true, meta: true }
      }),
      db.rebateClaim.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 100
      })
    ]);

    const buckets: Record<Category, number> = {
      LOTTERY: 0,
      CASINO: 0,
      SLOT: 0,
      FISH: 0
    };

    for (const trx of losses) {
      const category = classifyGame(parseMeta<Record<string, unknown>>(trx.meta));
      buckets[category] = toMoney(buckets[category] + Number(trx.amount || 0));
    }

    const list = await Promise.all(
      configs.map(async (config) => {
        const gameType = config.gameType.toUpperCase();
        const betAmount =
          gameType === 'ALL'
            ? toMoney(buckets.LOTTERY + buckets.CASINO + buckets.SLOT + buckets.FISH)
            : toMoney(buckets[gameType as Category] || 0);
        const canClaimAmount = toMoney(betAmount * Number(config.rate || 0));
        const todayClaim = await db.rebateClaim.findUnique({
          where: {
            userId_gameType_periodKey: {
              userId: user.id,
              gameType,
              periodKey: today
            }
          }
        });

        return {
          ...config,
          gameType,
          betAmount,
          todayRebateAmount: canClaimAmount,
          claimedToday: Boolean(todayClaim),
          claimable: canClaimAmount > 0 && !todayClaim
        };
      })
    );

    const totalBetAmount = toMoney(list.reduce((sum, row) => sum + Number(row.betAmount || 0), 0));
    const totalRebateAmount = toMoney(list.reduce((sum, row) => sum + Number(row.todayRebateAmount || 0), 0));
    const todayClaimed = toMoney(
      claims
        .filter((claim) => claim.periodKey === today)
        .reduce((sum, claim) => sum + Number(claim.rebateAmount || 0), 0)
    );

    return NextResponse.json({
      periodKey: today,
      summary: {
        allTotalBettingRebate: totalBetAmount,
        todayRebate: todayClaimed,
        totalRebate: toMoney(claims.reduce((sum, claim) => sum + Number(claim.rebateAmount || 0), 0))
      },
      configs: list,
      history: claims
    });
  } catch (error) {
    return apiError('rebate.get', error);
  }
}

