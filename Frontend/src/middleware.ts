import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // We want to intercept requests to the Next.js API proxy routes that end with a trailing slash.
  // Next.js App Router natively returns 404 for POST requests containing a trailing slash.
  // By stripping the trailing slash internally (rewrite), we allow `app/api/[...path]/route.ts`
  // to seamlessly catch the request and manually append the trailing slash for Django backend.
  if (pathname.startsWith('/api/') && pathname !== '/api/' && pathname.endsWith('/')) {
    const newUrl = request.nextUrl.clone();
    newUrl.pathname = pathname.substring(0, pathname.length - 1);
    return NextResponse.rewrite(newUrl);
  }

  return NextResponse.next();
}

// Optionally, configure the middleware to only run on API paths to prevent performance overhead on static pages
export const config = {
  matcher: '/api/:path*',
};
