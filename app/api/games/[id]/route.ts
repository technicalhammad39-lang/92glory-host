import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-helpers';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const game = await db.game.update({
    where: { id: params.id },
    data: {
      name: body.name,
      category: body.category,
      image: body.image,
      provider: body.provider || null,
      order: body.order ?? 0,
      isActive: body.isActive ?? true
    }
  });
  return NextResponse.json({ game });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await db.game.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
