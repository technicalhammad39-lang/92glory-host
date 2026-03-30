import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-helpers';
import { ensureSeeded } from '@/lib/seed';

export async function GET() {
  await ensureSeeded();
  const setting = await db.promotionSetting.findFirst();
  return NextResponse.json({ setting });
}

export async function PUT(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  await ensureSeeded();
  const existing = await db.promotionSetting.findFirst();
  const setting = existing
    ? await db.promotionSetting.update({
        where: { id: existing.id },
        data: {
          commissionRate: body.commissionRate ?? existing.commissionRate,
          rebateRate: body.rebateRate ?? existing.rebateRate,
          customerService: body.customerService ?? existing.customerService,
          partnerRewardCap: body.partnerRewardCap ?? existing.partnerRewardCap,
          invitationBaseUrl: body.invitationBaseUrl ?? existing.invitationBaseUrl,
          invitationRulesText: body.invitationRulesText ?? existing.invitationRulesText,
          promotionRulesText: body.promotionRulesText ?? existing.promotionRulesText,
          rebateRatioRulesText: body.rebateRatioRulesText ?? existing.rebateRatioRulesText
        }
      })
    : await db.promotionSetting.create({
        data: {
          commissionRate: body.commissionRate ?? 0.1,
          rebateRate: body.rebateRate ?? 0.15,
          customerService: body.customerService ?? '',
          partnerRewardCap: body.partnerRewardCap ?? 10000,
          invitationBaseUrl: body.invitationBaseUrl ?? '',
          invitationRulesText: body.invitationRulesText ?? '',
          promotionRulesText: body.promotionRulesText ?? '',
          rebateRatioRulesText: body.rebateRatioRulesText ?? ''
        }
      });
  return NextResponse.json({ setting });
}
