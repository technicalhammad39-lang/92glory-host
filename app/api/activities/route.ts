import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureSeeded } from '@/lib/seed';
import { requireAdmin } from '@/lib/api-helpers';
import { apiError } from '@/lib/api-error';

const fallbackActivities = [
  {
    id: 'fallback-gift',
    title: 'Gifts',
    description: 'Enter the redemption code to receive gift rewards',
    image: '/gifts.webp',
    type: 'card',
    order: 1,
    isActive: true
  },
  {
    id: 'fallback-attendance',
    title: 'Attendance bonus',
    description: 'The more consecutive days you sign in, the higher the reward will be.',
    image: '/attendence bonus.webp',
    type: 'card',
    order: 2,
    isActive: true
  },
  {
    id: 'fallback-deposit',
    title: 'Deposit bonus',
    description: 'Get extra rewards when you deposit',
    image: '/depositbonus.png',
    type: 'banner',
    order: 3,
    isActive: true
  }
];

export async function GET() {
  try {
    await ensureSeeded();
    const activities = await db.activity.findMany({
      where: { isActive: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }]
    });

    return NextResponse.json({
      activities: activities.length ? activities : fallbackActivities
    });
  } catch {
    return NextResponse.json({ activities: fallbackActivities });
  }
}

export async function POST(req: NextRequest) {
  try {
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
  } catch (error) {
    return apiError('activities.post', error);
  }
}
