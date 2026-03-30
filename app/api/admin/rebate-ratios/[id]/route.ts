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

    const ratio = await db.rebateRatio.update({
      where: { id },
      data: {
        category: body.category === undefined ? undefined : String(body.category || 'LOTTERY').trim().toUpperCase(),
        level: body.level === undefined ? undefined : Number(body.level || 0),
        depth: body.depth === undefined ? undefined : Number(body.depth || 1),
        ratio: body.ratio === undefined ? undefined : Number(body.ratio || 0),
        order: body.order === undefined ? undefined : Number(body.order || 0)
      }
    });

    return NextResponse.json({ ratio });
  } catch (error) {
    return apiError('admin.rebate-ratios.id.put', error);
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await context.params;
    await db.rebateRatio.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError('admin.rebate-ratios.id.delete', error);
  }
}

