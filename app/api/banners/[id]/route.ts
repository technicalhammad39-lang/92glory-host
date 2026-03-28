import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-helpers';

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const banner = await db.banner.update({
    where: { id: id },
    data: {
      image: body.image,
      link: body.link ?? null,
      order: body.order ?? 0,
      placement: body.placement || 'home',
      isActive: body.isActive ?? true
    }
  });
  return NextResponse.json({ banner });
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await db.banner.delete({ where: { id: id } });
  return NextResponse.json({ success: true });
}
