import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/api-helpers';
import { apiError } from '@/lib/api-error';
import { endOfDay, startOfDay } from '@/lib/feature-utils';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const mode = String(url.searchParams.get('mode') || 'ALL').trim().toUpperCase();
    const dateInput = String(url.searchParams.get('date') || '').trim();
    const baseDate = dateInput ? new Date(dateInput) : null;
    const range =
      baseDate && !Number.isNaN(baseDate.getTime())
        ? { gte: startOfDay(baseDate), lt: endOfDay(baseDate) }
        : undefined;

    const where: any = {
      userId: user.id,
      type: { in: ['GAME_WIN', 'GAME_LOSS'] }
    };
    if (range) where.createdAt = range;
    if (mode === 'IN') where.type = 'GAME_LOSS';
    if (mode === 'OUT') where.type = 'GAME_WIN';

    const transactions = await db.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 300
    });

    return NextResponse.json({
      records: transactions.map((row) => ({
        id: row.id,
        detail: row.type === 'GAME_WIN' ? 'Game moved out' : 'Game moved in',
        mode: row.type === 'GAME_WIN' ? 'OUT' : 'IN',
        amount: row.amount,
        createdAt: row.createdAt
      }))
    });
  } catch (error) {
    return apiError('history.wallet.get', error);
  }
}

