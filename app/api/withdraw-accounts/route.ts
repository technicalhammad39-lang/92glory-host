import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/api-helpers';
import { apiError } from '@/lib/api-error';
import { isPaymentMethodId } from '@/lib/payment-channels';

function normalizeMethod(value: unknown) {
  return String(value || '').trim().toUpperCase();
}

function normalizeText(value: unknown) {
  return String(value || '').trim();
}

function toLegacyAccountShape(account: any, index: number) {
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

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const accounts = await db.paymentAccount.findMany({
      where: { userId: user.id, isActive: true },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json({ accounts: accounts.map((account, index) => toLegacyAccountShape(account, index)) });
  } catch (error) {
    return apiError('withdraw-accounts.get', error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const method = normalizeMethod(body.method);
    const accountNumber = normalizeText(body.accountNumber);
    const accountName = normalizeText(body.accountName);
    const title = normalizeText(body.title);
    const usdtAddress = normalizeText(body.usdtAddress || body.accountNumber);

    if (!isPaymentMethodId(method)) {
      return NextResponse.json({ error: 'Invalid method.' }, { status: 400 });
    }

    if (method === 'USDT') {
      if (!usdtAddress) {
        return NextResponse.json({ error: 'USDT address is required.' }, { status: 400 });
      }
    } else if (!accountNumber || !accountName) {
      return NextResponse.json({ error: 'Method, account number and account name are required.' }, { status: 400 });
    }

    const account = await db.paymentAccount.upsert({
      where: { userId_method: { userId: user.id, method } },
      update: {
        accountTitle: title || method,
        accountName: method === 'USDT' ? null : accountName,
        accountNumber: method === 'USDT' ? null : accountNumber,
        usdtAddress: method === 'USDT' ? usdtAddress : null,
        isActive: true
      },
      create: {
        userId: user.id,
        method,
        accountTitle: title || method,
        accountName: method === 'USDT' ? null : accountName,
        accountNumber: method === 'USDT' ? null : accountNumber,
        usdtAddress: method === 'USDT' ? usdtAddress : null,
        isActive: true
      }
    });

    return NextResponse.json({ account: toLegacyAccountShape(account, 0) });
  } catch (error) {
    return apiError('withdraw-accounts.post', error);
  }
}
