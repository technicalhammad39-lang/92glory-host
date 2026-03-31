import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-helpers';
import { db, isDatabaseReady } from '@/lib/db';
import { apiError } from '@/lib/api-error';
import { getSupportIssueLabel, isSupportIssueKey, SUPPORT_TICKET_STATUSES } from '@/lib/support-center';

function normalizeUrls(input: unknown) {
  if (!Array.isArray(input)) return [] as string[];
  return input
    .map((row) => String(row || '').trim())
    .filter((row) => row.startsWith('/uploads/'));
}

export async function GET(req: NextRequest) {
  try {
    if (!(await isDatabaseReady())) {
      return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 });
    }

    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const status = String(url.searchParams.get('status') || '').toUpperCase();
    const whereStatus = SUPPORT_TICKET_STATUSES.includes(status as (typeof SUPPORT_TICKET_STATUSES)[number])
      ? (status as (typeof SUPPORT_TICKET_STATUSES)[number])
      : undefined;

    const tickets = await db.supportTicket.findMany({
      where: {
        userId: user.id,
        ...(whereStatus ? { status: whereStatus } : {})
      },
      include: {
        attachments: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }]
    });

    return NextResponse.json({
      tickets: tickets.map((ticket) => ({
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
        attachments: ticket.attachments.map((row) => ({ id: row.id, url: row.url, createdAt: row.createdAt }))
      }))
    });
  } catch (error) {
    return apiError('support.tickets.get', error);
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isDatabaseReady())) {
      return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 });
    }

    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const category = String(body.category || '').trim().toUpperCase();
    const details = String(body.details || '').trim();
    const subject = String(body.subject || '').trim() || getSupportIssueLabel(category);
    const attachments = normalizeUrls(body.attachments);

    if (!isSupportIssueKey(category)) {
      return NextResponse.json({ error: 'Invalid support category.' }, { status: 400 });
    }

    if (!details || details.length < 3) {
      return NextResponse.json({ error: 'Details are required.' }, { status: 400 });
    }

    const ticket = await db.supportTicket.create({
      data: {
        userId: user.id,
        category,
        subject,
        details,
        attachments: {
          create: attachments.map((url) => ({ url }))
        }
      },
      include: {
        attachments: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    return NextResponse.json(
      {
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
          attachments: ticket.attachments.map((row) => ({ id: row.id, url: row.url, createdAt: row.createdAt }))
        }
      },
      { status: 201 }
    );
  } catch (error) {
    return apiError('support.tickets.post', error);
  }
}
