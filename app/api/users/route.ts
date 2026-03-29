import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-helpers';
import { apiError } from '@/lib/api-error';

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const users = await db.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        uid: true,
        inviteCode: true,
        balance: true,
        vipLevel: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });
    return NextResponse.json({ users });
  } catch (error) {
    return apiError('users.get', error);
  }
}
