import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/api-helpers';
import { apiError } from '@/lib/api-error';

function normalizeText(value: unknown) {
  return String(value || '').trim();
}

function toLegacyAccountShape(account: any, index = 0) {
  return {
    id: account.id,
    userId: account.userId,
    method: account.method,
    accountNumber: account.accountNumber || account.usdtAddress || '',
    accountName: account.accountName || '',
    title: account.accountTitle || '',
    isDefault: index === 0,
    isActive: account.isActive,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt
  };
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const existing = await db.paymentAccount.findUnique({ where: { id } });
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const accountNumber = body.accountNumber === undefined ? undefined : normalizeText(body.accountNumber);
    const accountName = body.accountName === undefined ? undefined : normalizeText(body.accountName);
    const title = body.title === undefined ? undefined : normalizeText(body.title);
    const usdtAddress = body.usdtAddress === undefined ? undefined : normalizeText(body.usdtAddress);

    const account = await db.paymentAccount.update({
      where: { id },
      data: {
        accountNumber,
        accountName,
        accountTitle: title === undefined ? undefined : title || existing.accountTitle,
        usdtAddress
      }
    });

    return NextResponse.json({ account: toLegacyAccountShape(account) });
  } catch (error) {
    return apiError('withdraw-accounts.put', error);
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const existing = await db.paymentAccount.findUnique({ where: { id } });
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
    }

    await db.paymentAccount.update({
      where: { id },
      data: { isActive: false }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError('withdraw-accounts.delete', error);
  }
}
