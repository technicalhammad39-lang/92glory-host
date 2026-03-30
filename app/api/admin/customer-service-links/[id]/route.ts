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
    const link = await db.customerServiceLink.update({
      where: { id },
      data: {
        label: body.label === undefined ? undefined : String(body.label || '').trim(),
        type: body.type === undefined ? undefined : String(body.type || 'TELEGRAM').trim().toUpperCase(),
        url: body.url === undefined ? undefined : String(body.url || '').trim(),
        isActive: body.isActive === undefined ? undefined : Boolean(body.isActive),
        order: body.order === undefined ? undefined : Number(body.order || 0)
      }
    });
    return NextResponse.json({ link });
  } catch (error) {
    return apiError('admin.customer-service-links.id.put', error);
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await context.params;
    await db.customerServiceLink.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError('admin.customer-service-links.id.delete', error);
  }
}

