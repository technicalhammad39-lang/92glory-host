import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-helpers';
import { db, isDatabaseReady } from '@/lib/db';
import { apiError } from '@/lib/api-error';
import { SUPPORT_TICKET_STATUSES } from '@/lib/support-center';

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isDatabaseReady())) {
      return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 });
    }

    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));

    const status = String(body.status || '').toUpperCase();
    const adminResponse = String(body.adminResponse || '').trim();

    if (!SUPPORT_TICKET_STATUSES.includes(status as (typeof SUPPORT_TICKET_STATUSES)[number])) {
      return NextResponse.json({ error: 'Invalid ticket status.' }, { status: 400 });
    }
    const nextStatus = status as (typeof SUPPORT_TICKET_STATUSES)[number];

    const ticket = await db.supportTicket.update({
      where: { id },
      data: {
        status: nextStatus,
        adminResponse: adminResponse || null,
        resolvedAt: nextStatus === 'RESOLVED' || nextStatus === 'REJECTED' ? new Date() : null
      },
      include: {
        attachments: {
          orderBy: { createdAt: 'asc' }
        },
        user: {
          select: { id: true, uid: true, name: true, phone: true, email: true }
        }
      }
    });

    return NextResponse.json({ ticket });
  } catch (error) {
    return apiError('admin.support-tickets.id.put', error);
  }
}
