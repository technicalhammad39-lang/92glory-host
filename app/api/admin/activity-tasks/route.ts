import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-helpers';
import { db } from '@/lib/db';
import { apiError } from '@/lib/api-error';

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const tasks = await db.activityTask.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }]
    });
    return NextResponse.json({ tasks });
  } catch (error) {
    return apiError('admin.activity-tasks.get', error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));

    const task = await db.activityTask.create({
      data: {
        title: String(body.title || '').trim(),
        description: String(body.description || '').trim(),
        gameType: String(body.gameType || 'SLOT').trim().toUpperCase(),
        period: String(body.period || 'DAILY').trim().toUpperCase() === 'WEEKLY' ? 'WEEKLY' : 'DAILY',
        targetAmount: Number(body.targetAmount || 0),
        rewardAmount: Number(body.rewardAmount || 0),
        order: Number(body.order || 0),
        isActive: body.isActive === undefined ? true : Boolean(body.isActive)
      }
    });
    return NextResponse.json({ task });
  } catch (error) {
    return apiError('admin.activity-tasks.post', error);
  }
}

