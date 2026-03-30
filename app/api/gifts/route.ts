import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-helpers';
import { db } from '@/lib/db';
import { apiError } from '@/lib/api-error';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const claims = await db.giftClaim.findMany({
      where: { userId: user.id },
      include: {
        giftCode: {
          select: { code: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    return NextResponse.json({
      claims: claims.map((item) => ({
        id: item.id,
        code: item.giftCode.code,
        amount: item.amount,
        status: item.status,
        createdAt: item.createdAt
      }))
    });
  } catch (error) {
    return apiError('gifts.get', error);
  }
}

