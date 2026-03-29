import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-helpers';
import { apiError } from '@/lib/api-error';

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [users, deposits, withdrawals, transactions, games, pendingDeposits, pendingWithdraws] = await Promise.all([
      db.user.count(),
      db.transaction.aggregate({ _sum: { amount: true }, where: { type: 'DEPOSIT', status: 'COMPLETED' } }),
      db.transaction.aggregate({ _sum: { amount: true }, where: { type: 'WITHDRAW', status: 'COMPLETED' } }),
      db.transaction.aggregate({ _sum: { amount: true }, where: { type: 'GAME_WIN' } }),
      db.game.count(),
      db.depositRequest.count({ where: { status: 'PENDING' } }),
      db.withdrawRequest.count({ where: { status: 'PENDING' } })
    ]);

    return NextResponse.json({
      users,
      deposits: deposits._sum.amount || 0,
      withdrawals: withdrawals._sum.amount || 0,
      bets: transactions._sum.amount || 0,
      games,
      pendingDeposits,
      pendingWithdraws
    });
  } catch (error) {
    return apiError('admin.overview.get', error);
  }
}
