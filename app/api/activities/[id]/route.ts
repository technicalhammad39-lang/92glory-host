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
    const title = String(body.title || '').trim();
    const image = String(body.image || '').trim();
    if (!title || !image) {
      return NextResponse.json({ error: 'title and image are required.' }, { status: 400 });
    }

    const activity = await db.activity.update({
      where: { id },
      data: {
        title,
        description: body.description || null,
        image,
        type: body.type || 'card',
        order: Number(body.order ?? 0),
        isActive: body.isActive ?? true
      }
    });
    return NextResponse.json({ activity });
  } catch (error) {
    return apiError('activities.put', error);
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await db.activity.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError('activities.delete', error);
  }
}
