import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureSeeded } from '@/lib/seed';
import { requireAdmin } from '@/lib/api-helpers';

export async function GET() {
  await ensureSeeded();
  const activities = await db.activity.findMany({ orderBy: { order: 'asc' } });
  return NextResponse.json({ activities });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const activity = await db.activity.create({
    data: {
      title: body.title,
      description: body.description || null,
      image: body.image,
      type: body.type || 'card',
      order: body.order ?? 0,
      isActive: body.isActive ?? true
    }
  });
  return NextResponse.json({ activity });
}
