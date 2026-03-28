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
    const slug = String(body.slug || '').trim();
    const title = String(body.title || '').trim();
    const content = String(body.content || '').trim();
    if (!slug || !title || !content) {
      return NextResponse.json({ error: 'slug, title and content are required.' }, { status: 400 });
    }
    const page = await db.contentPage.update({
      where: { id },
      data: {
        slug,
        title,
        content,
        order: Number(body.order ?? 0),
        isActive: body.isActive ?? true
      }
    });
    return NextResponse.json({ page });
  } catch (error) {
    return apiError('content-pages.put', error);
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await db.contentPage.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError('content-pages.delete', error);
  }
}
