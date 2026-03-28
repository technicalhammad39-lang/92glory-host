import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureSeeded } from '@/lib/seed';
import { requireAdmin } from '@/lib/api-helpers';
import { apiError } from '@/lib/api-error';

export async function GET() {
  try {
    await ensureSeeded();
    const activities = await db.activity.findMany({ orderBy: { order: 'asc' } });
    return NextResponse.json({ activities });
  } catch (error) {
    return apiError('activities.get', error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const title = String(body.title || '').trim();
    const image = String(body.image || '').trim();
    if (!title || !image) {
      return NextResponse.json({ error: 'title and image are required.' }, { status: 400 });
    }

    const activity = await db.activity.create({
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
    return apiError('activities.post', error);
  }
}
