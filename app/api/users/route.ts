import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const users = await db.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      uid: true,
      name: true,
      phone: true,
      email: true,
      inviteCode: true,
      balance: true,
      vipLevel: true,
      exp: true,
      role: true,
      createdAt: true,
      updatedAt: true
    }
  });
  return NextResponse.json({ users });
}
