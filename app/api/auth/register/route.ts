import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { signToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { ensureSeededSafe } from '@/lib/seed';
import { defaultMemberName, generateUniqueUid, isValidEmail, isValidPhone, normalizeIdentifier } from '@/lib/user-utils';

function generateInviteCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function POST(req: NextRequest) {
  try {
    await ensureSeededSafe();
    const body = await req.json().catch(() => ({}));
    const { phone, email, password, inviteCode } = body;
    const rawPhone = normalizeIdentifier(phone);
    const rawEmail = normalizeIdentifier(email).toLowerCase();

    if ((!rawPhone && !rawEmail) || !password) {
      return NextResponse.json({ error: 'Phone/email and password are required.' }, { status: 400 });
    }

    if (rawPhone && !isValidPhone(rawPhone)) {
      return NextResponse.json({ error: 'Invalid phone format.' }, { status: 400 });
    }

    if (rawEmail && !isValidEmail(rawEmail)) {
      return NextResponse.json({ error: 'Invalid email format.' }, { status: 400 });
    }

    if (rawPhone) {
      const existingPhone = await db.user.findUnique({ where: { phone: rawPhone } });
      if (existingPhone) {
        return NextResponse.json({ error: 'Phone already registered.' }, { status: 400 });
      }
    }

    if (rawEmail) {
      const existingEmail = await db.user.findUnique({ where: { email: rawEmail } });
      if (existingEmail) {
        return NextResponse.json({ error: 'Email already registered.' }, { status: 400 });
      }
    }

    const hashed = await bcrypt.hash(password, 10);
    const code = generateInviteCode();
    const uid = await generateUniqueUid();
    const name = defaultMemberName(uid);

    const upline = inviteCode
      ? await db.user.findUnique({ where: { inviteCode: String(inviteCode).toUpperCase() } })
      : null;

    const user = await db.user.create({
      data: {
        phone: rawPhone || null,
        email: rawEmail || null,
        uid,
        name,
        password: hashed,
        inviteCode: code,
        uplineId: upline?.id,
        balance: 0,
        vipLevel: 1,
        exp: 0
      }
    });

    const token = signToken({ id: user.id, role: user.role });
    return NextResponse.json({
      token,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        uid: user.uid,
        name: user.name,
        balance: user.balance,
        vipLevel: user.vipLevel,
        role: user.role,
        inviteCode: user.inviteCode
      }
    });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('/api/auth/register failed:', error);
    }
    return NextResponse.json({ error: 'Service temporarily unavailable. Please try again.' }, { status: 503 });
  }
}
