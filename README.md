# Akshat Verma — Portfolio

Editorial single-page portfolio. Deep navy ground, warm beige type, one gold
accent used sparingly.

**Live:** https://akshatve.github.io

---

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000

Requires **Node 18.18+** (built and verified on Node 24).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload on :3000 |
| `npm run build` | Production build |
| `npm start` | Serve the production build (run `build` first) |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript, no emit |

> If a build ever behaves oddly, delete the cache first: `rm -rf .next && npm run build`.

## Stack

| Library | Where it's used |
| --- | --- |
| Next.js 15 (App Router) + React 19 + TypeScript | Framework |
| Tailwind CSS | Styling; navy/beige tokens in `tailwind.config.ts` |
| Framer Motion | Section reveals, split-text, timeline draw, cursor springs, project panel |
| Lenis | Inertial smooth scrolling |
| Lucide | Icons, used sparingly |
| shadcn/ui | `Button` + `Badge` primitives, restyled |

No database, no API routes, no third-party services, no credentials.

## Project layout

```
src/
  app/            layout, page, robots.txt + sitemap.xml route handlers
  components/
    layout/       navbar, cursor, scroll progress, smooth scroll, footer, data field
    sections/     hero, about, experience, leadership, projects, skills,
                  certifications, contact
    shared/       split-text, magnetic, section-label, project visuals
    ui/           shadcn primitives
  data/resume.ts  ← ALL site content lives here
  hooks/          media query, active section, smooth scroll
  lib/            utils, site-url
public/           résumé PDF
prototypes/       standalone HTML demos, not part of the Next app
```

**To edit any content on the site, edit `src/data/resume.ts`.** Nothing is
hard-coded in components.

To replace the résumé, drop a new PDF at `public/Akshat_Verma_Resume.pdf`
(or change `profile.resumeUrl`).

## Environment variables

All optional — see `.env.example`. The site builds and runs with none set.

`NEXT_PUBLIC_SITE_URL` only affects `<meta>` / Open Graph URLs.
`robots.txt` and `sitemap.xml` read the origin from the request, so they are
correct on any host without configuration.

## Deploying

### GitHub Pages (current)

`main` holds the source; the built site lives on the `gh-pages` branch, which
is what Pages serves. To publish a change:

```bash
NEXT_PUBLIC_SITE_URL="https://akshatve.github.io" npm run build
npx gh-pages -d out --dotfiles          # --dotfiles keeps .nojekyll
```

`.nojekyll` is essential — without it Pages runs Jekyll, which strips the
`_next/` directory and takes all the CSS and JS with it.

To make this automatic on every push, grant the workflow scope once
(`gh auth refresh -s workflow`) and commit `.github/workflows/deploy.yml`.

### Other hosts

The app is a standard Next.js server build and runs anywhere Node runs.
It is **not** tied to Vercel — no Vercel-only APIs, middleware, image loader
or edge functions are used.

**Any Node host** (Render, Railway, Fly.io, a VPS, Docker):

```bash
npm ci
npm run build
npm start          # serves on $PORT, default 3000
```

**Netlify** — install `@netlify/plugin-nextjs`, build command `npm run build`,
publish directory `.next`.

**Cloudflare Pages** — use the Next.js preset; build `npm run build`.

**Vercel** — import the repo; it is auto-detected, no configuration needed.

After deploying, optionally set `NEXT_PUBLIC_SITE_URL` to your live domain
and redeploy so Open Graph URLs are absolute.

> Static export (`output: 'export'`) is **not** enabled, because `robots.txt`
> and `sitemap.xml` are request-rendered. Enabling it would need those two
> routes converted back to static files first.

## Accessibility

- Semantic landmarks, a single `<h1>`, ordered heading levels
- Skip-to-content link
- Full keyboard navigation with visible focus rings
- `prefers-reduced-motion` respected throughout
- Custom cursor only on fine pointers, never on touch

## Licence

Personal portfolio. Content and résumé © Akshat Verma.
