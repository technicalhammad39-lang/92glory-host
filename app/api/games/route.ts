import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureSeeded } from '@/lib/seed';
import { requireAdmin } from '@/lib/api-helpers';
import { apiError } from '@/lib/api-error';

export async function GET() {
  try {
    await ensureSeeded();
    const games = await db.game.findMany({ orderBy: { order: 'asc' } });
    return NextResponse.json({ games });
  } catch (error) {
    return apiError('games.get', error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const game = await db.game.create({
      data: {
        name: body.name,
        category: body.category,
        image: body.image,
        provider: body.provider || null,
        order: body.order ?? 0,
        isActive: body.isActive ?? true
      }
    });
    return NextResponse.json({ game });
  } catch (error) {
    return apiError('games.post', error);
  }
}
