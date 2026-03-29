import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/api-helpers';
import { apiError } from '@/lib/api-error';

const BONUS_TYPES = ['BONUS', 'COMMISSION'];
const COMPLETED = 'COMPLETED';
const ACTIVE_STATUSES = ['PENDING', 'COMPLETED'];

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function toAmount(value: number | null | undefined) {
  return Number(value || 0);
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const todayStart = startOfToday();

    const [
      depositTotal,
      withdrawTotal,
      totalFlow,
      todayBonus,
      totalBonus,
      latestTransactions,
      latestDeposit,
      latestWithdraw
    ] = await Promise.all([
      db.transaction.aggregate({
        _sum: { amount: true },
        where: { userId: user.id, type: 'DEPOSIT', status: { in: ACTIVE_STATUSES } }
      }),
      db.transaction.aggregate({
        _sum: { amount: true },
        where: { userId: user.id, type: 'WITHDRAW', status: { in: ACTIVE_STATUSES } }
      }),
      db.transaction.aggregate({
        _sum: { amount: true },
        where: {
          userId: user.id,
          status: { in: ACTIVE_STATUSES },
          type: { in: ['DEPOSIT', 'WITHDRAW'] }
        }
      }),
      db.transaction.aggregate({
        _sum: { amount: true },
        where: {
          userId: user.id,
          status: COMPLETED,
          type: { in: BONUS_TYPES },
          createdAt: { gte: todayStart }
        }
      }),
      db.transaction.aggregate({
        _sum: { amount: true },
        where: { userId: user.id, status: COMPLETED, type: { in: BONUS_TYPES } }
      }),
      db.transaction.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 15,
        select: {
          id: true,
          type: true,
          amount: true,
          status: true,
          meta: true,
          createdAt: true
        }
      }),
      db.transaction.findFirst({
        where: { userId: user.id, type: 'DEPOSIT' },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          type: true,
          amount: true,
          status: true,
          meta: true,
          createdAt: true
        }
      }),
      db.transaction.findFirst({
        where: { userId: user.id, type: 'WITHDRAW' },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          type: true,
          amount: true,
          status: true,
          meta: true,
          createdAt: true
        }
      })
    ]);

    return NextResponse.json({
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        uid: user.uid,
        name: user.name,
        balance: user.balance,
        vipLevel: user.vipLevel,
        role: user.role,
        inviteCode: user.inviteCode,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      summary: {
        totalBalance: toAmount(user.balance),
        totalAmount: toAmount(totalFlow._sum.amount),
        totalDepositAmount: toAmount(depositTotal._sum.amount),
        totalWithdrawAmount: toAmount(withdrawTotal._sum.amount),
        todayBonus: toAmount(todayBonus._sum.amount),
        totalBonus: toAmount(totalBonus._sum.amount),
        transactionsCount: latestTransactions.length
      },
      latest: {
        deposit: latestDeposit,
        withdraw: latestWithdraw,
        transactions: latestTransactions
      }
    });
  } catch (error) {
    return apiError('account.summary.get', error);
  }
}
