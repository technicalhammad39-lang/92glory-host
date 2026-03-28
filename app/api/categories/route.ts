import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureSeeded } from '@/lib/seed';
import { requireAdmin } from '@/lib/api-helpers';

export async function GET() {
  await ensureSeeded();
  const categories = await db.category.findMany({ orderBy: { order: 'asc' } });
  return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const category = await db.category.create({
    data: {
      key: body.key,
      name: body.name,
      icon: body.icon,
      providers: body.providers ? JSON.stringify(body.providers) : null,
      order: body.order ?? 0,
      isActive: body.isActive ?? true
    }
  });
  return NextResponse.json({ category });
}
