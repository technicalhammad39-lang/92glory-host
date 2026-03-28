import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from '@/lib/admin-session';

export async function getAuthUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) return null;
  const payload = verifyToken(token) as { id?: string; role?: string } | null;
  if (!payload?.id) return null;
  const user = await db.user.findUnique({ where: { id: payload.id } });
  return user;
}

export async function requireAdmin(req: NextRequest) {
  const session = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const panelAdmin = verifyAdminSession(session);
  if (panelAdmin) {
    return { id: 'panel-admin', role: 'ADMIN', email: panelAdmin.email };
  }

  const user = await getAuthUser(req);
  if (!user || user.role !== 'ADMIN') return null;
  return user;
}
