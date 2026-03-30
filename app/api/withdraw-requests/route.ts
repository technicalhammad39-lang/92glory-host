import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, requireAdmin } from '@/lib/api-helpers';
import { apiError } from '@/lib/api-error';

function normalizeStatus(value: unknown) {
  return String(value || '').trim().toUpperCase();
}

function parseMeta(raw: string | null) {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function toRequestShape(transaction: any, includeUser = false) {
  const meta = parseMeta(transaction.meta);
  return {
    id: transaction.id,
    userId: transaction.userId,
    amount: transaction.amount,
    status:
      transaction.status === 'COMPLETED'
        ? 'APPROVED'
        : transaction.status === 'FAILED'
          ? 'REJECTED'
          : 'PENDING',
    note: meta?.note || null,
    adminNote: meta?.adminAction?.reason || null,
    reviewedAt: meta?.adminAction?.at || null,
    reviewedBy: meta?.adminAction?.adminId || null,
    transactionId: transaction.id,
    createdAt: transaction.createdAt,
    updatedAt: transaction.createdAt,
    withdrawAccount: {
      id: String(meta?.accountId || ''),
      method: String(meta?.method || ''),
      accountNumber: String(meta?.accountNumber || ''),
      accountName: String(meta?.accountName || ''),
      title: String(meta?.accountTitle || '')
    },
    transaction: includeUser
      ? transaction
      : {
          id: transaction.id,
          amount: transaction.amount,
          status: transaction.status,
          createdAt: transaction.createdAt
        },
    user: includeUser ? transaction.user || null : undefined
  };
}

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const user = admin ? null : await getAuthUser(req);
    if (!admin && !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const status = normalizeStatus(url.searchParams.get('status'));
    const limitRaw = Number(url.searchParams.get('limit') || 0);
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 100) : undefined;

    const where: any = { type: 'WITHDRAW' };
    if (!admin && user) where.userId = user.id;
    if (status === 'PENDING') where.status = 'PENDING';
    if (status === 'APPROVED') where.status = 'COMPLETED';
    if (status === 'REJECTED') where.status = 'FAILED';

    const transactions = await db.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: admin
        ? {
            user: {
              select: { id: true, uid: true, name: true, phone: true, email: true }
            }
          }
        : undefined
    });

    return NextResponse.json({
      requests: transactions.map((transaction) => toRequestShape(transaction, Boolean(admin)))
    });
  } catch (error) {
    return apiError('withdraw-requests.get', error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const withdrawAccountId = String(body.withdrawAccountId || '').trim();
    const amount = Number(body.amount || 0);
    const note = String(body.note || '').trim();

    if (!withdrawAccountId || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Withdraw account and valid amount are required.' }, { status: 400 });
    }

    const account = await db.paymentAccount.findUnique({ where: { id: withdrawAccountId } });
    if (!account || account.userId !== user.id || !account.isActive) {
      return NextResponse.json({ error: 'Selected withdrawal account is not available.' }, { status: 400 });
    }

    const pendingTotal = await db.transaction.aggregate({
      _sum: { amount: true },
      where: {
        userId: user.id,
        type: 'WITHDRAW',
        status: { in: ['PENDING', 'PROCESSING'] }
      }
    });

    const pendingAmount = Number(pendingTotal._sum.amount || 0);
    const availableBalance = Number(user.balance || 0) - pendingAmount;
    if (amount > availableBalance) {
      return NextResponse.json({ error: 'Insufficient available balance for a new withdrawal request.' }, { status: 400 });
    }

    const transaction = await db.transaction.create({
      data: {
        userId: user.id,
        type: 'WITHDRAW',
        amount,
        status: 'PENDING',
        meta: JSON.stringify({
          source: 'withdraw_request',
          accountId: account.id,
          method: account.method,
          accountTitle: account.accountTitle,
          accountNumber: account.accountNumber,
          accountName: account.accountName,
          usdtAddress: account.usdtAddress,
          note: note || null
        })
      }
    });

    return NextResponse.json({ request: toRequestShape(transaction) });
  } catch (error) {
    return apiError('withdraw-requests.post', error);
  }
}
