import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureSeeded } from '@/lib/seed';
import { getAuthUser } from '@/lib/api-helpers';
import { apiError } from '@/lib/api-error';

export async function GET(req: NextRequest) {
  try {
    await ensureSeeded();
    const user = await getAuthUser(req);
    const levels = await db.vipLevel.findMany({ orderBy: { level: 'asc' } });
    const benefits = await db.vipBenefit.findMany({ orderBy: { order: 'asc' } });

    return NextResponse.json({
      user: user
        ? {
            id: user.id,
            phone: user.phone,
            email: user.email,
            uid: user.uid,
            vipLevel: user.vipLevel,
            exp: user.exp,
            name: user.name
          }
        : null,
      levels,
      benefits
    });
  } catch (error) {
    return apiError('vip.get', error);
  }
}
