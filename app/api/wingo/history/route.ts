import { NextRequest, NextResponse } from 'next/server';
import { db, isDatabaseReady } from '@/lib/db';
import { isSupportedDuration } from '@/lib/wingo-engine';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const durationSec = Number(url.searchParams.get('durationSec') || 30);
  const limitRaw = Number(url.searchParams.get('limit') || 20);
  const limit = Math.max(1, Math.min(100, Number.isFinite(limitRaw) ? limitRaw : 20));

  if (!isSupportedDuration(durationSec)) {
    return NextResponse.json({ error: 'Unsupported duration.' }, { status: 400 });
  }

  if (!(await isDatabaseReady())) {
    return NextResponse.json({ rounds: [], fallback: true });
  }

  try {
    const rounds = await db.wingoRound.findMany({
      where: {
        durationSec,
        status: 'SETTLED'
      },
      include: { result: true },
      orderBy: { startsAt: 'desc' },
      take: limit
    });

    return NextResponse.json({
      rounds: rounds.map((round) => ({
        id: round.id,
        issueNumber: round.issueNumber,
        resultNumber: round.resultNumber,
        resultColor: round.resultColor,
        colors: (round.resultColor || '').split(',').filter(Boolean),
        resultSize: round.resultSize,
        mode: round.resultMode,
        totalBetAmount: round.totalBetAmount,
        totalPayoutAmount: round.totalPayoutAmount,
        settledAt: round.settledAt,
        startedAt: round.startsAt,
        endedAt: round.endAt
      }))
    });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('/api/wingo/history failed:', error);
    }
    return NextResponse.json({ rounds: [], fallback: true });
  }
}
