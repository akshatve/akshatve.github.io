import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site-url';

// Static metadata route: emitted as a real robots.txt at build time, which is
// what GitHub Pages needs (it serves files, not a Node server).
export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
