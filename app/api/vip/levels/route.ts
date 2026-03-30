import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-helpers';

export async function GET() {
  const levels = await db.vipLevel.findMany({ orderBy: { level: 'asc' } });
  return NextResponse.json({ levels });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const level = await db.vipLevel.create({
    data: {
      level: body.level,
      title: body.title,
      expRequired: body.expRequired ?? 0,
      payoutDays: body.payoutDays ?? 5,
      betToExp: body.betToExp ?? 100,
      isOpen: body.isOpen ?? true,
      cardImage: body.cardImage || null,
      badgeImage: body.badgeImage || null
    }
  });
  return NextResponse.json({ level });
}
