import { signToken, verifyToken } from '@/lib/auth';

export const ADMIN_SESSION_COOKIE = 'admin_session';

export function getAdminEmail() {
  return process.env.ADMIN_PANEL_EMAIL || 'admin@clyrotech.com';
}

export function getAdminPassword() {
  return process.env.ADMIN_PANEL_PASSWORD || 'admin@786';
}

export function signAdminSession(email: string) {
  return signToken({
    scope: 'ADMIN_PANEL',
    role: 'ADMIN',
    email
  });
}

export function verifyAdminSession(token: string | undefined | null) {
  if (!token) return null;
  const payload = verifyToken(token) as { scope?: string; role?: string; email?: string } | null;
  if (!payload) return null;
  if (payload.scope !== 'ADMIN_PANEL' || payload.role !== 'ADMIN') return null;
  if (payload.email?.toLowerCase() !== getAdminEmail().toLowerCase()) return null;
  return payload;
}

