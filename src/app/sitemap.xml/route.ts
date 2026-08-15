import { headers } from 'next/headers';
import { getRequestOrigin } from '@/lib/site-url';

/** See robots.txt/route.ts — origin comes from the request, not the build. */
export const dynamic = 'force-dynamic';

export async function GET() {
  const origin = getRequestOrigin(await headers());

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${origin}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

  return new Response(body, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=3600',
    },
  });
}
