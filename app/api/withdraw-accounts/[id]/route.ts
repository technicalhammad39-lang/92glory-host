import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/api-helpers';
import { apiError } from '@/lib/api-error';

function normalizeText(value: unknown) {
  return String(value || '').trim();
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const existing = await db.withdrawAccount.findUnique({ where: { id } });
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const accountNumber = body.accountNumber === undefined ? undefined : normalizeText(body.accountNumber);
    const accountName = body.accountName === undefined ? undefined : normalizeText(body.accountName);
    const title = body.title === undefined ? undefined : normalizeText(body.title);
    const isDefault = body.isDefault === undefined ? undefined : Boolean(body.isDefault);

    if (isDefault === true) {
      await db.withdrawAccount.updateMany({
        where: { userId: user.id, isDefault: true, id: { not: id } },
        data: { isDefault: false }
      });
    }

    const account = await db.withdrawAccount.update({
      where: { id },
      data: {
        accountNumber,
        accountName,
        title: title === undefined ? undefined : title || null,
        isDefault
      }
    });

    return NextResponse.json({ account });
  } catch (error) {
    return apiError('withdraw-accounts.put', error);
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const existing = await db.withdrawAccount.findUnique({ where: { id } });
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
    }

    await db.withdrawAccount.update({
      where: { id },
      data: { isActive: false, isDefault: false }
    });

    const fallback = await db.withdrawAccount.findFirst({
      where: { userId: user.id, isActive: true },
      orderBy: { updatedAt: 'desc' }
    });
    if (fallback && !fallback.isDefault) {
      await db.withdrawAccount.update({
        where: { id: fallback.id },
        data: { isDefault: true }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError('withdraw-accounts.delete', error);
  }
}

