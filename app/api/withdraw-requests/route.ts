import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, requireAdmin } from '@/lib/api-helpers';
import { apiError } from '@/lib/api-error';

function normalizeStatus(value: unknown) {
  return String(value || '').trim().toUpperCase();
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

    const where: any = {};
    if (!admin && user) where.userId = user.id;
    if (status) where.status = status;

    const requests = await db.withdrawRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        withdrawAccount: true,
        transaction: true,
        user: admin
          ? {
              select: {
                id: true,
                uid: true,
                name: true,
                phone: true,
                email: true
              }
            }
          : false
      }
    });

    return NextResponse.json({ requests });
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

    const account = await db.withdrawAccount.findUnique({ where: { id: withdrawAccountId } });
    if (!account || account.userId !== user.id || !account.isActive) {
      return NextResponse.json({ error: 'Selected withdrawal account is not available.' }, { status: 400 });
    }

    const pendingTotal = await db.withdrawRequest.aggregate({
      _sum: { amount: true },
      where: {
        userId: user.id,
        status: 'PENDING'
      }
    });
    const pendingAmount = Number(pendingTotal._sum.amount || 0);
    const availableBalance = Number(user.balance || 0) - pendingAmount;
    if (amount > availableBalance) {
      return NextResponse.json({ error: 'Insufficient available balance for a new withdrawal request.' }, { status: 400 });
    }

    const payload = await db.$transaction(async (tx) => {
      const trx = await tx.transaction.create({
        data: {
          userId: user.id,
          type: 'WITHDRAW',
          amount,
          status: 'PENDING',
          meta: JSON.stringify({
            source: 'withdraw_request',
            withdrawAccountId: account.id,
            method: account.method
          })
        }
      });

      const request = await tx.withdrawRequest.create({
        data: {
          userId: user.id,
          withdrawAccountId: account.id,
          amount,
          status: 'PENDING',
          note: note || null,
          transactionId: trx.id
        },
        include: {
          withdrawAccount: true,
          transaction: true
        }
      });

      return request;
    });

    return NextResponse.json({ request: payload });
  } catch (error) {
    return apiError('withdraw-requests.post', error);
  }
}

