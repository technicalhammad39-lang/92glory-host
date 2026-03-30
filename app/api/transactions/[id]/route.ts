import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, requireAdmin } from '@/lib/api-helpers';
import { withTxRetry } from '@/lib/tx-retry';

function parseMeta(raw: string | null) {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function serializeTransaction<T extends { meta: string | null }>(transaction: T) {
  return {
    ...transaction,
    meta: parseMeta(transaction.meta)
  };
}

function appendAdminMeta(rawMeta: string | null, payload: { status: string; reason?: string; adminId?: string }) {
  const meta = parseMeta(rawMeta);
  return JSON.stringify({
    ...meta,
    adminAction: {
      status: payload.status,
      reason: payload.reason || '',
      adminId: payload.adminId || 'admin',
      at: new Date().toISOString()
    }
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  const user = admin ? null : await getAuthUser(req);
  if (!admin && !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const trx = await db.transaction.findUnique({
    where: { id },
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
  if (!trx) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!admin && trx.userId !== user!.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  return NextResponse.json({ transaction: serializeTransaction(trx) });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const transaction = await db.transaction.findUnique({ where: { id } });
  if (!transaction || transaction.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (transaction.type !== 'DEPOSIT') {
    return NextResponse.json({ error: 'Only deposit transactions can be updated.' }, { status: 400 });
  }

  if (transaction.status !== 'PENDING') {
    return NextResponse.json({ error: 'Only pending deposits can be updated.' }, { status: 400 });
  }

  const screenshotUrl = String(body?.screenshotUrl || '').trim();
  const senderAccount = String(body?.senderAccount || '').trim().slice(0, 80);
  const senderName = String(body?.senderName || '').trim().slice(0, 80);

  if (!screenshotUrl || !screenshotUrl.startsWith('/uploads/deposits/')) {
    return NextResponse.json({ error: 'Payment screenshot is required.' }, { status: 400 });
  }

  const meta = parseMeta(transaction.meta);
  const updated = await db.transaction.update({
    where: { id: transaction.id },
    data: {
      meta: JSON.stringify({
        ...meta,
        screenshotUrl,
        senderAccount,
        senderName,
        customerSubmittedAt: new Date().toISOString()
      })
    }
  });

  return NextResponse.json({ transaction: serializeTransaction(updated) });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const nextStatus = String(body?.status || '').toUpperCase();
  const reason = String(body?.reason || '').trim().slice(0, 250);

  if (!['COMPLETED', 'FAILED'].includes(nextStatus)) {
    return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
  }

  const result = await withTxRetry(async (tx) => {
    const existing = await tx.transaction.findUnique({
      where: { id },
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
    if (!existing) return null;

    if (existing.status === nextStatus) return existing;
    if (existing.status !== 'PENDING') return existing;

    const claim = await tx.transaction.updateMany({
      where: { id, status: 'PENDING' },
      data: { status: 'PROCESSING' }
    });

    if (!claim.count) {
      return tx.transaction.findUnique({
        where: { id },
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
    }

    let finalStatus = nextStatus;

    if (nextStatus === 'COMPLETED') {
      if (existing.type === 'DEPOSIT') {
        await tx.user.update({
          where: { id: existing.userId },
          data: { balance: { increment: existing.amount } }
        });
      } else if (existing.type === 'WITHDRAW') {
        const debited = await tx.user.updateMany({
          where: { id: existing.userId, balance: { gte: existing.amount } },
          data: { balance: { decrement: existing.amount } }
        });

        if (!debited.count) {
          finalStatus = 'FAILED';
        }
      }
    }

    return tx.transaction.update({
      where: { id: existing.id },
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
      },
      data: {
        status: finalStatus,
        meta: appendAdminMeta(existing.meta, {
          status: finalStatus,
          reason: finalStatus === 'FAILED' && nextStatus === 'COMPLETED' ? 'Insufficient balance at approval time.' : reason,
          adminId: (admin as { id?: string })?.id
        })
      }
    });
  });

  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ transaction: serializeTransaction(result) });
}
