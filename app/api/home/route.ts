import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureSeeded } from '@/lib/seed';
import { apiError } from '@/lib/api-error';

export async function GET() {
  try {
    await ensureSeeded();
    const [site, banners, categories, games, popups, recentWins] = await Promise.all([
      db.siteConfig.findFirst(),
      db.banner.findMany({ where: { isActive: true, placement: 'home' }, orderBy: { order: 'asc' } }),
      db.category.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } }),
      db.game.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } }),
      db.popup.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } }),
      db.transaction.findMany({
        where: {
          status: 'COMPLETED',
          type: { in: ['GAME_WIN', 'BONUS', 'COMMISSION'] }
        },
        orderBy: { createdAt: 'desc' },
        take: 12,
        select: {
          id: true,
          amount: true,
          createdAt: true,
          user: {
            select: {
              name: true,
              uid: true
            }
          }
        }
      })
    ]);

    return NextResponse.json({
      site,
      banners,
      categories,
      games,
      popups,
      recentWins
    });
  } catch (error) {
    return apiError('home.get', error);
  }
}
