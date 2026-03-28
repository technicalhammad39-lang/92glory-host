import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureSeeded } from '@/lib/seed';
import { requireAdmin } from '@/lib/api-helpers';

export async function GET() {
  await ensureSeeded();
  const games = await db.game.findMany({ orderBy: { order: 'asc' } });
  return NextResponse.json({ games });
}

export async function POST(req: NextRequest) {
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
}
