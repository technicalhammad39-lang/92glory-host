import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-helpers';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const level = await db.vipLevel.update({
    where: { id },
    data: {
      level: body.level,
      title: body.title,
      expRequired: body.expRequired ?? 0,
      payoutDays: body.payoutDays ?? 5,
      betToExp: body.betToExp ?? 100,
      isOpen: body.isOpen ?? true,
      cardImage: body.cardImage || null,
      badgeImage: body.badgeImage || null
    }
  });
  return NextResponse.json({ level });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  await db.vipLevel.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
