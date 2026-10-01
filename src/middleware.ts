import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSessionToken, ADMIN_COOKIE_NAME } from './lib/auth';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Always allow Next.js internal files, static assets, and favicon
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname === '/favicon.ico' ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 2. Always allow Public Share endpoints & pages (Public share will remain open as requested)
  if (
    pathname.startsWith('/share/') ||
    pathname.startsWith('/api/shares/')
  ) {
    return NextResponse.next();
  }

  // 3. Always allow GoHighLevel live Webhook listeners
  if (pathname.startsWith('/api/webhooks/')) {
    return NextResponse.next();
  }

  // 4. Always allow authentication endpoints (login, logout)
  if (pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }

  // 5. Check admin session cookie
  const sessionCookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const isAuthenticated = await verifyAdminSessionToken(sessionCookie);

  // If visiting the /login page
  if (pathname === '/login') {
    if (isAuthenticated) {
      // Already logged in, redirect to home
      return NextResponse.redirect(new URL('/', req.url));
    }
    return NextResponse.next();
  }

  // 6. For all other routes (dashboard root '/', sub-account settings, admin APIs)
  if (!isAuthenticated) {
    // If it's an API request, return 401 Unauthorized JSON
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Admin authentication required.' },
        { status: 401 }
      );
    }

    // For page requests, redirect to /login preserving the return URL
    const loginUrl = new URL('/login', req.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('from', pathname + req.nextUrl.search);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
