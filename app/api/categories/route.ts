import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureSeeded } from '@/lib/seed';
import { requireAdmin } from '@/lib/api-helpers';
import { apiError } from '@/lib/api-error';

export async function GET() {
  try {
    await ensureSeeded();
    const categories = await db.category.findMany({ orderBy: { order: 'asc' } });
    return NextResponse.json({ categories });
  } catch (error) {
    return apiError('categories.get', error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const key = String(body.key || '').trim();
    const name = String(body.name || '').trim();
    const icon = String(body.icon || '').trim();
    if (!key || !name || !icon) {
      return NextResponse.json({ error: 'key, name and icon are required.' }, { status: 400 });
    }

    const category = await db.category.create({
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
    return apiError('categories.post', error);
  }
}
