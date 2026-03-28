import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-helpers';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const page = await db.contentPage.update({
    where: { id: params.id },
    data: {
      slug: body.slug,
      title: body.title,
      content: body.content,
      order: body.order ?? 0,
      isActive: body.isActive ?? true
    }
  });
  return NextResponse.json({ page });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await db.contentPage.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
