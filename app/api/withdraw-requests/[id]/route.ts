import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-helpers';
import { apiError } from '@/lib/api-error';

type Decision = 'approve' | 'reject';

function parseDecision(value: unknown): Decision | null {
  const v = String(value || '').trim().toLowerCase();
  if (v === 'approve' || v === 'reject') return v;
  return null;
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

    const request = await db.withdrawRequest.findUnique({
      where: { id },
      include: {
        transaction: true,
        user: {
          select: {
            id: true,
            balance: true
          }
        }
      }
    });
    if (!request) return NextResponse.json({ error: 'Withdraw request not found.' }, { status: 404 });
    if (request.status !== 'PENDING') {
      return NextResponse.json({ error: 'Only pending requests can be updated.' }, { status: 400 });
    }

    if (decision === 'approve' && request.user.balance < request.amount) {
      return NextResponse.json({ error: 'User balance is not enough to approve this withdrawal.' }, { status: 400 });
    }

    const reviewedAt = new Date();

    const result = await db.$transaction(async (tx) => {
      const nextStatus = decision === 'approve' ? 'APPROVED' : 'REJECTED';
      const trxStatus = decision === 'approve' ? 'COMPLETED' : 'FAILED';

      const updatedRequest = await tx.withdrawRequest.update({
        where: { id: request.id },
        data: {
          status: nextStatus,
          adminNote: adminNote || null,
          reviewedBy: admin.id,
          reviewedAt
        },
        include: {
          withdrawAccount: true,
          transaction: true,
          user: {
            select: { id: true, name: true, uid: true, phone: true, email: true }
          }
        }
      });

      if (request.transactionId) {
        await tx.transaction.update({
          where: { id: request.transactionId },
          data: { status: trxStatus }
        });
      }

      if (decision === 'approve') {
        await tx.user.update({
          where: { id: request.userId },
          data: { balance: { decrement: request.amount } }
        });
      }

      await tx.adminActionLog.create({
        data: {
          adminId: admin.id,
          action: decision === 'approve' ? 'APPROVE_WITHDRAW' : 'REJECT_WITHDRAW',
          targetType: 'WithdrawRequest',
          targetId: request.id,
          details: JSON.stringify({
            amount: request.amount,
            userId: request.userId,
            transactionId: request.transactionId,
            adminNote: adminNote || null
          })
        }
      });

      return updatedRequest;
    });

    return NextResponse.json({ request: result });
  } catch (error) {
    return apiError('withdraw-requests.put', error);
  }
}

