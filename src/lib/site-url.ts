/**
 * Absolute site origin, for metadata / sitemap / robots.
 *
 * Resolution order:
 *  1. NEXT_PUBLIC_SITE_URL — set this once a custom domain is attached.
 *  2. VERCEL_PROJECT_PRODUCTION_URL — injected by Vercel automatically, so
 *     production is correct with zero configuration.
 *  3. localhost — local development only.
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, '');

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;

  return 'http://localhost:3000';
}
