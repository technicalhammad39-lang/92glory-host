import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, requireAdmin } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  const user = admin ? null : await getAuthUser(req);
  if (!admin && !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const type = url.searchParams.get('type');
  const where: any = {};
  if (type) where.type = type;
  if (!admin && user) where.userId = user.id;

  const transactions = await db.transaction.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { user: true }
  });
  return NextResponse.json({ transactions });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();

  const trx = await db.transaction.create({
    data: {
      userId: user.id,
      type: body.type,
      amount: Number(body.amount || 0),
      status: body.status || 'PENDING',
      meta: body.meta ? JSON.stringify(body.meta) : null
    }
  });

  return NextResponse.json({ transaction: trx });
}
