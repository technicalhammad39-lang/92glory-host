import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-helpers';
import { ensureSeeded } from '@/lib/seed';

export async function GET(req: NextRequest) {
  await ensureSeeded();
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({
    user: {
      id: user.id,
      phone: user.phone,
      email: user.email,
      uid: user.uid,
      name: user.name,
      balance: user.balance,
      vipLevel: user.vipLevel,
      role: user.role,
      inviteCode: user.inviteCode
    }
  });
}
