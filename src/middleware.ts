import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const PUBLIC_PATHS = new Set(['/sign-in', '/sign-up', '/api/health']);
const PUBLIC_PREFIXES = [
  '/_next',
  '/api/auth',
  '/favicon.ico',
  // App icons (src/app/icon.svg, apple-icon.tsx) must load on the sign-in page too.
  '/icon',
  '/apple-icon',
  '/robots.txt',
  '/sitemap.xml',
];

const SESSION_COOKIE = 'authjs.session-token';
const SECURE_SESSION_COOKIE = `__Secure-${SESSION_COOKIE}`;

function getSessionCookieName(request: NextRequest) {
  const hasSecureSessionCookie = request.cookies
    .getAll()
    .some(
      ({ name }) => name === SECURE_SESSION_COOKIE || name.startsWith(`${SECURE_SESSION_COOKIE}.`),
    );

  return hasSecureSessionCookie ? SECURE_SESSION_COOKIE : SESSION_COOKIE;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicPath =
    PUBLIC_PATHS.has(pathname) || PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isPublicPath) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    // Auth.js prefixes production cookies with `__Secure-` and uses that full
    // cookie name as the JWT salt. getToken() otherwise defaults to the
    // unprefixed development cookie and silently returns null on Vercel.
    cookieName: getSessionCookieName(request),
  });

  if (!token) {
    const signInUrl = new URL('/sign-in', request.nextUrl.origin);
    signInUrl.searchParams.set(
      'callbackUrl',
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
