import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-helpers';
import { PAYMENT_CHANNELS, isPaymentMethodId } from '@/lib/payment-channels';

const CHANNEL_ORDER = ['JAZZCASH', 'EASYPAISA', 'USDT'] as const;

function normalizeMethod(value: unknown) {
  return String(value || '').trim().toUpperCase();
}

function listChannels() {
  return CHANNEL_ORDER.map((method, index) => {
    const channel = PAYMENT_CHANNELS[method];
    return {
      id: method,
      method: method,
      title: channel.label,
      logo: channel.icon,
      accountNumber: channel.accountNumber || null,
      accountName: channel.accountName || null,
      instructions: channel.instructionsUrdu.join('\n'),
      sortOrder: index,
      isActive: method !== 'USDT'
    };
  });
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  const url = new URL(req.url);
  const method = normalizeMethod(url.searchParams.get('method'));
  const channels = listChannels();

  const filtered = channels.filter((channel) => {
    if (method && channel.method !== method) return false;
    if (!admin && !channel.isActive) return false;
    return true;
  });

  return NextResponse.json({ channels: filtered });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const method = normalizeMethod(body?.method);
  if (!isPaymentMethodId(method)) {
    return NextResponse.json({ error: 'Invalid method.' }, { status: 400 });
  }

  return NextResponse.json(
    {
      error:
        'Channel editing is not enabled in this build. Update channels from lib/payment-channels.ts.',
      method
    },
    { status: 405 }
  );
}
