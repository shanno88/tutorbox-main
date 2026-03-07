import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createIntlMiddleware(routing);

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const protectedPaths = ['/todos'];
  const isProtectedPath = protectedPaths.some(path => 
    pathname === path || pathname.startsWith(`/en${path}`) || pathname.startsWith(`/zh${path}`)
  );

  if (isProtectedPath) {
    const token = request.cookies.get('next-auth.session-token') || 
                  request.cookies.get('__Secure-next-auth.session-token');
    
    if (!token) {
      // Redirect to login page for email magic link authentication (Google removed)
      const base =
        process.env.NEXTAUTH_URL ||
        `${request.nextUrl.protocol}//${request.nextUrl.host}`;
      
      try {
        const signInUrl = new URL('/login', base);
        signInUrl.searchParams.set('callbackUrl', request.url);
        return NextResponse.redirect(signInUrl);
      } catch {
        // If URL construction fails, fall back to intlMiddleware
        return intlMiddleware(request);
      }
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/', '/(zh|en)/:path*', '/todos']
};
