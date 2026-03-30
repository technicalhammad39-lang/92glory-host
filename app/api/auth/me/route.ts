import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token) as { id?: string } | null;
    if (!payload?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({ where: { id: payload.id } });
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
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('/api/auth/me failed:', error);
    }
    return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 });
  }
}
