import crypto from 'crypto';
import { Prisma, WingoBetType, WingoResultMode, WingoRoundStatus } from '@prisma/client';
import { db } from '@/lib/db';

const LOCK_WINDOW_SECONDS = 5;
const RESULT_SALT = process.env.WINGO_RESULT_SALT || process.env.JWT_SECRET || 'wingo-default-salt';
const SETTLE_RETRY_LIMIT = Number(process.env.WINGO_SETTLE_RETRY_LIMIT || 4);
const SETTLE_RETRY_BASE_DELAY_MS = Number(process.env.WINGO_SETTLE_RETRY_BASE_DELAY_MS || 120);
const WINGO_TX_TIMEOUT_MS = Number(process.env.WINGO_TX_TIMEOUT_MS || 120000);
const WINGO_TX_MAX_WAIT_MS = Number(process.env.WINGO_TX_MAX_WAIT_MS || 10000);
const LOCK_ROUNDS_INTERVAL_MS = Number(process.env.WINGO_LOCK_INTERVAL_MS || 3000);

const ONE_MINUTE_RESULT_SEQUENCE = [
  7, 2, 5, 0, 9, 3, 6, 1, 8, 4,
  7, 0, 2, 5, 9, 3, 6, 1, 8, 4,
  7, 2, 5, 0, 9, 3, 6, 1, 8, 4,
  7, 0, 2, 5, 9, 3, 6, 1, 8, 4,
  7, 2, 5, 0, 9, 3, 6, 1, 8, 4
];

export const WINGO_ALLOWED_DURATIONS = [30, 60, 180, 300] as const;

type AllowedDuration = (typeof WINGO_ALLOWED_DURATIONS)[number];

export type WingoBetInput = {
  betType: WingoBetType;
  selection: string;
  amount: number;
};

declare global {
  var __wingoDurationSettleLocks: Set<number> | undefined;
  var __wingoRoundSettleLocks: Set<string> | undefined;
  var __wingoDurationLastSettleAt: Map<number, number> | undefined;
  var __wingoDurationLockLocks: Set<number> | undefined;
  var __wingoDurationLastLockAt: Map<number, number> | undefined;
}

const durationSettleLocks = globalThis.__wingoDurationSettleLocks || new Set<number>();
const roundSettleLocks = globalThis.__wingoRoundSettleLocks || new Set<string>();
const durationLastSettleAt = globalThis.__wingoDurationLastSettleAt || new Map<number, number>();
const durationLockLocks = globalThis.__wingoDurationLockLocks || new Set<number>();
const durationLastLockAt = globalThis.__wingoDurationLastLockAt || new Map<number, number>();
if (!globalThis.__wingoDurationSettleLocks) {
  globalThis.__wingoDurationSettleLocks = durationSettleLocks;
}
if (!globalThis.__wingoRoundSettleLocks) {
  globalThis.__wingoRoundSettleLocks = roundSettleLocks;
}
if (!globalThis.__wingoDurationLastSettleAt) {
  globalThis.__wingoDurationLastSettleAt = durationLastSettleAt;
}
if (!globalThis.__wingoDurationLockLocks) {
  globalThis.__wingoDurationLockLocks = durationLockLocks;
}
if (!globalThis.__wingoDurationLastLockAt) {
  globalThis.__wingoDurationLastLockAt = durationLastLockAt;
}

export function isSupportedDuration(durationSec: number): durationSec is AllowedDuration {
  return WINGO_ALLOWED_DURATIONS.includes(durationSec as AllowedDuration);
}

function toMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function getUtcDayStartMs(date: Date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0);
}

