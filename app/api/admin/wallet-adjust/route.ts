import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-helpers';
import { apiError } from '@/lib/api-error';

type Mode = 'ADD' | 'DEDUCT';

function parseMode(value: unknown): Mode | null {
  const mode = String(value || '').trim().toUpperCase();
  if (mode === 'ADD' || mode === 'DEDUCT') return mode;
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const userId = String(body.userId || '').trim();
    const mode = parseMode(body.mode);
    const amount = Number(body.amount || 0);
    const reason = String(body.reason || '').trim();

    if (!userId || !mode || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'userId, mode and valid amount are required.' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    if (mode === 'DEDUCT' && user.balance < amount) {
      return NextResponse.json({ error: 'Cannot deduct more than the current balance.' }, { status: 400 });
    }

    const delta = mode === 'ADD' ? amount : -amount;
    const payload = await db.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { balance: { increment: delta } }
      });

      const transaction = await tx.transaction.create({
        data: {
          userId: user.id,
          type: 'MANUAL_ADJUST',
          amount,
          status: 'COMPLETED',
          meta: JSON.stringify({
            source: 'admin_wallet_adjust',
            mode,
            reason: reason || null,
            adminId: admin.id
          })
        }
      });

      await tx.adminActionLog.create({
        data: {
          adminId: admin.id,
          action: mode === 'ADD' ? 'MANUAL_BALANCE_ADD' : 'MANUAL_BALANCE_DEDUCT',
          targetType: 'User',
          targetId: user.id,
          details: JSON.stringify({
            amount,
            reason: reason || null,
            transactionId: transaction.id
          })
        }
      });

      return { user: updatedUser, transaction };
    });

    return NextResponse.json(payload);
  } catch (error) {
    return apiError('admin.wallet-adjust.post', error);
  }
}

