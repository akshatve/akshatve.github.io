'use client';

import { motion, useMotionValue, useSpring, useScroll, useTransform } from 'framer-motion';
import { ArrowDown, Download, Mail } from 'lucide-react';
import { useRef } from 'react';
import { profile } from '@/data/resume';
import { usePointerFine } from '@/hooks/use-media-query';
import { useSmoothScrollTo } from '@/hooks/use-smooth-scroll-to';
import { EASE_EDITORIAL } from '@/lib/utils';
import { Magnetic } from '@/components/shared/magnetic';
import { Button } from '@/components/ui/button';
import { SplitText } from '@/components/shared/split-text';
import { HeroField } from '@/components/shared/hero-field';

/**
 * Staged opening. Timings are deliberately slow and sequential:
 * metadata (0.3s) → name (0.9s) → title (1.7s) → summary (2.1s) → cue (2.6s).
 * The navbar joins at 2.4s, set in navbar.tsx.
 */
export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const fine = usePointerFine();
  const scrollTo = useSmoothScrollTo();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  // Pointer parallax — tiny, just enough to feel responsive.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 60, damping: 20, mass: 0.6 });
  const sy = useSpring(py, { stiffness: 60, damping: 20, mass: 0.6 });

  return (
    <section
      ref={ref}
      id="hero"
      className="relative flex min-h-[100svh] items-center overflow-hidden"
      onPointerMove={
        fine
          ? (e) => {
              const r = e.currentTarget.getBoundingClientRect();
              px.set(((e.clientX - r.left) / r.width - 0.5) * 22);
              py.set(((e.clientY - r.top) / r.height - 0.5) * 14);
            }
          : undefined
      }
      onPointerLeave={
        fine
          ? () => {
              px.set(0);
              py.set(0);
            }
          : undefined
      }
    >
      <div className="blueprint" />
      <HeroField />

      <motion.div style={{ y, opacity }} className="shell relative z-10 w-full">
        <motion.div style={fine ? { x: sx, y: sy } : undefined} className="text-center">
          {/* 1 — metadata strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.3, ease: EASE_EDITORIAL }}
            className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1"
          >
            {profile.metadata.map((m, i) => (
              <span key={m} className="meta flex items-center gap-3">
                {i > 0 && <span aria-hidden className="text-beige-500">/</span>}
                {m}
              </span>
            ))}
          </motion.div>

          {/* 2 — name */}
          <SplitText
            as="h1"
            immediate
            text={profile.name}
            delay={0.9}
            stagger={0.09}
            className="mt-8 font-serif text-[clamp(3.2rem,12vw,10rem)] font-normal leading-[0.92] tracking-[-0.02em] text-beige-100"
          />

          {/* 3 — title */}
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 1.7, ease: EASE_EDITORIAL }}
            className="mt-6 text-[13px] uppercase tracking-metadata text-beige-300 sm:text-sm"
          >
            {profile.title}
          </motion.p>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.4, delay: 1.9, ease: EASE_EDITORIAL }}
            className="mx-auto mt-10 h-px w-full max-w-md origin-center bg-beige-200/20"
          />

          {/* 4 — introduction */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 2.1, ease: EASE_EDITORIAL }}
            className="mx-auto mt-8 max-w-xl text-[15px] leading-[1.75] text-beige-300 text-pretty sm:text-base"
          >
            {profile.summaryLead}
          </motion.p>

          {/* 5 — résumé download. Joins last, just before the navbar at 2.4s. */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 2.3, ease: EASE_EDITORIAL }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            {/* Email only here — the phone number lives in the Contact
                section. With one option left a dropdown would just add a click
                before the same mailto. */}
            <Magnetic strength={0.22}>
              <Button asChild variant="outline" size="md" className="group/ct">
                <a href={`mailto:${profile.email}`} aria-label={`Email ${profile.name}`}>
                  Get in touch
                  <Mail className="transition-transform duration-500 ease-editorial group-hover/ct:translate-x-0.5" />
                </a>
              </Button>
            </Magnetic>

            <Magnetic strength={0.22}>
              <Button asChild variant="outline" size="md" className="group/cv">
                {/* Explicit filename: Safari is unreliable about deriving one
                    from the URL and will otherwise open the PDF inline. */}
                <a
                  href={profile.resumeUrl}
                  download="Akshat_Verma_Resume.pdf"
                  aria-label="Download résumé (PDF)"
                >
                  Download résumé
                  <Download className="transition-transform duration-500 ease-editorial group-hover/cv:translate-y-0.5" />
                </a>
              </Button>
            </Magnetic>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Scroll cue */}
      <motion.button
        type="button"
        onClick={() => scrollTo('about', -70)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 2.6 }}
        style={{ opacity }}
        className="group absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-3 sm:flex"
        aria-label="Scroll to About"
      >
        <span className="meta flex items-center gap-2 transition-colors duration-500 group-hover:text-beige-200">
          <ArrowDown aria-hidden className="size-3" />
          Scroll
        </span>
        <span className="relative block h-10 w-px overflow-hidden bg-beige-200/20">
          <motion.span
            className="absolute inset-x-0 top-0 block h-4 bg-beige-200/80"
            animate={{ y: [-16, 40] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </span>
      </motion.button>
    </section>
  );
}
