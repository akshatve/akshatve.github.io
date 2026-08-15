# Akshat Verma — Portfolio

Editorial single-page portfolio. Navy `#07111F` ground, warm beige `#E8DEC8` ink,
gold `#D8C08A` accent used sparingly.

All professional content lives in **`src/data/resume.ts`** and is taken verbatim
from the résumé. Nothing on this site is invented — no fabricated metrics,
dates, employers, links, or outcomes. Edit that one file to update the site.

## Run locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000

## Stack

| Library | Where it's used |
| --- | --- |
| Next.js 15 (App Router) + React 19 + TypeScript | Framework |
| Tailwind CSS | Styling, custom navy/beige tokens in `tailwind.config.ts` |
| Framer Motion | Section reveals, split-text, timeline draw, cursor springs |
| GSAP ScrollTrigger | Horizontal project rail scrub (desktop) |
| Lenis | Inertial smooth scrolling |
| Embla Carousel | Draggable project carousel (tablet) |
| Lucide | Icons — used sparingly (5 total) |
| shadcn/ui | `Button` + `Badge` primitives, restyled for the editorial system |

## Projects section — three modes

- **Desktop (≥1024px):** CSS `position: sticky` pins the rail; GSAP ScrollTrigger
  scrubs it horizontally. The pin is CSS-only *by design* — if GSAP fails to
  load or its ticker is throttled, the layout still holds and the cards simply
  don't slide.
- **Tablet (640–1023px):** Embla drag carousel.
- **Mobile / reduced motion:** plain vertical stack.

## Deploy

The site is fully static. Any host works; Vercel is the least friction:

```bash
npx vercel --prod
```

First run will prompt you to log in and link the project. After the first
deploy, set the real domain so `sitemap.xml` and `robots.txt` are correct:

```bash
npx vercel env add NEXT_PUBLIC_SITE_URL production
```

Enter your live URL (e.g. `https://akshatverma.com`), then redeploy.

Nothing else is environment-dependent — no API keys, no database.

## Accessibility

- Semantic landmarks, single `<h1>`, ordered heading levels
- Skip-to-content link
- Full keyboard navigation; visible focus rings
- Project modal: labelled dialog, focus trap, Escape to close, focus restored
- `prefers-reduced-motion` respected throughout (Lenis bypassed, grain frozen,
  projects fall back to the vertical stack)
- Custom cursor only on fine pointers, never on touch
