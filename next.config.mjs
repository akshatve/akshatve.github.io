/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static HTML export — GitHub Pages serves files, not a Node server.
  // `npm run build` now emits ./out instead of a server build.
  output: 'export',

  reactStrictMode: true,
  poweredByHeader: false,

  // No next/image is used, but this keeps the export safe if one is added:
  // the default loader needs a server, `unoptimized` does not.
  images: { unoptimized: true },

  // Emit /about/index.html style paths so deep links resolve on a static host.
  trailingSlash: true,

  experimental: {
    optimizePackageImports: ['framer-motion'],
  },
};

export default nextConfig;