function formatIssueNumber(startAt: Date, durationSec: number) {
  const yyyy = startAt.getUTCFullYear();
  const mm = String(startAt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(startAt.getUTCDate()).padStart(2, '0');
  const startMs = startAt.getTime();
  const dayStartMs = getUtcDayStartMs(startAt);
  const periodIndex = Math.floor((startMs - dayStartMs) / (durationSec * 1000)) + 1;
  return `${yyyy}${mm}${dd}${String(durationSec).padStart(2, '0')}${String(periodIndex).padStart(5, '0')}`;
}

export function getRoundWindow(durationSec: number, at = new Date()) {
  const durationMs = durationSec * 1000;
  const nowMs = at.getTime();
  const startMs = Math.floor(nowMs / durationMs) * durationMs;
  const endMs = startMs + durationMs;
  const lockAtMs = endMs - LOCK_WINDOW_SECONDS * 1000;

  const startAt = new Date(startMs);
  const endAt = new Date(endMs);
  const lockAt = new Date(lockAtMs);
  const issueNumber = formatIssueNumber(startAt, durationSec);

  return { issueNumber, startAt, endAt, lockAt };
}

export function getResultMeta(resultNumber: number) {
  const size = resultNumber >= 5 ? 'BIG' : 'SMALL';
  const colors: string[] = [];

  if ([1, 3, 7, 9].includes(resultNumber)) {
    colors.push('GREEN');
  } else if ([2, 4, 6, 8].includes(resultNumber)) {
    colors.push('RED');
  } else if (resultNumber === 0) {
    colors.push('RED', 'VIOLET');
  } else if (resultNumber === 5) {
    colors.push('GREEN', 'VIOLET');
  }

  return {
    size,
    colors,
    colorText: colors.join(',')
  };
}

function extractIssuePeriodIndex(issueNumber: string) {
  const digits = String(issueNumber || '').replace(/\D/g, '');
  const suffix = digits.slice(-5);
  const parsed = Number(suffix);
  if (Number.isInteger(parsed) && parsed > 0) {
    return parsed;
  }

  const digest = crypto.createHash('sha1').update(issueNumber).digest('hex');
  return (parseInt(digest.slice(0, 6), 16) % 100000) + 1;
}

function deterministicResult(issueNumber: string, durationSec: number) {
  if (durationSec === 60) {
    const periodIndex = extractIssuePeriodIndex(issueNumber);
    return ONE_MINUTE_RESULT_SEQUENCE[(periodIndex - 1) % ONE_MINUTE_RESULT_SEQUENCE.length];
  }

  const digest = crypto.createHash('sha256').update(`${issueNumber}:${durationSec}:${RESULT_SALT}`).digest('hex');
  const intValue = parseInt(digest.slice(0, 8), 16);
  return intValue % 10;
}

function sanitizeSelection(type: WingoBetType, raw: string) {
  const value = String(raw || '').trim().toUpperCase();

  if (type === 'NUMBER') {
    if (!/^[0-9]$/.test(value)) return null;
    return value;
  }

  if (type === 'COLOR') {
    if (!['GREEN', 'RED', 'VIOLET'].includes(value)) return null;
    return value;
  }

  if (type === 'SIZE') {
    if (!['BIG', 'SMALL'].includes(value)) return null;
    return value;
  }

  return null;
}

function getPotentialMultiplier(type: WingoBetType, selection: string) {
  if (type === 'NUMBER') return 9;
  if (type === 'SIZE') return 2;
  if (selection === 'VIOLET') return 4.5;
  return 2;
}

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

function isRetryableSettleError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    ['P2002', 'P2034', 'P2028', 'P1017', 'P1001'].includes(error.code)
  );
}

function isPoolTimeoutError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2024';
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function settleDueRounds(durationSec: number, now = new Date()) {
  const nowMs = now.getTime();
  const lastRunAt = durationLastSettleAt.get(durationSec) || 0;
  if (nowMs - lastRunAt < 3000) {
    return;
  }

  if (durationSettleLocks.has(durationSec)) {
    return;
  }

  durationSettleLocks.add(durationSec);
  durationLastSettleAt.set(durationSec, nowMs);
  try {
    const rounds = await db.wingoRound.findMany({
      where: {
        durationSec,
        status: { in: [WingoRoundStatus.OPEN, WingoRoundStatus.LOCKED] },
        endAt: { lte: now }
      },
      orderBy: { endAt: 'asc' },
      take: 2
    });

    for (const round of rounds) {
      await settleRound(round.id);
    }
  } finally {
    durationSettleLocks.delete(durationSec);
  }
}

async function lockDueRounds(durationSec: number, now = new Date()) {
  const nowMs = now.getTime();
  const lastRunAt = durationLastLockAt.get(durationSec) || 0;
  if (nowMs - lastRunAt < LOCK_ROUNDS_INTERVAL_MS) {
    return;
  }

  if (durationLockLocks.has(durationSec)) {
    return;
  }

  durationLockLocks.add(durationSec);
  durationLastLockAt.set(durationSec, nowMs);
  try {
    await db.wingoRound.updateMany({
      where: {
        durationSec,
        status: WingoRoundStatus.OPEN,
        lockAt: { lte: now }
      },
      data: { status: WingoRoundStatus.LOCKED }
    });
  } finally {
    durationLockLocks.delete(durationSec);
  }
}

