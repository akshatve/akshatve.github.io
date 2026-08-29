/**
 * Absolute site origin.
 *
 * Two flavours, because they solve different problems:
 *
 * - `getRequestOrigin` reads the incoming request headers, so it is always
 *   correct on whatever host is actually serving — a preview URL, production,
 *   or a custom domain — with zero configuration. Used by robots.txt and
 *   sitemap.xml, which is why those routes are portable to any host.
 *
 * - `getSiteUrl` is the build-time fallback used for `metadataBase`, where no
 *   request exists. It prefers an explicit value, then falls back to the host
 *   variables the common platforms inject automatically.
 */

export function getRequestOrigin(h: Headers): string {
  // x-forwarded-* are set by most reverse proxies (Vercel, Netlify, Cloudflare,
  // nginx); `host` is the direct fallback.
  const host = h.get('x-forwarded-host') ?? h.get('host');
  if (!host) return getSiteUrl();

  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

export function getSiteUrl(): string {
  // Set this in your host's environment settings once a domain is attached.
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, '');

  // Platform-injected hostnames, in order of specificity. All optional — the
  // site runs fine on a host that provides none of them.
  const bare =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ?? // Vercel, stable production domain
    process.env.VERCEL_URL ?? // Vercel, per-deployment
    process.env.RENDER_EXTERNAL_HOSTNAME; // Render
  if (bare) return `https://${bare}`;

  // Providers that already include the scheme.
  const withScheme =
    process.env.URL ?? // Netlify
    process.env.CF_PAGES_URL; // Cloudflare Pages
  if (withScheme) return withScheme.replace(/\/$/, '');

  return 'http://localhost:3000';
}
