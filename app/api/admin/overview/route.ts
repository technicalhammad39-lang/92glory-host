import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [users, deposits, withdrawals, transactions, games] = await Promise.all([
    db.user.count(),
    db.transaction.aggregate({ _sum: { amount: true }, where: { type: 'DEPOSIT' } }),
    db.transaction.aggregate({ _sum: { amount: true }, where: { type: 'WITHDRAW' } }),
    db.transaction.aggregate({ _sum: { amount: true }, where: { type: 'GAME_WIN' } }),
    db.game.count()
  ]);

  return NextResponse.json({
    users,
    deposits: deposits._sum.amount || 0,
    withdrawals: withdrawals._sum.amount || 0,
    bets: transactions._sum.amount || 0,
    games
  });
}
