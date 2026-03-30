import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { apiError } from '@/lib/api-error';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const category = String(url.searchParams.get('category') || 'LOTTERY').trim().toUpperCase();

    const ratios = await db.rebateRatio.findMany({
      where: { category },
      orderBy: [{ level: 'asc' }, { order: 'asc' }]
    });

    const grouped = ratios.reduce<Record<string, typeof ratios>>((acc, row) => {
      const key = `L${row.level}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(row);
      return acc;
    }, {});

    const categories = await db.rebateRatio.findMany({
      distinct: ['category'],
      select: { category: true },
      orderBy: { category: 'asc' }
    });

    return NextResponse.json({
      category,
      categories: categories.map((item) => item.category),
      levels: grouped
    });
  } catch (error) {
    return apiError('promotion.rebate-ratio.get', error);
  }
}

