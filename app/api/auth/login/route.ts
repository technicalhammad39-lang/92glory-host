import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';
import { ensureSeeded } from '@/lib/seed';
import { normalizeIdentifier } from '@/lib/user-utils';
import { apiError } from '@/lib/api-error';

export async function POST(req: NextRequest) {
  try {
    await ensureSeeded();
    const body = await req.json();
    const { phone, email, identifier, password } = body;
    const loginIdentifier = normalizeIdentifier(identifier || email || phone).toLowerCase();

    if (!loginIdentifier || !password) {
      return NextResponse.json({ error: 'Phone/email and password are required.' }, { status: 400 });
    }

    const user = await db.user.findFirst({
      where: {
        OR: [{ phone: loginIdentifier }, { email: loginIdentifier }]
      }
    });
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

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
    return apiError('auth.login', error);
  }
}
