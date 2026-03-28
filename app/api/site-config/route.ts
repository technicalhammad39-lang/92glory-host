import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureSeeded } from '@/lib/seed';
import { requireAdmin } from '@/lib/api-helpers';
import { apiError } from '@/lib/api-error';

export async function GET() {
  try {
    await ensureSeeded();
    const site = await db.siteConfig.findFirst();
    return NextResponse.json({ site });
  } catch (error) {
    return apiError('site-config.get', error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const existing = await db.siteConfig.findFirst();
    const site = existing
      ? await db.siteConfig.update({
          where: { id: existing.id },
          data: {
            brandName: body.brandName ?? existing.brandName,
            announcement: body.announcement ?? existing.announcement,
            announcementButton: body.announcementButton ?? existing.announcementButton
          }
        })
      : await db.siteConfig.create({
          data: {
            brandName: body.brandName || '92 Glory0',
            announcement: body.announcement || '',
            announcementButton: body.announcementButton || 'Detail'
          }
        });

    return NextResponse.json({ site });
  } catch (error) {
    return apiError('site-config.put', error);
  }
}
