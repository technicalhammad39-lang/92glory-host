import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureSeeded } from '@/lib/seed';
import { getAuthUser } from '@/lib/api-helpers';
import { apiError } from '@/lib/api-error';

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeek(date: Date) {
  const day = date.getDay();
  const diff = date.getDate() - day;
  return new Date(date.getFullYear(), date.getMonth(), diff);
}

async function getTeamIds(userId: string) {
  const team: string[] = [];
  let frontier = [userId];

  while (frontier.length > 0) {
    const downlines = await db.user.findMany({
      where: { uplineId: { in: frontier } },
      select: { id: true }
    });

    const nextFrontier = downlines.map((d) => d.id);
    if (nextFrontier.length === 0) break;

    team.push(...nextFrontier);
    frontier = nextFrontier;
  }

  return team;
}

export async function GET(req: NextRequest) {
  try {
    await ensureSeeded();
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const directIds = await db.user.findMany({ where: { uplineId: user.id }, select: { id: true } });
    const teamIds = await getTeamIds(user.id);
    const today = new Date();
    const yesterdayStart = startOfDay(new Date(today.getTime() - 24 * 60 * 60 * 1000));
    const yesterdayEnd = startOfDay(today);
    const weekStart = startOfWeek(today);

    const [yesterdayCommission, totalCommission, weekCommission, setting] = await Promise.all([
      db.transaction.aggregate({
        _sum: { amount: true },
        where: {
          userId: user.id,
          type: 'COMMISSION',
          createdAt: { gte: yesterdayStart, lt: yesterdayEnd }
        }
      }),
      db.transaction.aggregate({
        _sum: { amount: true },
        where: { userId: user.id, type: 'COMMISSION' }
      }),
      db.transaction.aggregate({
        _sum: { amount: true },
        where: { userId: user.id, type: 'COMMISSION', createdAt: { gte: weekStart } }
      }),
      db.promotionSetting.findFirst()
    ]);

    const directUserIds = directIds.map((d) => d.id);

    const [directDeposits, teamDeposits] = await Promise.all([
      db.transaction.findMany({
        where: { userId: { in: directUserIds }, type: 'DEPOSIT', status: 'COMPLETED' }
      }),
      db.transaction.findMany({
        where: { userId: { in: teamIds }, type: 'DEPOSIT', status: 'COMPLETED' }
      })
    ]);

    const directFirstDepositors = new Set<string>();
    directDeposits.forEach((d) => directFirstDepositors.add(d.userId));
    const teamFirstDepositors = new Set<string>();
    teamDeposits.forEach((d) => teamFirstDepositors.add(d.userId));

    return NextResponse.json({
      yesterdayTotalCommission: yesterdayCommission._sum.amount || 0,
      directSubordinates: directUserIds.length,
      teamSubordinates: teamIds.length,
      directStats: {
        registerCount: directUserIds.length,
        depositCount: directDeposits.length,
        depositAmount: directDeposits.reduce((sum, d) => sum + d.amount, 0),
        firstDepositCount: directFirstDepositors.size
      },
      teamStats: {
        registerCount: teamIds.length,
        depositCount: teamDeposits.length,
        depositAmount: teamDeposits.reduce((sum, d) => sum + d.amount, 0),
        firstDepositCount: teamFirstDepositors.size
      },
      promotionData: {
        thisWeek: weekCommission._sum.amount || 0,
        totalCommission: totalCommission._sum.amount || 0,
        directSubordinate: directUserIds.length,
        totalTeam: teamIds.length
      },
      inviteCode: user.inviteCode,
      setting
    });
  } catch (error) {
    return apiError('promotion.get', error);
  }
}
