import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-helpers';
import { apiError } from '@/lib/api-error';

const MAX_ACTIVE_CHANNELS = 3;

function normalizeMethod(value: unknown) {
  return String(value || '').trim().toUpperCase();
}

function normalizeText(value: unknown) {
  return String(value || '').trim();
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const existing = await db.depositChannel.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Channel not found.' }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const method = body.method === undefined ? undefined : normalizeMethod(body.method);
    const title = body.title === undefined ? undefined : normalizeText(body.title);
    const logo = body.logo === undefined ? undefined : normalizeText(body.logo);
    const accountNumber = body.accountNumber === undefined ? undefined : normalizeText(body.accountNumber);
    const accountName = body.accountName === undefined ? undefined : normalizeText(body.accountName);
    const instructions = body.instructions === undefined ? undefined : normalizeText(body.instructions);
    const sortOrder = body.sortOrder === undefined ? undefined : Number(body.sortOrder);
    const isActive = body.isActive === undefined ? undefined : Boolean(body.isActive);

    if (isActive === true && !existing.isActive) {
      const activeCount = await db.depositChannel.count({ where: { isActive: true } });
      if (activeCount >= MAX_ACTIVE_CHANNELS) {
        return NextResponse.json({ error: `Only ${MAX_ACTIVE_CHANNELS} active channels are allowed.` }, { status: 400 });
      }
    }

    const channel = await db.depositChannel.update({
      where: { id },
      data: {
        method,
        title,
        logo,
        accountNumber,
        accountName,
        instructions: instructions === undefined ? undefined : instructions || null,
        sortOrder: sortOrder === undefined ? undefined : (Number.isFinite(sortOrder) ? sortOrder : existing.sortOrder),
        isActive
      }
    });

    await db.adminActionLog.create({
      data: {
        adminId: admin.id,
        action: 'UPDATE_DEPOSIT_CHANNEL',
        targetType: 'DepositChannel',
        targetId: channel.id,
        details: JSON.stringify({ method: channel.method, title: channel.title, isActive: channel.isActive })
      }
    });

    return NextResponse.json({ channel });
  } catch (error) {
    return apiError('deposit-channels.put', error);
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const existing = await db.depositChannel.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Channel not found.' }, { status: 404 });

    await db.depositChannel.delete({ where: { id } });
    await db.adminActionLog.create({
      data: {
        adminId: admin.id,
        action: 'DELETE_DEPOSIT_CHANNEL',
        targetType: 'DepositChannel',
        targetId: id,
        details: JSON.stringify({ method: existing.method, title: existing.title })
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError('deposit-channels.delete', error);
  }
}

