/**
 * Absolute site origin, for metadata / sitemap / robots.
 *
 * Resolution order:
 *  1. NEXT_PUBLIC_SITE_URL — set this once a custom domain is attached.
 *  2. VERCEL_PROJECT_PRODUCTION_URL — the stable production domain, injected
 *     by Vercel for account-linked projects.
 *  3. VERCEL_URL — the per-deployment domain. Always present on Vercel,
 *     including anonymous/preview deployments, so this is the safety net that
 *     stops localhost leaking into robots.txt and sitemap.xml.
 *  4. localhost — local development only.
 *
 * All of these are read at BUILD time, because robots/sitemap are statically
 * prerendered. Setting them only at runtime has no effect.
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, '');

  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (production) return `https://${production}`;

  const deployment = process.env.VERCEL_URL;
  if (deployment) return `https://${deployment}`;

  return 'http://localhost:3000';
}
