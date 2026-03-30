import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, requireAdmin } from '@/lib/api-helpers';
import { getPaymentChannel, isPaymentMethodId } from '@/lib/payment-channels';
import { withTxRetry } from '@/lib/tx-retry';

function parseMeta(raw: string | null) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function serializeTransaction<T extends { meta: string | null }>(transaction: T) {
  return {
    ...transaction,
    meta: parseMeta(transaction.meta)
  };
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  const user = admin ? null : await getAuthUser(req);
  if (!admin && !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const type = url.searchParams.get('type');
  const status = url.searchParams.get('status');
  const id = url.searchParams.get('id');

  const where: any = {};
  if (type) where.type = type;
  if (status) where.status = status;

  if (id) {
    where.id = id;
  }

  if (!admin && user) where.userId = user.id;

  const transactions = await db.transaction.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          uid: true,
          name: true,
          phone: true,
          email: true,
          role: true
        }
      }
    }
  });

  return NextResponse.json({ transactions: transactions.map(serializeTransaction) });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const type = String(body?.type || '').toUpperCase();
    const amount = Number(body?.amount || 0);

    if (!['DEPOSIT', 'WITHDRAW'].includes(type)) {
      return NextResponse.json({ error: 'Invalid transaction type.' }, { status: 400 });
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount.' }, { status: 400 });
    }

    if (type === 'DEPOSIT' && (amount < 300 || amount > 50000)) {
      return NextResponse.json({ error: 'Deposit amount must be between Rs300 and Rs50,000.' }, { status: 400 });
    }

    if (type === 'WITHDRAW' && (amount < 500 || amount > 50000)) {
      return NextResponse.json({ error: 'Withdrawal amount must be between Rs500 and Rs50,000.' }, { status: 400 });
    }

    let meta = body?.meta && typeof body.meta === 'object' ? body.meta : {};

    if (type === 'DEPOSIT') {
      const method = String(meta?.method || '').toUpperCase();
      if (!isPaymentMethodId(method) || method === 'USDT') {
        return NextResponse.json({ error: 'Invalid deposit channel.' }, { status: 400 });
      }
      const channel = getPaymentChannel(method);
      meta = {
        ...meta,
        method,
        methodLabel: channel.label,
        merchantAccountNumber: channel.accountNumber,
        merchantAccountName: channel.accountName,
        orderSource: 'USER_DEPOSIT'
      };
    }

    if (type === 'WITHDRAW') {
      const method = String(meta?.method || '').toUpperCase();
      if (!isPaymentMethodId(method)) {
        return NextResponse.json({ error: 'Invalid withdrawal channel.' }, { status: 400 });
      }

      const account = await db.paymentAccount.findFirst({
        where: {
          userId: user.id,
          method,
          isActive: true
        }
      });

      if (!account) {
        return NextResponse.json({ error: 'Please add your withdrawal account first.' }, { status: 400 });
      }

      meta = {
        ...meta,
        method,
        accountId: account.id,
        accountTitle: account.accountTitle,
        accountNumber: account.accountNumber,
        accountName: account.accountName,
        usdtAddress: account.usdtAddress
      };

      const transaction = await withTxRetry(async (tx) => {
        const freshUser = await tx.user.findUnique({
          where: { id: user.id },
          select: { balance: true }
        });
        if (!freshUser) {
          throw new Error('Unauthorized');
        }

        const pending = await tx.transaction.aggregate({
          where: {
            userId: user.id,
            type: 'WITHDRAW',
            status: { in: ['PENDING', 'PROCESSING'] }
          },
          _sum: { amount: true }
        });
        const pendingAmount = Number(pending._sum.amount || 0);
        const available = Number(freshUser.balance || 0) - pendingAmount;

        if (available < amount) {
          throw new Error('Insufficient balance.');
        }

        return tx.transaction.create({
          data: {
            userId: user.id,
            type,
            amount,
            status: 'PENDING',
            meta: JSON.stringify(meta || {})
          }
        });
      });

      return NextResponse.json({ transaction: serializeTransaction(transaction) });
    }

    const trx = await db.transaction.create({
      data: {
        userId: user.id,
        type,
        amount,
        status: 'PENDING',
        meta: JSON.stringify(meta || {})
      }
    });

    return NextResponse.json({ transaction: serializeTransaction(trx) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Service temporarily unavailable.';
    if (message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (message === 'Insufficient balance.') {
      return NextResponse.json({ error: 'Insufficient balance.' }, { status: 400 });
    }
    if (process.env.NODE_ENV !== 'production') {
      console.error('/api/transactions POST failed:', error);
    }
    return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 });
  }
}
