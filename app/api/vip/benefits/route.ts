import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-helpers';

export async function GET() {
  const benefits = await db.vipBenefit.findMany({ orderBy: { order: 'asc' } });
  return NextResponse.json({ benefits });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const benefit = await db.vipBenefit.create({
    data: {
      level: body.level,
      group: body.group,
      title: body.title,
      description: body.description || null,
      image: body.image,
      value: body.value || null,
      secondaryValue: body.secondaryValue || null,
      order: body.order ?? 0
    }
  });
  return NextResponse.json({ benefit });
}
