import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-helpers';
import { apiError } from '@/lib/api-error';
import { ensureSeeded } from '@/lib/seed';

const MAX_ACTIVE_CHANNELS = 3;

function normalizeMethod(value: unknown) {
  return String(value || '').trim().toUpperCase();
}

function normalizeText(value: unknown) {
  return String(value || '').trim();
}

export async function GET(req: NextRequest) {
  try {
    await ensureSeeded();
    const admin = await requireAdmin(req);
    const url = new URL(req.url);
    const method = normalizeMethod(url.searchParams.get('method'));

    const where: any = {};
    if (!admin) where.isActive = true;
    if (method) where.method = method;

    const channels = await db.depositChannel.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
    });

    return NextResponse.json({
      channels: admin ? channels : channels.slice(0, MAX_ACTIVE_CHANNELS)
    });
  } catch (error) {
    return apiError('deposit-channels.get', error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const method = normalizeMethod(body.method);
    const title = normalizeText(body.title);
    const logo = normalizeText(body.logo);
    const accountNumber = normalizeText(body.accountNumber);
    const accountName = normalizeText(body.accountName);
    const instructions = normalizeText(body.instructions);
    const sortOrder = Number(body.sortOrder ?? 0);
    const isActive = body.isActive !== false;

    if (!method || !title || !logo || !accountNumber || !accountName) {
      return NextResponse.json({ error: 'Method, title, logo, account number and account name are required.' }, { status: 400 });
    }

    if (isActive) {
      const activeCount = await db.depositChannel.count({ where: { isActive: true } });
      if (activeCount >= MAX_ACTIVE_CHANNELS) {
        return NextResponse.json({ error: `Only ${MAX_ACTIVE_CHANNELS} active channels are allowed.` }, { status: 400 });
      }
    }

    const channel = await db.depositChannel.create({
      data: {
        method,
        title,
        logo,
        accountNumber,
        accountName,
        instructions: instructions || null,
        sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
        isActive
      }
    });

    await db.adminActionLog.create({
      data: {
        adminId: admin.id,
        action: 'CREATE_DEPOSIT_CHANNEL',
        targetType: 'DepositChannel',
        targetId: channel.id,
        details: JSON.stringify({ method: channel.method, title: channel.title, isActive: channel.isActive })
      }
    });

    return NextResponse.json({ channel });
  } catch (error) {
    return apiError('deposit-channels.post', error);
  }
}
