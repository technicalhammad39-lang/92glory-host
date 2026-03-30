import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-helpers';
import { db } from '@/lib/db';
import { apiError } from '@/lib/api-error';

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const codes = await db.giftCode.findMany({
      orderBy: { createdAt: 'desc' },
      take: 300
    });
    return NextResponse.json({ codes });
  } catch (error) {
    return apiError('admin.gift-codes.get', error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const code = String(body.code || '').trim().toUpperCase();
    const rewardAmount = Number(body.rewardAmount || 0);
    const maxTotalClaims = Number(body.maxTotalClaims || 0);
    const perUserLimit = Number(body.perUserLimit || 1);
    const expiresAtRaw = String(body.expiresAt || '').trim();
    const isActive = body.isActive === undefined ? true : Boolean(body.isActive);

    if (!code || rewardAmount <= 0 || maxTotalClaims <= 0 || perUserLimit <= 0) {
      return NextResponse.json({ error: 'Invalid gift code payload.' }, { status: 400 });
    }

    const expiresAt = expiresAtRaw ? new Date(expiresAtRaw) : null;
    if (expiresAtRaw && (!expiresAt || Number.isNaN(expiresAt.getTime()))) {
      return NextResponse.json({ error: 'Invalid expiry date.' }, { status: 400 });
    }

    const giftCode = await db.giftCode.create({
      data: {
        code,
        rewardAmount,
        maxTotalClaims,
        perUserLimit,
        expiresAt: expiresAtRaw ? expiresAt : null,
        isActive
      }
    });
    return NextResponse.json({ giftCode });
  } catch (error) {
    return apiError('admin.gift-codes.post', error);
  }
}
