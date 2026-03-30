import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-helpers';
import { db, isDatabaseReady } from '@/lib/db';
import { isSupportedDuration } from '@/lib/wingo-engine';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    if (!(await isDatabaseReady())) {
      return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 });
    }

    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const durationSecRaw = url.searchParams.get('durationSec');
    const durationSec = durationSecRaw ? Number(durationSecRaw) : null;
    const limitRaw = Number(url.searchParams.get('limit') || 20);
    const limit = Math.max(1, Math.min(100, Number.isFinite(limitRaw) ? limitRaw : 20));

    if (durationSec != null && !isSupportedDuration(durationSec)) {
      return NextResponse.json({ error: 'Unsupported duration.' }, { status: 400 });
    }

    const bets = await db.wingoBet.findMany({
      where: {
        userId: user.id,
        ...(durationSec != null
          ? {
              round: {
                durationSec
              }
            }
          : {})
      },
      include: {
        round: {
          select: {
            durationSec: true,
            issueNumber: true,
            resultNumber: true,
            resultColor: true,
            resultSize: true,
            settledAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return NextResponse.json({
      bets: bets.map((bet) => ({
        id: bet.id,
        issueNumber: bet.issueNumber,
        durationSec: bet.round.durationSec,
        betType: bet.betType,
        selection: bet.selection,
        amount: bet.amount,
        status: bet.status,
        payoutMultiplier: bet.payoutMultiplier,
        potentialWinAmount: bet.potentialWinAmount,
        winAmount: bet.winAmount,
        resultNumber: bet.resultNumber ?? bet.round.resultNumber,
        resultColor: bet.round.resultColor,
        resultSize: bet.round.resultSize,
        settledAt: bet.settledAt ?? bet.round.settledAt,
        createdAt: bet.createdAt
      }))
    });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('/api/wingo/my-bets failed:', error);
    }
    return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 });
  }
}
