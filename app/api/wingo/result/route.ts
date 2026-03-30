import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-helpers';
import { db, isDatabaseReady } from '@/lib/db';
import { isSupportedDuration, setForcedResult, settleDueRounds, settleRound } from '@/lib/wingo-engine';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    if (!(await isDatabaseReady())) {
      return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 });
    }

    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const durationSec = Number(body.durationSec || 30);
    const issueNumber = body.issueNumber ? String(body.issueNumber).trim() : undefined;
    const hasResultNumber = body.resultNumber !== undefined && body.resultNumber !== null;
    const resultNumber = hasResultNumber ? Number(body.resultNumber) : undefined;
    const settleNow = Boolean(body.settleNow);

    if (!isSupportedDuration(durationSec)) {
      return NextResponse.json({ error: 'Unsupported duration.' }, { status: 400 });
    }

    if (hasResultNumber) {
      if (!Number.isInteger(resultNumber) || resultNumber! < 0 || resultNumber! > 9) {
        return NextResponse.json({ error: 'resultNumber must be 0-9.' }, { status: 400 });
      }
      const round = await setForcedResult({
        durationSec,
        issueNumber,
        resultNumber: resultNumber!,
        settleNow
      });
      return NextResponse.json({
        success: true,
        mode: 'MANUAL_RESULT',
        round: {
          id: round.id,
          issueNumber: round.issueNumber,
          durationSec: round.durationSec,
          forcedResultNumber: round.forcedResultNumber,
          status: round.status
        }
      });
    }

    if (issueNumber) {
      const round = await db.wingoRound.findUnique({ where: { issueNumber } });
      if (!round) return NextResponse.json({ error: 'Round not found.' }, { status: 404 });
      const settled = await settleRound(round.id);
      return NextResponse.json({
        success: true,
        mode: 'SETTLE_ONE',
        round: settled
      });
    }

    await settleDueRounds(durationSec);
    return NextResponse.json({
      success: true,
      mode: 'SETTLE_DUE',
      durationSec
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Result operation failed.';
    if (message.includes('Result number')) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    if (process.env.NODE_ENV !== 'production') {
      console.error('/api/wingo/result failed:', error);
    }
    return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 });
  }
}
