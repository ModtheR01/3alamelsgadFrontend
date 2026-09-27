import { NextRequest, NextResponse } from 'next/server';

// Same-origin proxy to the real Django backend so auth cookies stay
// first-party in the browser (fixes the checkout->login loop caused by
// cross-site cookies being dropped by browsers/in-app webviews, e.g.
// Facebook/Instagram in-app browsers and Safari ITP).
// A Route Handler is used instead of next.config.ts rewrites because
// rewrites forward the original "Host" header unchanged, which can make
// the backend host's edge/proxy issue a same-URL redirect loop instead of
// reaching the app - a manual fetch() here derives the outgoing request's
// Host correctly from the destination URL. This catch-all only matches
// paths not already handled by a more specific route file (e.g.
// /api/cloudinary/upload, /api/cloudinary/sign).
// Strip a trailing slash and/or an accidentally-included "/api" suffix so
// this still works whether the env var is set to the bare backend origin
// (correct) or the origin already ending in "/api" (a common misconfiguration
// that previously caused every proxied request to 404 with a doubled
// "/api/api/..." path).
const API_PROXY_TARGET = process.env.API_PROXY_TARGET?.replace(/\/+$/, '').replace(/\/api$/, '');

async function proxy(request: NextRequest) {
  if (!API_PROXY_TARGET) {
    return NextResponse.json({ detail: 'API_PROXY_TARGET is not configured' }, { status: 500 });
  }

  const forwardedPath = request.nextUrl.pathname.replace(/^\/api/, '');
  const destination = `${API_PROXY_TARGET}/api${forwardedPath}${request.nextUrl.search}`;

  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  if (contentType) headers.set('content-type', contentType);
  const cookie = request.headers.get('cookie');
  if (cookie) headers.set('cookie', cookie);
  const csrfToken = request.headers.get('x-csrftoken');
  if (csrfToken) headers.set('x-csrftoken', csrfToken);
  const origin = request.headers.get('origin');
  if (origin) headers.set('origin', origin);
  const referer = request.headers.get('referer');
  if (referer) headers.set('referer', referer);
  const accept = request.headers.get('accept');
  if (accept) headers.set('accept', accept);

  const hasBody = !['GET', 'HEAD'].includes(request.method);

  const upstreamResponse = await fetch(destination, {
    method: request.method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
    redirect: 'manual',
    cache: 'no-store',
  });

  const responseHeaders = new Headers();
  const upstreamContentType = upstreamResponse.headers.get('content-type');
  if (upstreamContentType) responseHeaders.set('content-type', upstreamContentType);
  const location = upstreamResponse.headers.get('location');
  if (location) responseHeaders.set('location', location);

  // fetch()'s Headers.get("set-cookie") merges multiple cookies into one
  // string - getSetCookie() (Node 18.14+/undici) keeps them separate so
  // e.g. both access_token and refresh_token survive the proxy hop intact.
  const setCookieValues = typeof upstreamResponse.headers.getSetCookie === 'function'
    ? upstreamResponse.headers.getSetCookie()
    : upstreamResponse.headers.get('set-cookie')
      ? [upstreamResponse.headers.get('set-cookie') as string]
      : [];

  for (const cookieValue of setCookieValues) {
    responseHeaders.append('set-cookie', cookieValue);
  }

  const body = await upstreamResponse.arrayBuffer();

  return new NextResponse(body, {
    status: upstreamResponse.status,
    headers: responseHeaders,
  });
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE };
