import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-helpers';
import { db } from '@/lib/db';
import { apiError } from '@/lib/api-error';

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await context.params;

    const target = await db.notification.findUnique({ where: { id } });
    if (!target || target.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await db.notification.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError('notifications.id.delete', error);
  }
}

