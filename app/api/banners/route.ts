import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureSeeded } from '@/lib/seed';
import { requireAdmin } from '@/lib/api-helpers';
import { apiError } from '@/lib/api-error';

export async function GET() {
  try {
    await ensureSeeded();
    const banners = await db.banner.findMany({ orderBy: { order: 'asc' } });
    return NextResponse.json({ banners });
  } catch (error) {
    return apiError('banners.get', error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const banner = await db.banner.create({
      data: {
        image: body.image,
        link: body.link || null,
        order: body.order ?? 0,
        placement: body.placement || 'home',
        isActive: body.isActive ?? true
      }
    });
    return NextResponse.json({ banner });
  } catch (error) {
    return apiError('banners.post', error);
  }
}
