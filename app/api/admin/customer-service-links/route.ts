import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-helpers';
import { db } from '@/lib/db';
import { apiError } from '@/lib/api-error';

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const links = await db.customerServiceLink.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }]
    });
    return NextResponse.json({ links });
  } catch (error) {
    return apiError('admin.customer-service-links.get', error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const link = await db.customerServiceLink.create({
      data: {
        label: String(body.label || '').trim(),
        type: String(body.type || 'TELEGRAM').trim().toUpperCase(),
        url: String(body.url || '').trim(),
        isActive: body.isActive === undefined ? true : Boolean(body.isActive),
        order: Number(body.order || 0)
      }
    });
    return NextResponse.json({ link });
  } catch (error) {
    return apiError('admin.customer-service-links.post', error);
  }
}

