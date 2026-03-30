import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/api-helpers';
import { isPaymentMethodId } from '@/lib/payment-channels';

function normalizeText(value: unknown, maxLength = 120) {
  return String(value || '').trim().slice(0, maxLength);
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const accounts = await db.paymentAccount.findMany({
    where: {
      userId: user.id,
      isActive: true
    },
    orderBy: { updatedAt: 'desc' }
  });

  return NextResponse.json({ accounts });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const method = normalizeText(body?.method, 20).toUpperCase();
    if (!isPaymentMethodId(method)) {
      return NextResponse.json({ error: 'Invalid payment method.' }, { status: 400 });
    }

    const accountTitle = normalizeText(body?.accountTitle, 80);
    const accountName = normalizeText(body?.accountName, 80);
    const accountNumber = normalizeText(body?.accountNumber, 80);
    const usdtAddress = normalizeText(body?.usdtAddress, 150);

    if (!accountTitle) {
      return NextResponse.json({ error: 'Account title is required.' }, { status: 400 });
    }

    if (method === 'USDT') {
      if (!usdtAddress) {
        return NextResponse.json({ error: 'USDT address is required.' }, { status: 400 });
      }
    } else {
      if (!accountNumber || !accountName) {
        return NextResponse.json({ error: 'Account number and account name are required.' }, { status: 400 });
      }
    }

    const account = await db.paymentAccount.upsert({
      where: {
        userId_method: {
          userId: user.id,
          method
        }
      },
      update: {
        accountTitle,
        accountName: accountName || null,
        accountNumber: accountNumber || null,
        usdtAddress: usdtAddress || null,
        isActive: true
      },
      create: {
        userId: user.id,
        method,
        accountTitle,
        accountName: accountName || null,
        accountNumber: accountNumber || null,
        usdtAddress: usdtAddress || null,
        isActive: true
      }
    });

    return NextResponse.json({ account });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('/api/payment-accounts POST failed:', error);
    }
    return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 });
  }
}
