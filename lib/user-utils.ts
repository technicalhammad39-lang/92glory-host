import { db } from '@/lib/db';

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isValidPhone(value: string) {
  return /^[0-9]{7,15}$/.test(value);
}

export function normalizeIdentifier(raw?: string) {
  return String(raw || '').trim();
}

export function defaultMemberName(uid: string) {
  return `MEMBER${uid.slice(-4)}`;
}

export async function generateUniqueUid() {
  for (let i = 0; i < 10; i += 1) {
    const uid = String(Math.floor(1000000000 + Math.random() * 9000000000));
    const exists = await db.user.findFirst({ where: { uid }, select: { id: true } });
    if (!exists) return uid;
  }
  return `${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(0, 10);
}
