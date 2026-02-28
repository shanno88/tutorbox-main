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
      const signInUrl = new URL('/api/auth/signin/google', request.url);
      signInUrl.searchParams.set('callbackUrl', request.url);
      return NextResponse.redirect(signInUrl);
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/', '/(zh|en)/:path*', '/todos']
};
