import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-helpers';

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const user = await db.user.update({
    where: { id: id },
    data: {
      balance: body.balance ?? undefined,
      vipLevel: body.vipLevel ?? undefined,
      role: body.role ?? undefined,
      name: body.name ?? undefined
    }
  });
  return NextResponse.json({ user });
}
