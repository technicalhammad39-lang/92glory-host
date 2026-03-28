import { NextRequest, NextResponse } from 'next/server';

const ADMIN_SESSION_COOKIE = 'admin_session';

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  if (pathname.startsWith('/admincts')) {
    const hasAdminSession = Boolean(req.cookies.get(ADMIN_SESSION_COOKIE)?.value);
    const isLoginRoute = pathname === '/admincts/login';

    if (!hasAdminSession && !isLoginRoute) {
      return NextResponse.redirect(new URL('/admincts/login', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/admincts/:path*']
};

