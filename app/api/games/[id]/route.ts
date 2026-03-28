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
    const name = String(body.name || '').trim();
    const category = String(body.category || '').trim();
    const image = String(body.image || '').trim();
    if (!name || !category || !image) {
      return NextResponse.json({ error: 'name, category and image are required.' }, { status: 400 });
    }

    const game = await db.game.update({
      where: { id },
      data: {
        name,
        category,
        image,
        provider: body.provider || null,
        order: Number(body.order ?? 0),
        isActive: body.isActive ?? true
      }
    });
    return NextResponse.json({ game });
  } catch (error) {
    return apiError('games.put', error);
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await db.game.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError('games.delete', error);
  }
}
