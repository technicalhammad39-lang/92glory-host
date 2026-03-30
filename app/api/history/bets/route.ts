import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/api-helpers';
import { apiError } from '@/lib/api-error';
import { endOfDay, startOfDay, toMoney } from '@/lib/feature-utils';

function durationLabel(durationSec: number) {
  if (durationSec === 30) return 'Win Go 30 second';
  if (durationSec === 60) return 'Win Go 1 minute';
  if (durationSec === 180) return 'Win Go 3 minute';
  if (durationSec === 300) return 'Win Go 5 minute';
  return 'Win Go';
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const dateInput = String(url.searchParams.get('date') || '').trim();
    const baseDate = dateInput ? new Date(dateInput) : null;
    const range =
      baseDate && !Number.isNaN(baseDate.getTime())
        ? { gte: startOfDay(baseDate), lt: endOfDay(baseDate) }
        : undefined;

    const bets = await db.wingoBet.findMany({
      where: {
        userId: user.id,
        ...(range ? { createdAt: range } : {})
      },
      include: {
        round: {
          select: {
            durationSec: true,
            resultNumber: true,
            resultColor: true,
            resultSize: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 200
    });

    return NextResponse.json({
      bets: bets.map((bet) => {
        const fee = toMoney(Number(bet.amount || 0) * 0.02);
        const winnings = toMoney(Number(bet.winAmount || 0));
        const actualAmount = toMoney(Math.max(0, winnings - fee));
        const profitLoss = toMoney(winnings - Number(bet.amount || 0));
        return {
          id: bet.id,
          gameType: 'Win Go',
          detailType: durationLabel(bet.round.durationSec),
          period: bet.issueNumber,
          orderNumber: `WG${bet.id}`,
          selected: bet.selection,
          totalBet: toMoney(bet.amount),
          resultNumber: bet.resultNumber ?? bet.round.resultNumber,
          resultColor: bet.round.resultColor,
          resultSize: bet.round.resultSize,
          actualAmount,
          winnings,
          handlingFee: fee,
          profitLoss,
          status: bet.status === 'WON' ? 'WIN' : bet.status === 'LOST' ? 'LOSE' : 'PENDING',
          createdAt: bet.createdAt
        };
      })
    });
  } catch (error) {
    return apiError('history.bets.get', error);
  }
}

