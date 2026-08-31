# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two audiences read the same single page, with different depths:

- **Recruiters and hiring managers** screening for Data Science internships and
  new-grad roles. They skim, often on mobile, often for well under a minute,
  and frequently want an artifact to keep — the résumé PDF.
- **Graduate admissions readers** assessing technical depth and research
  capability. They read further, and care about method and rigour rather than
  a headline.

Both arrive from a link (application form, LinkedIn, email signature, referral)
rather than search, so the first viewport carries the whole first impression.

## Product Purpose

A personal portfolio for Akshat Verma, Data Science undergraduate at UC Davis
(B.S., 2023–2027). It presents his work experience, leadership roles, projects,
certifications and skills as one scrolling page.

Success is a reader finishing with enough confidence to act — download the
résumé, send an email, or advance an application.

## Positioning

The substance is the real work and the discipline in how it is reported:
adversarial-robustness testing for NLP credibility classification, predictive
logistics analytics, OLS financial modelling, and two elected leadership roles —
described only to the extent that the source material supports.

The site deliberately shows the *kind* of analysis rather than asserting results
that were never measured. Project visuals are decorative and unlabelled where no
figures exist.

## Operating Context

- One page, seven sections: About, Experience, Leadership, Projects, Skills,
  Certifications, Contact.
- Read on desktop and mobile. Projects present differently by breakpoint —
  a hover showcase on desktop, a stacked list below `lg`.
- The résumé PDF is a primary exit action, not a footnote.
- Contact is direct: `mailto:` on the front page, with phone and location in the
  Contact section. No form, no backend.

## Capabilities and Constraints

- **Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS,
  Framer Motion, Lenis (smooth scroll), Lucide icons, shadcn/ui primitives
  (`Button`, `Badge`). Project visuals are hand-written Canvas and SVG.
- **Content lives in `src/data/resume.ts`.** Components never hard-code copy.
  This is a binding constraint, not a convention.
- **Résumé PDF at `public/Akshat_Verma_Resume.pdf`** must stay downloadable from
  the hero. Path is referenced once, via `profile.resumeUrl`.
- No database, no API routes, no third-party services, no credentials. All
  environment variables are optional (see `.env.example`).
- `robots.txt` and `sitemap.xml` are request-rendered route handlers that derive
  their origin from request headers. This makes the site host-portable but rules
  out `output: 'export'` unless those two routes are converted back to static.
- Repository: `github.com/akshatve/akshat-portfolio` (private). Currently served
  from Vercel; the free trial has ended, so a host change is possible.

## Brand Commitments

- Name **Akshat Verma**; title **Data Science Undergraduate**.
- Contact facts: `akshat.verma3005@gmail.com`, `+1 (530) 564-9941`, Davis, CA.
- The résumé PDF is a committed artifact.

## Evidence on Hand

**Available:**
- Résumé PDF — `public/Akshat_Verma_Resume.pdf` (the source of record).
- Descriptions supplied directly by Akshat for the Fake News Classifier,
  Applied Financial Analytics, both leadership roles, all four certifications,
  the About copy, and the Wealth Clinic bullets. These are marked inline in
  `src/data/resume.ts` where they extend the PDF.

**Absent — future work must not fabricate any of these:**
- No GitHub or live-demo links for any project.
- No social or profile links anywhere on the site.
- No project outcome metrics beyond those the source states
  (99% test accuracy, ~44K corpus, 40K dataset, 2.4+ GB SQLite, 15–20 years of
  financial data). No R², t-statistic, or p-value figures exist.
- No testimonials, references, endorsements, GPA, coursework, honours, awards,
  certificate dates or credential IDs.
- No custom domain yet; `NEXT_PUBLIC_SITE_URL` is unset.

## Product Principles

1. **Nothing is invented.** Every claim traces to the résumé or to text Akshat
   supplied. Where the source is silent, the site stays silent — including in
   decorative visuals, which show method rather than fabricated results.
2. **One source of truth for content.** All copy flows from
   `src/data/resume.ts`; a content change is a data edit, never a component edit.
3. **Two reading depths, one page.** A skim must land the essentials in the
   first viewport; a close read must reward going further.
4. **The résumé is always one click away.**
5. **Portable by default.** No dependency on a single host's proprietary
   features, so the site can move providers without a rewrite.

## Accessibility & Inclusion

**Target: WCAG 2.2 AA**, treated as a requirement rather than an aspiration.
Contrast ratios, focus order, and target sizes are subject to audit.

Already in place: semantic landmarks, a single `<h1>` with ordered heading
levels, a skip-to-content link, full keyboard navigation with visible focus
rings, `prefers-reduced-motion` honoured throughout, and the custom cursor
disabled on coarse pointers.

Not yet formally verified against AA — no contrast or target-size audit has been
run. The low-contrast beige-on-navy metadata text is the most likely gap.
