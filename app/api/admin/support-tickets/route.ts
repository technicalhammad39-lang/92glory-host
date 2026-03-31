import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-helpers';
import { db, isDatabaseReady } from '@/lib/db';
import { apiError } from '@/lib/api-error';
import { getSupportIssueLabel, SUPPORT_TICKET_STATUSES } from '@/lib/support-center';

export async function GET(req: NextRequest) {
  try {
    if (!(await isDatabaseReady())) {
      return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 });
    }

    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const status = String(url.searchParams.get('status') || '').toUpperCase();
    const q = String(url.searchParams.get('q') || '').trim();

    const whereStatus = SUPPORT_TICKET_STATUSES.includes(status as (typeof SUPPORT_TICKET_STATUSES)[number])
      ? (status as (typeof SUPPORT_TICKET_STATUSES)[number])
      : undefined;

    const tickets = await db.supportTicket.findMany({
      where: {
        ...(whereStatus ? { status: whereStatus } : {}),
        ...(q
          ? {
              OR: [
                { category: { contains: q } },
                { subject: { contains: q } },
                { details: { contains: q } },
                { user: { uid: { contains: q } } },
                { user: { phone: { contains: q } } },
                { user: { name: { contains: q } } }
              ]
            }
          : {})
      },
      include: {
        user: {
          select: { id: true, uid: true, name: true, phone: true, email: true }
        },
        attachments: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      take: 300
    });

    return NextResponse.json({
      tickets: tickets.map((ticket) => ({
        id: ticket.id,
        userId: ticket.userId,
        category: ticket.category,
        categoryLabel: getSupportIssueLabel(ticket.category),
        subject: ticket.subject,
        details: ticket.details,
        status: ticket.status,
        adminResponse: ticket.adminResponse,
        resolvedAt: ticket.resolvedAt,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
        user: ticket.user,
        attachments: ticket.attachments.map((row) => ({ id: row.id, url: row.url, createdAt: row.createdAt }))
      }))
    });
  } catch (error) {
    return apiError('admin.support-tickets.get', error);
  }
}
