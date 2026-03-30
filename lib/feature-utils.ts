import { db } from '@/lib/db';
import { TX_OPTIONS } from '@/lib/tx-options';

export function toMoney(value: number) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

export function dayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function weekKey(date = new Date()) {
  const current = new Date(date);
  const day = current.getDay();
  const diff = current.getDate() - day;
  const weekStart = new Date(current.getFullYear(), current.getMonth(), diff);
  return dayKey(weekStart);
}

export function parseMeta<T = Record<string, unknown>>(raw: string | null | undefined): T {
  if (!raw) return {} as T;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return parsed as T;
  } catch {
    // ignored
  }
  return {} as T;
}

export function startOfDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function endOfDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
}

export function startOfWeek(date = new Date()) {
  const day = date.getDay();
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - day);
}

export function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export async function recordLoginActivity(userId: string, at = new Date()) {
  const currentKey = dayKey(at);
  const prevDay = new Date(at.getFullYear(), at.getMonth(), at.getDate() - 1);
  const prevKey = dayKey(prevDay);

  await db.$transaction(async (tx) => {
    await tx.notification.create({
      data: {
        userId,
        type: 'LOGIN',
        title: 'LOGIN NOTIFICATION',
        content: `Your account is logged in ${currentKey} ${String(at.toTimeString()).split(' ')[0]}`
      }
    });

    const existing = await tx.attendanceRecord.findUnique({
      where: { userId_dayKey: { userId, dayKey: currentKey } }
    });
    if (existing) return;

    const yesterday = await tx.attendanceRecord.findUnique({
      where: { userId_dayKey: { userId, dayKey: prevKey } }
    });

    const consecutiveDays = yesterday ? Math.min(7, yesterday.consecutiveDays + 1) : 1;
    await tx.attendanceRecord.create({
      data: {
        userId,
        dayKey: currentKey,
        consecutiveDays
      }
    });
  }, TX_OPTIONS);
}
