import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, requireAdmin } from '@/lib/api-helpers';
import { apiError } from '@/lib/api-error';

const ALLOWED_TRANSACTION_TYPES = new Set(['DEPOSIT', 'WITHDRAW', 'GAME_WIN', 'GAME_LOSS', 'BONUS', 'COMMISSION']);
const ALLOWED_TRANSACTION_STATUSES = new Set(['PENDING', 'COMPLETED', 'FAILED']);

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const user = admin ? null : await getAuthUser(req);
    if (!admin && !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const type = (url.searchParams.get('type') || '').toUpperCase();
    const status = (url.searchParams.get('status') || '').toUpperCase();
    const limitRaw = Number(url.searchParams.get('limit') || 0);
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 100) : undefined;
    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (!admin && user) where.userId = user.id;

    const records = await db.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        userId: true,
        type: true,
        amount: true,
        status: true,
        meta: true,
        createdAt: true,
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
    const transactions = records.map((trx) => {
      let metaData: Record<string, unknown> | null = null;
      if (trx.meta) {
        try {
          const parsed = JSON.parse(trx.meta);
          metaData = parsed && typeof parsed === 'object' ? parsed : null;
        } catch {
          metaData = null;
        }
      }
      return {
        ...trx,
        metaData
      };
    });
    return NextResponse.json({ transactions });
  } catch (error) {
    return apiError('transactions.get', error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const type = String(body.type || '').toUpperCase();
    const amount = Number(body.amount || 0);
    const status = 'PENDING';

    if (type !== 'DEPOSIT' && type !== 'WITHDRAW') {
      return NextResponse.json({ error: 'Only deposit and withdraw requests are allowed.' }, { status: 400 });
    }

    if (!ALLOWED_TRANSACTION_TYPES.has(type)) {
      return NextResponse.json({ error: 'Invalid transaction type.' }, { status: 400 });
    }

    if (!ALLOWED_TRANSACTION_STATUSES.has(status)) {
      return NextResponse.json({ error: 'Invalid transaction status.' }, { status: 400 });
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than 0.' }, { status: 400 });
    }

    if (type === 'WITHDRAW' && amount > user.balance) {
      return NextResponse.json({ error: 'Insufficient balance for withdraw request.' }, { status: 400 });
    }

    const trx = await db.transaction.create({
      data: {
        userId: user.id,
        type,
        amount,
        status,
        meta: body.meta ? JSON.stringify(body.meta) : null
      }
    });

    return NextResponse.json({ transaction: trx });
  } catch (error) {
    return apiError('transactions.post', error);
  }
}
