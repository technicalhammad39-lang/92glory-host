import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureSeeded } from '@/lib/seed';
import { requireAdmin } from '@/lib/api-helpers';

export async function GET() {
  await ensureSeeded();
  const banners = await db.banner.findMany({ orderBy: { order: 'asc' } });
  return NextResponse.json({ banners });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const banner = await db.banner.create({
    data: {
      title: body.title || '',
      image: body.image,
      link: body.link || null,
      description: body.description || null,
      rulesText: body.rulesText || null,
      order: body.order ?? 0,
      placement: body.placement || 'home',
      isActive: body.isActive ?? true
    }
  });
  return NextResponse.json({ banner });
}
