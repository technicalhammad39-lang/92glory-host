import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureSeeded } from '@/lib/seed';
import { apiError } from '@/lib/api-error';

export async function GET() {
  try {
    await ensureSeeded();
    const [site, banners, categories, games, popups] = await Promise.all([
      db.siteConfig.findFirst(),
      db.banner.findMany({ where: { isActive: true, placement: 'home' }, orderBy: { order: 'asc' } }),
      db.category.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } }),
      db.game.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } }),
      db.popup.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } })
    ]);

    return NextResponse.json({
      site,
      banners,
      categories,
      games,
      popups
    });
  } catch (error) {
    return apiError('home.get', error);
  }
}
