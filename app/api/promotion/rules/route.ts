import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { apiError } from '@/lib/api-error';

export async function GET(_req: NextRequest) {
  try {
    const [setting, partnerRules, rebateRatios, page] = await Promise.all([
      db.promotionSetting.findFirst(),
      db.partnerRewardRule.findMany({
        where: { isActive: true },
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }]
      }),
      db.rebateRatio.findMany({
        orderBy: [{ category: 'asc' }, { level: 'asc' }, { order: 'asc' }]
      }),
      db.contentPage.findFirst({
        where: { slug: 'promotion-rules', isActive: true }
      })
    ]);

    return NextResponse.json({
      setting,
      partnerRules,
      rebateRatios,
      contentPage: page
    });
  } catch (error) {
    return apiError('promotion.rules.get', error);
  }
}

