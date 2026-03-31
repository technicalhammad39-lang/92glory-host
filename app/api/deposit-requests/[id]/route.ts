import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-helpers';
import { apiError } from '@/lib/api-error';
import { withTxRetry } from '@/lib/tx-retry';

type Decision = 'approve' | 'reject';

function parseDecision(value: unknown): Decision | null {
  const v = String(value || '').trim().toLowerCase();
  if (v === 'approve' || v === 'reject') return v;
  return null;
}

function parseMeta(raw: string | null) {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const decision = parseDecision(body.decision);
    const adminNote = String(body.adminNote || '').trim();
    if (!decision) {
      return NextResponse.json({ error: 'Invalid decision.' }, { status: 400 });
    }

    const request = await db.transaction.findUnique({
      where: { id },
      select: { id: true, userId: true, amount: true, type: true, status: true, meta: true }
    });
    if (!request || request.type !== 'DEPOSIT') {
      return NextResponse.json({ error: 'Deposit request not found.' }, { status: 404 });
    }
    if (request.status !== 'PENDING') {
      return NextResponse.json({ error: 'Only pending requests can be updated.' }, { status: 400 });
    }

    const requestMeta = parseMeta(request.meta);
    if (decision === 'approve' && !requestMeta?.screenshotUrl) {
      return NextResponse.json({ error: 'Payment screenshot is required before approval.' }, { status: 400 });
    }

    const reviewedAt = new Date().toISOString();
    const nextStatus = decision === 'approve' ? 'COMPLETED' : 'FAILED';

    const result = await withTxRetry(async (tx) => {
      const lock = await tx.transaction.updateMany({
        where: { id: request.id, type: 'DEPOSIT', status: 'PENDING' },
        data: { status: 'PROCESSING' }
      });
      if (!lock.count) {
        return tx.transaction.findUnique({ where: { id: request.id } });
      }

      const meta = parseMeta(request.meta);
      const updated = await tx.transaction.update({
        where: { id: request.id },
        data: {
          status: nextStatus,
          meta: JSON.stringify({
            ...meta,
            adminAction: {
              status: nextStatus,
              reason: adminNote || null,
              adminId: admin.id,
              at: reviewedAt
            }
          })
        }
      });

      if (decision === 'approve') {
        await tx.user.update({
          where: { id: request.userId },
          data: { balance: { increment: request.amount } }
        });
      }

      return updated;
    });

    if (!result) return NextResponse.json({ error: 'Deposit request not found.' }, { status: 404 });
    return NextResponse.json({
      request: {
        id: result.id,
        userId: result.userId,
        amount: result.amount,
        status:
          result.status === 'COMPLETED'
            ? 'APPROVED'
            : result.status === 'FAILED'
              ? 'REJECTED'
              : 'PENDING',
        adminNote: adminNote || null,
        reviewedAt,
        reviewedBy: admin.id,
        transactionId: result.id
      }
    });
  } catch (error) {
    return apiError('deposit-requests.put', error);
  }
}
