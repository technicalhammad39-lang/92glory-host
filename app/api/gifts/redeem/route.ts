import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/api-helpers';
import { apiError } from '@/lib/api-error';
import { toMoney } from '@/lib/feature-utils';
import { TX_OPTIONS } from '@/lib/tx-options';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const codeInput = String(body.code || '').trim().toUpperCase();
    if (!codeInput) {
      return NextResponse.json({ error: 'Please enter gift code.' }, { status: 400 });
    }

    const giftCode = await db.giftCode.findUnique({ where: { code: codeInput } });
    if (!giftCode) {
      return NextResponse.json({ error: 'Invalid gift code.' }, { status: 400 });
    }

    if (!giftCode.isActive) {
      return NextResponse.json({ error: 'Gift code is inactive.' }, { status: 400 });
    }

    if (giftCode.expiresAt && giftCode.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ error: 'Gift code is expired.' }, { status: 400 });
    }

    const result = await db.$transaction(async (tx) => {
      const current = await tx.giftCode.findUnique({ where: { id: giftCode.id } });
      if (!current) throw new Error('INVALID');
      if (!current.isActive) throw new Error('INACTIVE');
      if (current.expiresAt && current.expiresAt.getTime() < Date.now()) throw new Error('EXPIRED');
      if (current.totalClaimed >= current.maxTotalClaims) throw new Error('LIMIT');

      const claimedByUser = await tx.giftClaim.count({
        where: { giftCodeId: current.id, userId: user.id, status: 'SUCCESS' }
      });
      if (claimedByUser >= current.perUserLimit) throw new Error('USED');

      const rewardAmount = toMoney(current.rewardAmount);
      const claim = await tx.giftClaim.create({
        data: {
          giftCodeId: current.id,
          userId: user.id,
          amount: rewardAmount,
          status: 'SUCCESS'
        }
      });

      const increased = await tx.giftCode.updateMany({
        where: {
          id: current.id,
          totalClaimed: { lt: current.maxTotalClaims }
        },
        data: { totalClaimed: { increment: 1 } }
      });
      if (!increased.count) throw new Error('LIMIT');

      await tx.user.update({
        where: { id: user.id },
        data: { balance: { increment: rewardAmount } }
      });

      await tx.transaction.create({
        data: {
          userId: user.id,
          type: 'BONUS',
          amount: rewardAmount,
          status: 'COMPLETED',
          meta: JSON.stringify({
            source: 'gift_code',
            code: current.code,
            claimId: claim.id
          })
        }
      });

      return claim;
    }, TX_OPTIONS);

    return NextResponse.json({
      success: true,
      claim: {
        id: result.id,
        amount: result.amount,
        createdAt: result.createdAt
      }
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'INVALID') return NextResponse.json({ error: 'Invalid gift code.' }, { status: 400 });
      if (error.message === 'INACTIVE') return NextResponse.json({ error: 'Gift code is inactive.' }, { status: 400 });
      if (error.message === 'EXPIRED') return NextResponse.json({ error: 'Gift code is expired.' }, { status: 400 });
      if (error.message === 'LIMIT') return NextResponse.json({ error: 'Gift code claim limit reached.' }, { status: 400 });
      if (error.message === 'USED') return NextResponse.json({ error: 'You already used this gift code.' }, { status: 400 });
    }
    return apiError('gifts.redeem.post', error);
  }
}
