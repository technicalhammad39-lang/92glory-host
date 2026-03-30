import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/api-helpers';
import { apiError } from '@/lib/api-error';
import { endOfDay, parseMeta, startOfDay, toMoney } from '@/lib/feature-utils';

type TeamNode = { id: string; uid: string | null; level: number };

async function loadTeam(userId: string) {
  const nodes: TeamNode[] = [];
  const queue: Array<{ id: string; level: number }> = [{ id: userId, level: 0 }];
  while (queue.length) {
    const current = queue.shift()!;
    const downlines = await db.user.findMany({
      where: { uplineId: current.id },
      select: { id: true, uid: true }
    });
    for (const row of downlines) {
      const node = { id: row.id, uid: row.uid || null, level: current.level + 1 };
      nodes.push(node);
      queue.push({ id: row.id, level: current.level + 1 });
    }
  }
  return nodes;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const uidSearch = String(url.searchParams.get('uid') || '').trim();
    const dateInput = String(url.searchParams.get('date') || '').trim();
    const baseDate = dateInput ? new Date(dateInput) : new Date();
    if (Number.isNaN(baseDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date.' }, { status: 400 });
    }
    const start = startOfDay(baseDate);
    const end = endOfDay(baseDate);
    const dayLabel = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;

    const team = await loadTeam(user.id);
    const filteredTeam = uidSearch
      ? team.filter((item) => String(item.uid || '').includes(uidSearch))
      : team;

    const ids = filteredTeam.map((item) => item.id);
    if (!ids.length) {
      return NextResponse.json({
        summary: {
          depositNumber: 0,
          depositAmount: 0,
          numberOfBettors: 0,
          totalBet: 0,
          firstDepositCount: 0,
          firstDepositAmount: 0
        },
        rows: []
      });
    }

    const [deposits, bets, commissions] = await Promise.all([
      db.transaction.findMany({
        where: {
          userId: { in: ids },
          type: 'DEPOSIT',
          status: 'COMPLETED',
          createdAt: { gte: start, lt: end }
        },
        select: { userId: true, amount: true, createdAt: true }
      }),
      db.transaction.findMany({
        where: {
          userId: { in: ids },
          type: 'GAME_LOSS',
          status: 'COMPLETED',
          createdAt: { gte: start, lt: end }
        },
        select: { userId: true, amount: true, meta: true }
      }),
      db.transaction.findMany({
        where: {
          userId: user.id,
          type: 'COMMISSION',
          status: 'COMPLETED',
          createdAt: { gte: start, lt: end }
        },
        select: { amount: true, meta: true }
      })
    ]);

    const firstDepositInfo = new Map<string, number>();
    for (const memberId of ids) {
      const first = await db.transaction.findFirst({
        where: {
          userId: memberId,
          type: 'DEPOSIT',
          status: 'COMPLETED'
        },
        orderBy: { createdAt: 'asc' },
        select: { amount: true, createdAt: true }
      });
      if (first && first.createdAt >= start && first.createdAt < end) {
        firstDepositInfo.set(memberId, Number(first.amount || 0));
      }
    }

    const depositByUser = new Map<string, number>();
    for (const row of deposits) {
      depositByUser.set(row.userId, toMoney((depositByUser.get(row.userId) || 0) + Number(row.amount || 0)));
    }

    const betByUser = new Map<string, number>();
    for (const row of bets) {
      betByUser.set(row.userId, toMoney((betByUser.get(row.userId) || 0) + Number(row.amount || 0)));
    }

    const commissionByUser = new Map<string, number>();
    for (const row of commissions) {
      const meta = parseMeta<Record<string, unknown>>(row.meta);
      const subordinateId = String(meta.subordinateId || meta.userId || '');
      if (!subordinateId) continue;
      if (!ids.includes(subordinateId)) continue;
      commissionByUser.set(
        subordinateId,
        toMoney((commissionByUser.get(subordinateId) || 0) + Number(row.amount || 0))
      );
    }

    const rows = filteredTeam.map((member) => ({
      userId: member.id,
      uid: member.uid || '-',
      level: member.level,
      depositAmount: toMoney(depositByUser.get(member.id) || 0),
      commission: toMoney(commissionByUser.get(member.id) || 0),
      time: dayLabel
    }));

    const summary = {
      depositNumber: deposits.length,
      depositAmount: toMoney(deposits.reduce((sum, row) => sum + Number(row.amount || 0), 0)),
      numberOfBettors: new Set(bets.map((b) => b.userId)).size,
      totalBet: toMoney(bets.reduce((sum, row) => sum + Number(row.amount || 0), 0)),
      firstDepositCount: firstDepositInfo.size,
      firstDepositAmount: toMoney(Array.from(firstDepositInfo.values()).reduce((sum, amount) => sum + amount, 0))
    };

    return NextResponse.json({ summary, rows });
  } catch (error) {
    return apiError('promotion.subordinate-data.get', error);
  }
}

