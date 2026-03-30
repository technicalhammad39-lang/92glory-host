import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-helpers';
import { PAYMENT_CHANNELS } from '@/lib/payment-channels';

function normalizeMethod(value: unknown) {
  return String(value || '').trim().toUpperCase();
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;
  const method = normalizeMethod(id);
  if (!Object.prototype.hasOwnProperty.call(PAYMENT_CHANNELS, method)) {
    return NextResponse.json({ error: 'Channel not found.' }, { status: 404 });
  }

  return NextResponse.json(
    {
      error:
        'Channel editing is not enabled in this build. Update channels from lib/payment-channels.ts.'
    },
    { status: 405 }
  );
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;
  const method = normalizeMethod(id);
  if (!Object.prototype.hasOwnProperty.call(PAYMENT_CHANNELS, method)) {
    return NextResponse.json({ error: 'Channel not found.' }, { status: 404 });
  }

  return NextResponse.json(
    {
      error:
        'Channel deletion is not enabled in this build. Update channels from lib/payment-channels.ts.'
    },
    { status: 405 }
  );
}
