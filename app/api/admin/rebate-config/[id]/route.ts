import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-helpers';
import { db } from '@/lib/db';
import { apiError } from '@/lib/api-error';

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));

    const config = await db.rebateConfig.update({
      where: { id },
      data: {
        gameType: body.gameType === undefined ? undefined : String(body.gameType || '').trim().toUpperCase(),
        title: body.title === undefined ? undefined : String(body.title || '').trim(),
        rate: body.rate === undefined ? undefined : Number(body.rate || 0),
        order: body.order === undefined ? undefined : Number(body.order || 0),
        isActive: body.isActive === undefined ? undefined : Boolean(body.isActive)
      }
    });

    return NextResponse.json({ config });
  } catch (error) {
    return apiError('admin.rebate-config.id.put', error);
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await context.params;
    await db.rebateConfig.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError('admin.rebate-config.id.delete', error);
  }
}

