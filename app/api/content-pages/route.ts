import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureSeeded } from '@/lib/seed';
import { requireAdmin } from '@/lib/api-helpers';
import { apiError } from '@/lib/api-error';

export async function GET() {
  try {
    await ensureSeeded();
    const pages = await db.contentPage.findMany({ orderBy: { order: 'asc' } });
    return NextResponse.json({ pages });
  } catch (error) {
    return apiError('content-pages.get', error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const slug = String(body.slug || '').trim();
    const title = String(body.title || '').trim();
    const content = String(body.content || '').trim();
    if (!slug || !title || !content) {
      return NextResponse.json({ error: 'slug, title and content are required.' }, { status: 400 });
    }

    const page = await db.contentPage.create({
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
    return apiError('content-pages.post', error);
  }
}
