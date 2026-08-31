/**
 * Absolute site origin, used for `metadataBase`, robots.txt and sitemap.xml.
 *
 * The site is statically exported for GitHub Pages, so there is no request to
 * read a host from — the origin has to be known at BUILD time. Set
 * NEXT_PUBLIC_SITE_URL in CI (see .github/workflows/deploy.yml) or in
 * .env.local for a local build.
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, '');

  // Host names injected automatically by common platforms, kept so the project
  // still resolves correctly if it is ever deployed somewhere other than Pages.
  const bare =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_URL ??
    process.env.RENDER_EXTERNAL_HOSTNAME;
  if (bare) return `https://${bare}`;

  const withScheme = process.env.URL ?? process.env.CF_PAGES_URL;
  if (withScheme) return withScheme.replace(/\/$/, '');

  return 'http://localhost:3000';
}
