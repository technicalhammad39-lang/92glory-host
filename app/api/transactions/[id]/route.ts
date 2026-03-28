import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-helpers';
import { apiError } from '@/lib/api-error';

const ALLOWED_TRANSACTION_STATUSES = new Set(['PENDING', 'COMPLETED', 'FAILED']);

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const requestedStatus =
      body.status === undefined ? undefined : String(body.status).toUpperCase();
    const requestedAmount = body.amount === undefined ? undefined : Number(body.amount);
    const requestedType = body.type === undefined ? undefined : String(body.type).toUpperCase();

    if (requestedStatus && !ALLOWED_TRANSACTION_STATUSES.has(requestedStatus)) {
      return NextResponse.json({ error: 'Invalid status value.' }, { status: 400 });
    }

    if (requestedAmount !== undefined && (!Number.isFinite(requestedAmount) || requestedAmount <= 0)) {
      return NextResponse.json({ error: 'Invalid amount value.' }, { status: 400 });
    }

    const existing = await db.transaction.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const trx = await db.transaction.update({
      where: { id },
      data: {
        status: requestedStatus,
        amount: requestedAmount,
        type: requestedType
      }
    });

    if (existing.status !== 'COMPLETED' && requestedStatus === 'COMPLETED') {
      const delta = trx.type === 'DEPOSIT' ? trx.amount : trx.type === 'WITHDRAW' ? -trx.amount : 0;
      if (delta !== 0) {
        await db.user.update({
          where: { id: trx.userId },
          data: { balance: { increment: delta } }
        });
      }
    }

    return NextResponse.json({ transaction: trx });
  } catch (error) {
    return apiError('transactions.put', error);
  }
}
