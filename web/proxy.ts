import { NextRequest, NextResponse } from 'next/server';

/**
 * Locale prefix proxy (replacing deprecated middleware convention).
 *
 * Detects URLs like /jp/test, /de/about, /kr/products and rewrites them
 * internally to /test?locale=jp, /about?locale=de etc. so the existing
 * [slug] route handles them. The browser URL stays unchanged.
 *
 * A locale prefix is defined as a 2-5 lowercase letter first path segment.
 * The homepage under a locale (e.g. /jp) rewrites to /?locale=jp.
 */

const LOCALE_PATTERN = /^[a-z]{2,5}$/;

// Segments that are NEVER locales (existing top-level routes / assets)
const RESERVED = new Set(['api', '_next', 'favicon.ico']);

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip reserved paths
  const firstSegment = pathname.split('/').filter(Boolean)[0];
  if (!firstSegment || RESERVED.has(firstSegment)) {
    return NextResponse.next();
  }

  // Check if first segment looks like a locale prefix
  if (!LOCALE_PATTERN.test(firstSegment)) {
    return NextResponse.next();
  }

  // It could be a page slug too (e.g. /about, /test). We only treat it as
  // a locale when there's a second segment OR the segment is clearly a
  // locale (2-3 chars). Single short segments like "jp", "de" will be
  // treated as locales; longer ones like "about", "test" won't.
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 1) {
    // Single segment: only treat 2-3 char segments as locale homepage
    if (firstSegment.length > 3) {
      return NextResponse.next();
    }
    // Rewrite /jp → /?locale=jp (locale homepage)
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.searchParams.set('locale', firstSegment);
    const res = NextResponse.rewrite(url);
    res.headers.set('x-locale', firstSegment);
    return res;
  }

  // Multi-segment: /jp/test → /test?locale=jp
  const restPath = '/' + segments.slice(1).join('/');
  const url = request.nextUrl.clone();
  url.pathname = restPath;
  url.searchParams.set('locale', firstSegment);
  const res = NextResponse.rewrite(url);
  res.headers.set('x-locale', firstSegment);
  return res;
}

export const config = {
  matcher: [
    // Match all paths except static files and API routes
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
