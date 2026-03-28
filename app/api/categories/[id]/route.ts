import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-helpers';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const category = await db.category.update({
    where: { id: params.id },
    data: {
      key: body.key,
      name: body.name,
      icon: body.icon,
      providers: body.providers ? JSON.stringify(body.providers) : null,
      order: body.order ?? 0,
      isActive: body.isActive ?? true
    }
  });
  return NextResponse.json({ category });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await db.category.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
