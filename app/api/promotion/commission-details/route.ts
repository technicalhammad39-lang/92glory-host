import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/api-helpers';
import { apiError } from '@/lib/api-error';
import { endOfDay, parseMeta, startOfDay } from '@/lib/feature-utils';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const dateInput = String(url.searchParams.get('date') || '').trim();
    const baseDate = dateInput ? new Date(dateInput) : new Date();
    if (Number.isNaN(baseDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date.' }, { status: 400 });
    }

    const start = startOfDay(baseDate);
    const end = endOfDay(baseDate);
    const records = await db.transaction.findMany({
      where: {
        userId: user.id,
        type: 'COMMISSION',
        status: 'COMPLETED',
        createdAt: { gte: start, lt: end }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      date: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`,
      records: records.map((row) => {
        const meta = parseMeta<Record<string, unknown>>(row.meta);
        return {
          id: row.id,
          amount: row.amount,
          createdAt: row.createdAt,
          sourceUid: String(meta.sourceUid || meta.uid || ''),
          sourceType: String(meta.sourceType || meta.stage || 'commission')
        };
      })
    });
  } catch (error) {
    return apiError('promotion.commission-details.get', error);
  }
}

