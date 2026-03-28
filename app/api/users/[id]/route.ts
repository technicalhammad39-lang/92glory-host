import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-helpers';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const user = await db.user.update({
    where: { id: params.id },
    data: {
      balance: body.balance ?? undefined,
      vipLevel: body.vipLevel ?? undefined,
      role: body.role ?? undefined,
      name: body.name ?? undefined
    }
  });
  return NextResponse.json({ user });
}
