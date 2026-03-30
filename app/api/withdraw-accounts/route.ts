import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/api-helpers';
import { apiError } from '@/lib/api-error';

function normalizeMethod(value: unknown) {
  return String(value || '').trim().toUpperCase();
}

function normalizeText(value: unknown) {
  return String(value || '').trim();
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const accounts = await db.withdrawAccount.findMany({
      where: { userId: user.id, isActive: true },
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }]
    });

    return NextResponse.json({ accounts });
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

    if (!method || !accountNumber || !accountName) {
      return NextResponse.json({ error: 'Method, account number and account name are required.' }, { status: 400 });
    }

    const existing = await db.withdrawAccount.findUnique({
      where: { userId_method: { userId: user.id, method } }
    });

    let account;
    if (existing) {
      account = await db.withdrawAccount.update({
        where: { id: existing.id },
        data: {
          accountNumber,
          accountName,
          title: title || null,
          isActive: true
        }
      });
    } else {
      const hasAnyAccount = await db.withdrawAccount.count({ where: { userId: user.id, isActive: true } });
      account = await db.withdrawAccount.create({
        data: {
          userId: user.id,
          method,
          accountNumber,
          accountName,
          title: title || null,
          isDefault: hasAnyAccount === 0
        }
      });
    }

    return NextResponse.json({ account });
  } catch (error) {
    return apiError('withdraw-accounts.post', error);
  }
}

