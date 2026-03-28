import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-helpers';
import { apiError } from '@/lib/api-error';

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const image = String(body.image || '').trim();
    if (!image) return NextResponse.json({ error: 'Image is required.' }, { status: 400 });

    const banner = await db.banner.update({
      where: { id },
      data: {
        image,
        link: body.link ?? null,
        order: Number(body.order ?? 0),
        placement: body.placement || 'home',
        isActive: body.isActive ?? true
      }
    });
    return NextResponse.json({ banner });
  } catch (error) {
    return apiError('banners.put', error);
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await db.banner.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError('banners.delete', error);
  }
}
