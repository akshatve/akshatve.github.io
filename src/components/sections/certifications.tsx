'use client';

import { motion } from 'framer-motion';
import { certifications } from '@/data/resume';
import { EASE_EDITORIAL } from '@/lib/utils';
import { SectionLabel } from '@/components/shared/section-label';

/**
 * Minimal vertical list — no cards. Each row reveals its issuer detail on
 * hover. The résumé provides no dates or credential IDs, so none are shown.
 */
export function Certifications() {
  return (
    <section id="certifications" className="relative scroll-mt-24 py-28 sm:py-36 lg:py-44">
      <div className="shell">
        <SectionLabel index="06" label="Certifications" />

        <ul className="mt-16 lg:mt-24">
          {certifications.map((cert, i) => (
            <motion.li
              key={cert.title}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-12%' }}
              transition={{ duration: 0.85, delay: i * 0.07, ease: EASE_EDITORIAL }}
              className="group relative border-t border-beige-200/12 last:border-b"
            >
              <div className="relative grid gap-4 py-9 sm:grid-cols-12 sm:items-baseline sm:gap-8 sm:py-11">
                <span className="font-mono text-[10px] text-beige-500 sm:col-span-1">
                  {String(i + 1).padStart(2, '0')}
                </span>

                <div className="sm:col-span-7">
                  <h3 className="font-serif text-[clamp(1.4rem,2.8vw,2.1rem)] leading-tight tracking-[-0.015em] text-beige-100 transition-transform duration-700 ease-editorial sm:group-hover:translate-x-2">
                    {cert.title}
                  </h3>

                  <p className="mt-2.5 text-[11px] uppercase tracking-metadata text-beige-400">
                    {cert.detail}
                  </p>

                  {/* All copy stays visible — hiding it behind hover left every
                      row but the hovered one looking empty. */}
                  <p className="mt-4 max-w-xl text-[14px] leading-[1.75] text-beige-300 text-pretty">
                    {cert.description}
                  </p>
                </div>

                <div className="flex items-center gap-4 sm:col-span-4 sm:justify-end">
                  <span
                    aria-hidden
                    className="hidden h-px w-8 bg-beige-200/20 transition-all duration-700 ease-editorial group-hover:w-14 group-hover:bg-gold sm:block"
                  />
                  <span className="text-[11px] uppercase tracking-metadata text-gold">
                    {cert.issuer}
                  </span>
                </div>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
