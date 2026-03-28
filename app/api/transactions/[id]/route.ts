import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-helpers';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const existing = await db.transaction.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const trx = await db.transaction.update({
    where: { id: params.id },
    data: {
      status: body.status ?? undefined,
      amount: body.amount ?? undefined,
      type: body.type ?? undefined
    }
  });

  if (existing.status !== 'COMPLETED' && body.status === 'COMPLETED') {
    const delta = trx.type === 'DEPOSIT' ? trx.amount : trx.type === 'WITHDRAW' ? -trx.amount : 0;
    if (delta !== 0) {
      await db.user.update({
        where: { id: trx.userId },
        data: { balance: { increment: delta } }
      });
    }
  }

  return NextResponse.json({ transaction: trx });
}
