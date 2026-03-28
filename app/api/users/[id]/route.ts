import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-helpers';
import { apiError } from '@/lib/api-error';

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const nextBalance = body.balance === undefined ? undefined : Number(body.balance);
    const nextVipLevel = body.vipLevel === undefined ? undefined : Number(body.vipLevel);

    if (nextBalance !== undefined && Number.isNaN(nextBalance)) {
      return NextResponse.json({ error: 'Invalid balance value.' }, { status: 400 });
    }

    if (nextVipLevel !== undefined && Number.isNaN(nextVipLevel)) {
      return NextResponse.json({ error: 'Invalid vipLevel value.' }, { status: 400 });
    }

    const user = await db.user.update({
      where: { id },
      data: {
        balance: nextBalance,
        vipLevel: nextVipLevel,
        role: body.role ?? undefined,
        name: body.name ?? undefined
      }
    });
    return NextResponse.json({ user });
  } catch (error) {
    return apiError('users.put', error);
  }
}
