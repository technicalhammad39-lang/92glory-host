import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, requireAdmin } from '@/lib/api-helpers';
import { apiError } from '@/lib/api-error';
import { PAYMENT_CHANNELS, getPaymentChannel, isPaymentMethodId } from '@/lib/payment-channels';

function normalizeStatus(value: unknown) {
  return String(value || '').trim().toUpperCase();
}

function normalizeMethod(value: unknown) {
  return String(value || '').trim().toUpperCase();
}

function serializeMeta(raw: string | null) {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function toRequestShape(transaction: any, includeUser = false) {
  const meta = serializeMeta(transaction.meta);
  const method = normalizeMethod(meta?.method);
  const channel = isPaymentMethodId(method) ? getPaymentChannel(method) : null;

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
    channel: channel
      ? {
          id: method,
          method,
          title: channel.label,
          logo: channel.icon,
          accountNumber: channel.accountNumber || null,
          accountName: channel.accountName || null,
          isActive: true
        }
      : null,
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

    const where: any = {
      type: 'DEPOSIT',
      NOT: { status: 'PENDING_UPLOAD' }
    };
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
    return apiError('deposit-requests.get', error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const amount = Number(body.amount || 0);
    const note = String(body.note || '').trim();
    const method = normalizeMethod(body.method || body.channelId);

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Valid amount is required.' }, { status: 400 });
    }

    if (!isPaymentMethodId(method) || method === 'USDT') {
      return NextResponse.json({ error: 'Selected channel is not available.' }, { status: 400 });
    }

    const channel = PAYMENT_CHANNELS[method];
    const transaction = await db.transaction.create({
      data: {
        userId: user.id,
        type: 'DEPOSIT',
        amount,
        status: 'PENDING',
        meta: JSON.stringify({
          source: 'deposit_request',
          method,
          title: channel.label,
          note: note || null,
          merchantAccountNumber: channel.accountNumber || null,
          merchantAccountName: channel.accountName || null
        })
      }
    });

    return NextResponse.json({ request: toRequestShape(transaction) });
  } catch (error) {
    return apiError('deposit-requests.post', error);
  }
}
