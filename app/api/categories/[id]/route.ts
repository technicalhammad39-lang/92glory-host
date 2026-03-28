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
    const key = String(body.key || '').trim();
    const name = String(body.name || '').trim();
    const icon = String(body.icon || '').trim();
    if (!key || !name || !icon) {
      return NextResponse.json({ error: 'key, name and icon are required.' }, { status: 400 });
    }

    const category = await db.category.update({
      where: { id },
      data: {
        key,
        name,
        icon,
        providers: body.providers ? JSON.stringify(body.providers) : null,
        order: Number(body.order ?? 0),
        isActive: body.isActive ?? true
      }
    });
    return NextResponse.json({ category });
  } catch (error) {
    return apiError('categories.put', error);
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await db.category.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError('categories.delete', error);
  }
}
