import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-helpers';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const body = await req.json();
  const banner = await db.banner.update({
    where: { id },
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

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  await db.banner.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