export async function ensureCurrentRound(durationSec: number, now = new Date()) {
  if (!isSupportedDuration(durationSec)) {
    throw new Error('Unsupported duration.');
  }

  try {
    await settleDueRounds(durationSec, now);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('settleDueRounds failed in ensureCurrentRound:', error);
    }
  }

  try {
    await lockDueRounds(durationSec, now);
  } catch (error) {
    if (!isPoolTimeoutError(error) && process.env.NODE_ENV !== 'production') {
      console.error('lockDueRounds failed in ensureCurrentRound:', error);
    }
  }

  const window = getRoundWindow(durationSec, now);
  let round = await db.wingoRound.findUnique({
    where: { issueNumber: window.issueNumber }
  });

  if (!round) {
    try {
      round = await db.wingoRound.create({
        data: {
          issueNumber: window.issueNumber,
          durationSec,
          status: now >= window.lockAt ? WingoRoundStatus.LOCKED : WingoRoundStatus.OPEN,
          startsAt: window.startAt,
          lockAt: window.lockAt,
          endAt: window.endAt
        }
      });
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error;
      round = await db.wingoRound.findUnique({ where: { issueNumber: window.issueNumber } });
    }
  } else if (round.status === WingoRoundStatus.OPEN && now >= round.lockAt) {
    round = await db.wingoRound.update({
      where: { id: round.id },
      data: { status: WingoRoundStatus.LOCKED }
    });
  }

  if (!round) {
    throw new Error('Unable to initialize current round.');
  }

  return round;
}

