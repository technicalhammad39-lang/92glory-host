import { NextResponse } from 'next/server';
import { db, isDatabaseReady } from '@/lib/db';
import { ensureSeededSafe, getFallbackHomeData } from '@/lib/seed';

export async function GET() {
  const fallback = getFallbackHomeData();

  try {
    const seeded = await ensureSeededSafe();
    if (!seeded) {
      return NextResponse.json({ ...fallback, fallback: true });
    }

    const dbReady = await isDatabaseReady();
    if (!dbReady) {
      return NextResponse.json({ ...fallback, fallback: true });
    }

    const [site, banners, categories, games, popups] = await db.$transaction([
      db.siteConfig.findFirst(),
      db.banner.findMany({ where: { isActive: true, placement: 'home' }, orderBy: { order: 'asc' } }),
      db.category.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } }),
      db.game.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } }),
      db.popup.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } })
    ]);

    const useFallback = !site || !banners.length || !categories.length || !games.length;

    return NextResponse.json({
      site: site || fallback.site,
      banners: banners.length ? banners : fallback.banners,
      categories: categories.length ? categories : fallback.categories,
      games: games.length ? games : fallback.games,
      popups: popups.length ? popups : fallback.popups,
      fallback: useFallback
    });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('/api/home failed, serving fallback payload:', error);
    }
    return NextResponse.json({ ...fallback, fallback: true });
  }
}
