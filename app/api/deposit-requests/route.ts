import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, requireAdmin } from '@/lib/api-helpers';
import { apiError } from '@/lib/api-error';

function normalizeStatus(value: unknown) {
  return String(value || '').trim().toUpperCase();
}

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const user = admin ? null : await getAuthUser(req);
    if (!admin && !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const status = normalizeStatus(url.searchParams.get('status'));
    const limitRaw = Number(url.searchParams.get('limit') || 0);
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 100) : undefined;

    const where: any = {};
    if (!admin && user) where.userId = user.id;
    if (status) where.status = status;

    const requests = await db.depositRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        channel: true,
        transaction: true,
        user: admin
          ? {
              select: {
                id: true,
                uid: true,
                name: true,
                phone: true,
                email: true
              }
            }
          : false
      }
    });

    return NextResponse.json({ requests });
  } catch (error) {
    return apiError('deposit-requests.get', error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const channelId = String(body.channelId || '').trim();
    const amount = Number(body.amount || 0);
    const note = String(body.note || '').trim();

    if (!channelId || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Channel and valid amount are required.' }, { status: 400 });
    }

    const channel = await db.depositChannel.findUnique({ where: { id: channelId } });
    if (!channel || !channel.isActive) {
      return NextResponse.json({ error: 'Selected channel is not available.' }, { status: 400 });
    }

    const payload = await db.$transaction(async (tx) => {
      const trx = await tx.transaction.create({
        data: {
          userId: user.id,
          type: 'DEPOSIT',
          amount,
          status: 'PENDING',
          meta: JSON.stringify({
            source: 'deposit_request',
            channelId: channel.id,
            method: channel.method,
            title: channel.title
          })
        }
      });

      const request = await tx.depositRequest.create({
        data: {
          userId: user.id,
          channelId: channel.id,
          amount,
          status: 'PENDING',
          note: note || null,
          transactionId: trx.id
        },
        include: {
          channel: true,
          transaction: true
        }
      });

      return request;
    });

    return NextResponse.json({ request: payload });
  } catch (error) {
    return apiError('deposit-requests.post', error);
  }
}