async function settleRoundOnce(roundId: string) {
  return db.$transaction(async (tx) => {
    const now = new Date();
    const claim = await tx.wingoRound.updateMany({
      where: {
        id: roundId,
        status: { in: [WingoRoundStatus.OPEN, WingoRoundStatus.LOCKED] }
      },
      data: {
        status: WingoRoundStatus.SETTLED,
        settledAt: now
      }
    });

    if (!claim.count) {
      return tx.wingoRound.findUnique({ where: { id: roundId } });
    }

    const round = await tx.wingoRound.findUnique({
      where: { id: roundId },
      include: { result: true }
    });

    if (!round) return null;

    const resultNumber = round.forcedResultNumber ?? deterministicResult(round.issueNumber, round.durationSec);
    const resultMeta = getResultMeta(resultNumber);
    const mode = round.forcedResultNumber == null ? WingoResultMode.AUTO : WingoResultMode.MANUAL;

    const multiplierCase = Prisma.sql`
      CASE
        WHEN betType = 'NUMBER' AND selection = ${String(resultNumber)} THEN 9
        WHEN betType = 'SIZE' AND selection = 'BIG' AND ${resultNumber} >= 5 THEN 2
        WHEN betType = 'SIZE' AND selection = 'SMALL' AND ${resultNumber} <= 4 THEN 2
        WHEN betType = 'COLOR' AND selection = 'VIOLET' AND ${resultNumber} IN (0, 5) THEN 4.5
        WHEN betType = 'COLOR' AND selection = 'GREEN' AND ${resultNumber} IN (1, 3, 7, 9) THEN 2
        WHEN betType = 'COLOR' AND selection = 'GREEN' AND ${resultNumber} = 5 THEN 1.5
        WHEN betType = 'COLOR' AND selection = 'RED' AND ${resultNumber} IN (2, 4, 6, 8) THEN 2
        WHEN betType = 'COLOR' AND selection = 'RED' AND ${resultNumber} = 0 THEN 1.5
        ELSE 0
      END
    `;

    type PayoutRow = { userId: string; totalBet: number | string | Prisma.Decimal; payout: number | string | Prisma.Decimal };
    const payoutRows = await tx.$queryRaw<PayoutRow[]>(Prisma.sql`
      SELECT
        userId,
        COALESCE(SUM(amount), 0) AS totalBet,
        COALESCE(SUM(amount * (${multiplierCase})), 0) AS payout
      FROM WingoBet
      WHERE roundId = ${round.id} AND status = 'PENDING'
      GROUP BY userId
    `);

    await tx.$executeRaw(Prisma.sql`
      UPDATE WingoBet
      SET
        status = CASE WHEN (${multiplierCase}) > 0 THEN 'WON' ELSE 'LOST' END,
        resultNumber = ${resultNumber},
        payoutMultiplier = (${multiplierCase}),
        winAmount = ROUND(amount * (${multiplierCase}), 2),
        settledAt = ${now}
      WHERE roundId = ${round.id} AND status = 'PENDING'
    `);

    const normalizedPayoutRows = payoutRows.map((row) => ({
      userId: row.userId,
      totalBet: toMoney(Number(row.totalBet || 0)),
      payout: toMoney(Number(row.payout || 0))
    }));

    const totalBetAmount = toMoney(normalizedPayoutRows.reduce((sum, row) => sum + row.totalBet, 0));
    const totalPayoutAmount = toMoney(normalizedPayoutRows.reduce((sum, row) => sum + row.payout, 0));

    const positivePayoutRows = normalizedPayoutRows.filter((row) => row.payout > 0);
    if (positivePayoutRows.length > 0) {
      const balanceCase = Prisma.join(
        positivePayoutRows.map((row) => Prisma.sql`WHEN ${row.userId} THEN ${row.payout}`),
        ' '
      );
      const payoutUserIds = Prisma.join(positivePayoutRows.map((row) => Prisma.sql`${row.userId}`));

      await tx.$executeRaw(Prisma.sql`
        UPDATE \`User\`
        SET balance = balance + (CASE id ${balanceCase} ELSE 0 END)
        WHERE id IN (${payoutUserIds})
      `);

      await tx.transaction.createMany({
        data: positivePayoutRows.map((row) => ({
          userId: row.userId,
          type: 'GAME_WIN',
          amount: row.payout,
          status: 'COMPLETED',
          meta: JSON.stringify({
            game: 'WINGO',
            issueNumber: round.issueNumber,
            mode: 'PAYOUT'
          })
        }))
      });
    }

    if (round.result) {
      await tx.wingoResult.update({
        where: { roundId: round.id },
        data: {
          issueNumber: round.issueNumber,
          resultNumber,
          color: resultMeta.colorText,
          size: resultMeta.size,
          mode
        }
      });
    } else {
      try {
        await tx.wingoResult.create({
          data: {
            roundId: round.id,
            issueNumber: round.issueNumber,
            resultNumber,
            color: resultMeta.colorText,
            size: resultMeta.size,
            mode
          }
        });
      } catch (error) {
        if (!isUniqueConstraintError(error)) {
          throw error;
        }
        await tx.wingoResult.update({
          where: { roundId: round.id },
          data: {
            issueNumber: round.issueNumber,
            resultNumber,
            color: resultMeta.colorText,
            size: resultMeta.size,
            mode
          }
        });
      }
    }

    return tx.wingoRound.update({
      where: { id: round.id },
      data: {
        status: WingoRoundStatus.SETTLED,
        resultNumber,
        resultColor: resultMeta.colorText,
        resultSize: resultMeta.size,
        resultMode: mode,
        settledAt: now,
        totalBetAmount: toMoney(totalBetAmount),
        totalPayoutAmount: toMoney(totalPayoutAmount)
      }
    });
  }, { maxWait: WINGO_TX_MAX_WAIT_MS, timeout: WINGO_TX_TIMEOUT_MS });
}

export async function settleRound(roundId: string) {
  if (roundSettleLocks.has(roundId)) {
    return db.wingoRound.findUnique({ where: { id: roundId } });
  }

  roundSettleLocks.add(roundId);
  try {
    let attempt = 0;
    while (attempt < SETTLE_RETRY_LIMIT) {
      attempt += 1;
      try {
        return await settleRoundOnce(roundId);
      } catch (error) {
        if (!isRetryableSettleError(error) || attempt >= SETTLE_RETRY_LIMIT) {
          throw error;
        }
        await sleep(SETTLE_RETRY_BASE_DELAY_MS * attempt);
      }
    }

    return db.wingoRound.findUnique({ where: { id: roundId } });
  } finally {
    roundSettleLocks.delete(roundId);
  }
}

