import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-helpers';
import { db } from '@/lib/db';
import { apiError } from '@/lib/api-error';

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));

    const task = await db.activityTask.update({
      where: { id },
      data: {
        title: body.title === undefined ? undefined : String(body.title || '').trim(),
        description: body.description === undefined ? undefined : String(body.description || '').trim(),
        gameType: body.gameType === undefined ? undefined : String(body.gameType || 'SLOT').trim().toUpperCase(),
        period:
          body.period === undefined
            ? undefined
            : String(body.period || 'DAILY').trim().toUpperCase() === 'WEEKLY'
              ? 'WEEKLY'
              : 'DAILY',
        targetAmount: body.targetAmount === undefined ? undefined : Number(body.targetAmount || 0),
        rewardAmount: body.rewardAmount === undefined ? undefined : Number(body.rewardAmount || 0),
        order: body.order === undefined ? undefined : Number(body.order || 0),
        isActive: body.isActive === undefined ? undefined : Boolean(body.isActive)
      }
    });
    return NextResponse.json({ task });
  } catch (error) {
    return apiError('admin.activity-tasks.id.put', error);
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await context.params;
    await db.activityTask.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError('admin.activity-tasks.id.delete', error);
  }
}

