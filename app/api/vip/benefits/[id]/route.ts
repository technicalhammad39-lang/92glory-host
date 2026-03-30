import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-helpers';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const benefit = await db.vipBenefit.update({
    where: { id },
    data: {
      level: body.level,
      group: body.group,
      title: body.title,
      description: body.description || null,
      image: body.image,
      value: body.value || null,
      secondaryValue: body.secondaryValue || null,
      order: body.order ?? 0
    }
  });
  return NextResponse.json({ benefit });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  await db.vipBenefit.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
