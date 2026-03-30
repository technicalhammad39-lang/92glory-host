import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { apiError } from '@/lib/api-error';

export async function GET(_req: NextRequest) {
  try {
    const links = await db.customerServiceLink.findMany({
      where: { isActive: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }]
    });
    return NextResponse.json({ links });
  } catch (error) {
    return apiError('promotion.customer-service.get', error);
  }
}

