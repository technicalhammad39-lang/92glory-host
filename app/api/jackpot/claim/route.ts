import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/api-helpers';
import { apiError } from '@/lib/api-error';
import { dayKey, toMoney } from '@/lib/feature-utils';
import { TX_OPTIONS } from '@/lib/tx-options';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const periodKey = dayKey();
    const claim = await db.$transaction(async (tx) => {
      const record = await tx.jackpotClaim.findUnique({
        where: { userId_periodKey: { userId: user.id, periodKey } }
      });
      if (!record || record.status !== 'ELIGIBLE') throw new Error('NOT_ELIGIBLE');
      if (record.expiresAt && record.expiresAt.getTime() < Date.now()) throw new Error('EXPIRED');

      const rewardAmount = toMoney(record.rewardAmount);
      const updated = await tx.jackpotClaim.update({
        where: { id: record.id },
        data: {
          status: 'CLAIMED',
          claimedAt: new Date()
        }
      });

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
            source: 'super_jackpot',
            periodKey
          })
        }
      });

      return updated;
    }, TX_OPTIONS);

    return NextResponse.json({ success: true, claim });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'NOT_ELIGIBLE') {
        return NextResponse.json({ error: 'No jackpot reward available.' }, { status: 400 });
      }
      if (error.message === 'EXPIRED') {
        return NextResponse.json({ error: 'Jackpot reward expired.' }, { status: 400 });
      }
    }
    return apiError('jackpot.claim.post', error);
  }
}
