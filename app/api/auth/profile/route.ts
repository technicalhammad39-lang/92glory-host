import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-helpers';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      uid: user.uid,
      role: user.role,
      inviteCode: user.inviteCode,
      balance: user.balance,
      vipLevel: user.vipLevel
    }
  });
}

export async function PUT(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const name = String(body.name || '').trim();
  if (!name) {
    return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
  }

  const updated = await db.user.update({
    where: { id: user.id },
    data: { name }
  });

  return NextResponse.json({
    user: {
      id: updated.id,
      name: updated.name,
      phone: updated.phone,
      email: updated.email,
      uid: updated.uid,
      role: updated.role,
      inviteCode: updated.inviteCode,
      balance: updated.balance,
      vipLevel: updated.vipLevel
    }
  });
}
