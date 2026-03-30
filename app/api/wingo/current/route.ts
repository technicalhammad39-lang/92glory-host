import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-helpers';
import { db, isDatabaseReady } from '@/lib/db';
import { ensureCurrentRound, getRoundWindow, isSupportedDuration } from '@/lib/wingo-engine';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const durationSec = Number(url.searchParams.get('durationSec') || 30);
  if (!isSupportedDuration(durationSec)) {
    return NextResponse.json({ error: 'Unsupported duration.' }, { status: 400 });
  }

  const fallbackWindow = getRoundWindow(durationSec, new Date());
  const remainingSeconds = Math.max(0, Math.ceil((new Date(fallbackWindow.endAt).getTime() - Date.now()) / 1000));
  const bettingOpen = new Date() < fallbackWindow.lockAt;

  if (!(await isDatabaseReady())) {
    return NextResponse.json({
      serverTime: new Date().toISOString(),
      round: {
        id: `fallback-${fallbackWindow.issueNumber}`,
        issueNumber: fallbackWindow.issueNumber,
        durationSec,
        status: bettingOpen ? 'OPEN' : 'LOCKED',
        startsAt: fallbackWindow.startAt,
        lockAt: fallbackWindow.lockAt,
        endAt: fallbackWindow.endAt,
        remainingSeconds,
        isBettingOpen: bettingOpen
      },
      latestResult: null,
      user: null,
      fallback: true
    });
  }

  try {
    const now = new Date();
    const round = await ensureCurrentRound(durationSec, now);

    const previous = await db.wingoRound.findFirst({
      where: {
        durationSec,
        status: 'SETTLED',
        startsAt: { lt: round.startsAt }
      },
      include: { result: true },
      orderBy: { startsAt: 'desc' }
    });

    const user = await getAuthUser(req);
    const remainingSeconds = Math.max(0, Math.ceil((new Date(round.endAt).getTime() - Date.now()) / 1000));
    const isBettingOpen = round.status === 'OPEN' && new Date(round.lockAt) > new Date();

    return NextResponse.json({
      serverTime: new Date().toISOString(),
      round: {
        id: round.id,
        issueNumber: round.issueNumber,
        durationSec: round.durationSec,
        status: round.status,
        startsAt: round.startsAt,
        lockAt: round.lockAt,
        endAt: round.endAt,
        remainingSeconds,
        isBettingOpen
      },
      latestResult: previous
        ? {
            issueNumber: previous.issueNumber,
            resultNumber: previous.resultNumber,
            resultColor: previous.resultColor,
            resultSize: previous.resultSize,
            mode: previous.resultMode,
            settledAt: previous.settledAt
          }
        : null,
      user: user
        ? {
            id: user.id,
            name: user.name,
            balance: user.balance,
            vipLevel: user.vipLevel
          }
        : null
    });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('/api/wingo/current failed:', error);
    }
    return NextResponse.json({
      serverTime: new Date().toISOString(),
      round: {
        id: `fallback-${fallbackWindow.issueNumber}`,
        issueNumber: fallbackWindow.issueNumber,
        durationSec,
        status: bettingOpen ? 'OPEN' : 'LOCKED',
        startsAt: fallbackWindow.startAt,
        lockAt: fallbackWindow.lockAt,
        endAt: fallbackWindow.endAt,
        remainingSeconds,
        isBettingOpen: bettingOpen
      },
      latestResult: null,
      user: null,
      fallback: true
    });
  }
}
