/**
 * Absolute site origin.
 *
 * Two flavours, because they solve different problems:
 *
 * - `getRequestOrigin` reads the incoming request headers. Always correct on
 *   whatever host is actually serving — preview URL, production, or a custom
 *   domain — with zero configuration. Used by robots.txt and sitemap.xml.
 *
 * - `getSiteUrl` is the build-time fallback, used for `metadataBase` where no
 *   request exists. Prefers an explicit value, then Vercel's injected vars.
 */

export function getRequestOrigin(h: Headers): string {
  // x-forwarded-* are set by Vercel's proxy; host is the direct fallback.
  const host = h.get('x-forwarded-host') ?? h.get('host');
  if (!host) return getSiteUrl();

  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, '');

  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (production) return `https://${production}`;

  const deployment = process.env.VERCEL_URL;
  if (deployment) return `https://${deployment}`;

  return 'http://localhost:3000';
}
