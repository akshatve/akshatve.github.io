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
              <div className="relative flex flex-col gap-3 py-8 sm:flex-row sm:items-center sm:gap-10 sm:py-10">
                <span className="font-mono text-[10px] text-beige-500 sm:w-10">
                  {String(i + 1).padStart(2, '0')}
                </span>

                <h3 className="font-serif text-[clamp(1.4rem,2.8vw,2.1rem)] leading-tight tracking-[-0.015em] text-beige-100 transition-transform duration-700 ease-editorial sm:flex-1 sm:group-hover:translate-x-2">
                  {cert.title}
                </h3>

                <div className="flex items-center gap-4 sm:justify-end">
                  {/* Detail wipes in on hover; always visible on touch */}
                  <span className="text-[13px] text-beige-400 opacity-100 transition-opacity duration-700 ease-editorial sm:opacity-0 sm:group-hover:opacity-100">
                    {cert.detail}
                  </span>
                  <span aria-hidden className="hidden h-px w-8 bg-beige-200/20 sm:block" />
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
