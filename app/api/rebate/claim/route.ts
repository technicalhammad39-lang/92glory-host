import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/api-helpers';
import { apiError } from '@/lib/api-error';
import { dayKey, parseMeta, startOfDay, toMoney } from '@/lib/feature-utils';
import { TX_OPTIONS } from '@/lib/tx-options';

type Category = 'LOTTERY' | 'CASINO' | 'SLOT' | 'FISH';

function classifyGame(meta: Record<string, unknown>): Category {
  const raw = String(meta.game || meta.gameType || meta.category || '').toUpperCase();
  if (raw.includes('WINGO') || raw.includes('LOTTERY')) return 'LOTTERY';
  if (raw.includes('FISH')) return 'FISH';
  if (raw.includes('VIDEO') || raw.includes('CASINO')) return 'CASINO';
  return 'SLOT';
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const requestedGameType = String(body.gameType || 'ALL').trim().toUpperCase();

    const start = startOfDay();
    const periodKey = dayKey();
    const [configs, losses] = await Promise.all([
      db.rebateConfig.findMany({
        where: {
          isActive: true,
          ...(requestedGameType === 'ALL' ? {} : { gameType: requestedGameType })
        }
      }),
      db.transaction.findMany({
        where: {
          userId: user.id,
          type: 'GAME_LOSS',
          status: 'COMPLETED',
          createdAt: { gte: start }
        },
        select: { amount: true, meta: true }
      })
    ]);

    if (!configs.length) {
      return NextResponse.json({ error: 'No rebate config available.' }, { status: 400 });
    }

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

    const claims = await db.$transaction(async (tx) => {
      const createdClaims = [];
      let totalPayout = 0;

      for (const config of configs) {
        const gameType = String(config.gameType || 'ALL').toUpperCase();
        const already = await tx.rebateClaim.findUnique({
          where: {
            userId_gameType_periodKey: {
              userId: user.id,
              gameType,
              periodKey
            }
          }
        });
        if (already) continue;

        const betAmount =
          gameType === 'ALL'
            ? toMoney(buckets.LOTTERY + buckets.CASINO + buckets.SLOT + buckets.FISH)
            : toMoney(buckets[gameType as Category] || 0);

        const rebateAmount = toMoney(betAmount * Number(config.rate || 0));
        if (rebateAmount <= 0) continue;

        const created = await tx.rebateClaim.create({
          data: {
            userId: user.id,
            gameType,
            periodKey,
            betAmount,
            rebateRate: config.rate,
            rebateAmount,
            status: 'CLAIMED'
          }
        });
        createdClaims.push(created);
        totalPayout = toMoney(totalPayout + rebateAmount);
      }

      if (totalPayout > 0) {
        await tx.user.update({
          where: { id: user.id },
          data: { balance: { increment: totalPayout } }
        });
        await tx.transaction.create({
          data: {
            userId: user.id,
            type: 'BONUS',
            amount: totalPayout,
            status: 'COMPLETED',
            meta: JSON.stringify({
              source: 'rebate_claim',
              periodKey,
              count: createdClaims.length
            })
          }
        });
      }

      return { createdClaims, totalPayout };
    }, TX_OPTIONS);

    if (!claims.createdClaims.length) {
      return NextResponse.json({ error: 'No claimable rebate available.' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      totalPayout: claims.totalPayout,
      claims: claims.createdClaims
    });
  } catch (error) {
    return apiError('rebate.claim.post', error);
  }
}
