import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-helpers';
import { isDatabaseReady } from '@/lib/db';
import { normalizeBetInputs, placeWingoBets, isSupportedDuration } from '@/lib/wingo-engine';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    if (!(await isDatabaseReady())) {
      return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 });
    }

    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const durationSec = Number(body.durationSec || 30);
    const issueNumber = String(body.issueNumber || '').trim();
    const bets = normalizeBetInputs(body.bets);

    if (!isSupportedDuration(durationSec)) {
      return NextResponse.json({ error: 'Unsupported duration.' }, { status: 400 });
    }

    if (!issueNumber) {
      return NextResponse.json({ error: 'issueNumber is required.' }, { status: 400 });
    }

    if (!bets) {
      return NextResponse.json({ error: 'Invalid bet payload.' }, { status: 400 });
    }

    const placed = await placeWingoBets({
      userId: user.id,
      durationSec,
      issueNumber,
      bets
    });

    return NextResponse.json({
      success: true,
      round: {
        id: placed.round.id,
        issueNumber: placed.round.issueNumber,
        durationSec: placed.round.durationSec
      },
      totalBetAmount: placed.totalBetAmount,
      bets: placed.bets.map((bet) => ({
        id: bet.id,
        betType: bet.betType,
        selection: bet.selection,
        amount: bet.amount,
        potentialWinAmount: bet.potentialWinAmount,
        payoutMultiplier: bet.payoutMultiplier,
        status: bet.status,
        createdAt: bet.createdAt
      })),
      user: placed.user
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bet request failed.';
    if (message === 'Insufficient balance.') {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    if (message.includes('Betting is closed') || message.includes('Round moved')) {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    if (process.env.NODE_ENV !== 'production') {
      console.error('/api/wingo/bet failed:', error);
    }
    return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 });
  }
}
