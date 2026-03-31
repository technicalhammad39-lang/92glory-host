import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireAdmin } from '@/lib/api-helpers';
import { db, isDatabaseReady } from '@/lib/db';
import { apiError } from '@/lib/api-error';
import { getSupportIssueLabel } from '@/lib/support-center';

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isDatabaseReady())) {
      return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 });
    }

    const [user, admin] = await Promise.all([getAuthUser(req), requireAdmin(req)]);
    if (!user && !admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await context.params;
    const ticket = await db.supportTicket.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, uid: true, name: true, phone: true, email: true }
        },
        attachments: { orderBy: { createdAt: 'asc' } }
      }
    });

    if (!ticket) return NextResponse.json({ error: 'Ticket not found.' }, { status: 404 });

    if (!admin && ticket.userId !== user!.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      ticket: {
        id: ticket.id,
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
      }
    });
  } catch (error) {
    return apiError('support.tickets.id.get', error);
  }
}
