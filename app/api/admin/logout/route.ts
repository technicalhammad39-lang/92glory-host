import { NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE } from '@/lib/admin-session';
import { apiError } from '@/lib/api-error';

export async function POST() {
  try {
    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: ADMIN_SESSION_COOKIE,
      value: '',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0,
      path: '/'
    });
    return response;
  } catch (error) {
    return apiError('admin.logout.post', error);
  }
}
