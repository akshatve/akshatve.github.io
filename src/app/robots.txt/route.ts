import { headers } from 'next/headers';
import { getRequestOrigin } from '@/lib/site-url';

/**
 * Route handler rather than Next's `robots.ts` metadata export.
 *
 * The metadata version is statically prerendered, so it bakes in whatever
 * origin was known at BUILD time — which on Vercel is unreliable (the
 * production URL is not always injected, and cached builds keep stale
 * values). Deriving the origin from the request headers is correct on every
 * host — preview URLs, production, and a custom domain later — with no
 * environment configuration at all.
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  const origin = getRequestOrigin(await headers());

  const body = ['User-Agent: *', 'Allow: /', '', `Sitemap: ${origin}/sitemap.xml`].join('\n');

  return new Response(body, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=3600',
    },
  });
}
