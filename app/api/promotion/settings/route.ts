import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-helpers';
import { ensureSeeded } from '@/lib/seed';
import { apiError } from '@/lib/api-error';

export async function GET() {
  try {
    await ensureSeeded();
    const setting = await db.promotionSetting.findFirst();
    return NextResponse.json({ setting });
  } catch (error) {
    return apiError('promotion-settings.get', error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const commissionRate =
      body.commissionRate === undefined ? undefined : Number(body.commissionRate);
    const rebateRate = body.rebateRate === undefined ? undefined : Number(body.rebateRate);

    if (commissionRate !== undefined && !Number.isFinite(commissionRate)) {
      return NextResponse.json({ error: 'Invalid commissionRate value.' }, { status: 400 });
    }
    if (rebateRate !== undefined && !Number.isFinite(rebateRate)) {
      return NextResponse.json({ error: 'Invalid rebateRate value.' }, { status: 400 });
    }

    await ensureSeeded();
    const existing = await db.promotionSetting.findFirst();
    const setting = existing
      ? await db.promotionSetting.update({
          where: { id: existing.id },
          data: {
            commissionRate: commissionRate ?? existing.commissionRate,
            rebateRate: rebateRate ?? existing.rebateRate,
            customerService: body.customerService ?? existing.customerService
          }
        })
      : await db.promotionSetting.create({
          data: {
            commissionRate: commissionRate ?? 0.1,
            rebateRate: rebateRate ?? 0.15,
            customerService: body.customerService ?? ''
          }
        });
    return NextResponse.json({ setting });
  } catch (error) {
    return apiError('promotion-settings.put', error);
  }
}
