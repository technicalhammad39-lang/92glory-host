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

    const level = Number(body.level);
    const group = String(body.group || '').toUpperCase();
    const title = String(body.title || '').trim();
    const image = String(body.image || '').trim();

    if (!Number.isFinite(level) || level < 0) {
      return NextResponse.json({ error: 'Invalid level value.' }, { status: 400 });
    }
    if (!group) return NextResponse.json({ error: 'Group is required.' }, { status: 400 });
    if (!title) return NextResponse.json({ error: 'Title is required.' }, { status: 400 });
    if (!image) return NextResponse.json({ error: 'Image is required.' }, { status: 400 });

    const benefit = await db.vipBenefit.update({
      where: { id },
      data: {
        level,
        group,
        title,
        description: body.description || null,
        image,
        value: body.value || null,
        secondaryValue: body.secondaryValue || null,
        order: Number(body.order ?? 0)
      }
    });
    return NextResponse.json({ benefit });
  } catch (error) {
    return apiError('vip.benefits.put', error);
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await db.vipBenefit.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError('vip.benefits.delete', error);
  }
}
