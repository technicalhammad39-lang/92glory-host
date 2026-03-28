import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureSeeded } from '@/lib/seed';
import { requireAdmin } from '@/lib/api-helpers';
import { apiError } from '@/lib/api-error';

export async function GET() {
  try {
    await ensureSeeded();
    const popups = await db.popup.findMany({ orderBy: { order: 'asc' } });
    return NextResponse.json({ popups });
  } catch (error) {
    return apiError('popups.get', error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const title = String(body.title || '').trim();
    const content = String(body.content || '').trim();
    if (!title || !content) {
      return NextResponse.json({ error: 'title and content are required.' }, { status: 400 });
    }

    const popup = await db.popup.create({
      data: {
        title,
        content,
        order: Number(body.order ?? 0),
        isActive: body.isActive ?? true
      }
    });
    return NextResponse.json({ popup });
  } catch (error) {
    return apiError('popups.post', error);
  }
}
