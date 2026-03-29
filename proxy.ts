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

  const response = NextResponse.next();

  const isApi = pathname.startsWith('/api/');
  const isNextAsset = pathname.startsWith('/_next/');
  const isStaticFile = /\.[a-zA-Z0-9]+$/.test(pathname);

  if (!isApi && !isNextAsset && !isStaticFile) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/admincts/:path*']
};