export function normalizeBetInputs(input: unknown) {
  if (!Array.isArray(input)) return null;
  if (input.length < 1 || input.length > 20) return null;

  const parsed: WingoBetInput[] = [];
  for (const rawBet of input) {
    const rawType = String((rawBet as { betType?: string })?.betType || '').toUpperCase();
    if (!['NUMBER', 'COLOR', 'SIZE'].includes(rawType)) return null;
    const betType = rawType as WingoBetType;

    const selection = sanitizeSelection(betType, String((rawBet as { selection?: string })?.selection || ''));
    if (!selection) return null;

    const amount = Number((rawBet as { amount?: number })?.amount || 0);
    if (!Number.isFinite(amount) || amount <= 0) return null;
    if (amount > 1000000) return null;

    parsed.push({
      betType,
      selection,
      amount: toMoney(amount)
    });
  }

  return parsed;
}

export async function placeWingoBets(params: {
  userId: string;
  durationSec: number;
  issueNumber: string;
  bets: WingoBetInput[];
}) {
  const now = new Date();
  const currentRound = await ensureCurrentRound(params.durationSec, now);
  if (currentRound.issueNumber !== params.issueNumber) {
    throw new Error('Round moved. Please place bet again.');
  }
  if (now >= currentRound.lockAt || currentRound.status !== WingoRoundStatus.OPEN) {
    throw new Error('Betting is closed for this round.');
  }

  const bets = params.bets.map((bet) => {
    const potentialMultiplier = getPotentialMultiplier(bet.betType, bet.selection);
    return {
      ...bet,
      payoutMultiplier: potentialMultiplier,
      potentialWinAmount: toMoney(bet.amount * potentialMultiplier)
    };
  });

  const totalBetAmount = toMoney(bets.reduce((sum, bet) => sum + bet.amount, 0));

  return db.$transaction(async (tx) => {
    const liveRound = await tx.wingoRound.findUnique({ where: { id: currentRound.id } });
    if (!liveRound) throw new Error('Round not found.');
    if (new Date() >= liveRound.lockAt || liveRound.status !== WingoRoundStatus.OPEN) {
      throw new Error('Betting is closed for this round.');
    }

    const debit = await tx.user.updateMany({
      where: {
        id: params.userId,
        balance: { gte: totalBetAmount }
      },
      data: {
        balance: { decrement: totalBetAmount }
      }
    });

    if (!debit.count) {
      throw new Error('Insufficient balance.');
    }

    const createdBets = [];
    for (const bet of bets) {
      const created = await tx.wingoBet.create({
        data: {
          roundId: liveRound.id,
          issueNumber: liveRound.issueNumber,
          userId: params.userId,
          betType: bet.betType,
          selection: bet.selection,
          amount: bet.amount,
          payoutMultiplier: bet.payoutMultiplier,
          potentialWinAmount: bet.potentialWinAmount
        }
      });
      createdBets.push(created);
    }

    await tx.transaction.create({
      data: {
        userId: params.userId,
        type: 'GAME_LOSS',
        amount: totalBetAmount,
        status: 'COMPLETED',
        meta: JSON.stringify({
          game: 'WINGO',
          issueNumber: liveRound.issueNumber,
          mode: 'BET',
          count: bets.length
        })
      }
    });

    const user = await tx.user.findUnique({
      where: { id: params.userId },
      select: {
        id: true,
        phone: true,
        email: true,
        uid: true,
        name: true,
        balance: true,
        vipLevel: true,
        role: true,
        inviteCode: true
      }
    });

    return { round: liveRound, bets: createdBets, user, totalBetAmount };
  });
}

export async function setForcedResult(params: {
  durationSec: number;
  issueNumber?: string;
  resultNumber: number;
  settleNow?: boolean;
}) {
  if (!isSupportedDuration(params.durationSec)) {
    throw new Error('Unsupported duration.');
  }
  if (!Number.isInteger(params.resultNumber) || params.resultNumber < 0 || params.resultNumber > 9) {
    throw new Error('Result number must be between 0 and 9.');
  }

  const now = new Date();
  const round =
    params.issueNumber
      ? await db.wingoRound.findUnique({ where: { issueNumber: params.issueNumber } })
      : await ensureCurrentRound(params.durationSec, now);

  if (!round) {
    throw new Error('Round not found.');
  }

  const updatedRound = await db.wingoRound.update({
    where: { id: round.id },
    data: {
      forcedResultNumber: params.resultNumber,
      resultMode: WingoResultMode.MANUAL
    }
  });

  if (params.settleNow || now >= updatedRound.endAt) {
    await settleRound(updatedRound.id);
  }

  return updatedRound;
}
