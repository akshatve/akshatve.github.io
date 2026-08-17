'use client';

import { motion } from 'framer-motion';
import { profile } from '@/data/resume';
import { useSmoothScrollTo } from '@/hooks/use-smooth-scroll-to';
import { EASE_EDITORIAL } from '@/lib/utils';

export function Footer() {
  const scrollTo = useSmoothScrollTo();
  const year = new Date().getFullYear();

  return (
    // z-[1] matches <main> so the fixed bubble layer (z-0) stays behind it.
    <footer className="relative z-[1]">
      {/* Rule draws itself as the footer arrives */}
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.4, ease: EASE_EDITORIAL }}
        className="h-px origin-left bg-beige-200/15"
      />

      <div className="shell flex flex-col gap-8 py-12 sm:flex-row sm:items-center sm:justify-between sm:py-14">
        <div>
          <p className="meta text-beige-300">{profile.name}</p>
          <p className="mt-2 text-[13px] text-beige-500">
            {profile.title} · {profile.location}
          </p>
        </div>

        <div className="flex items-center gap-8">
          <span className="font-mono text-[10px] tracking-wide2 text-beige-500">
            © {year}
          </span>
          <button
            type="button"
            onClick={() => scrollTo('hero', 0)}
            className="group flex items-center gap-3"
          >
            <span className="meta text-beige-300 transition-colors duration-500 group-hover:text-gold">
              Back to top
            </span>
            <span
              aria-hidden
              className="h-px w-6 bg-beige-200/25 transition-all duration-700 ease-editorial group-hover:w-10 group-hover:bg-gold"
            />
          </button>
        </div>
      </div>
    </footer>
  );
}
