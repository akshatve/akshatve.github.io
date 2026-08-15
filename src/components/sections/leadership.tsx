'use client';

import { motion } from 'framer-motion';
import { leadership } from '@/data/resume';
import { EASE_EDITORIAL } from '@/lib/utils';
import { SectionLabel } from '@/components/shared/section-label';

/**
 * Two-column editorial spread. Distinct from the Experience timeline — the
 * organisation is set large on the left, the role and detail on the right —
 * but built from the same rules, type scale and hairline dividers.
 */
export function Leadership() {
  return (
    <section id="leadership" className="relative scroll-mt-24 py-28 sm:py-36 lg:py-44">
      <div className="shell">
        <SectionLabel index="03" label="Leadership" />

        <div className="mt-16 flex flex-col lg:mt-24">
          {leadership.map((item, i) => (
            <motion.article
              key={item.organization}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-18%' }}
              transition={{ staggerChildren: 0.1 }}
              className="group relative border-t border-beige-200/12 py-12 last:border-b sm:py-16"
            >
              {/* Hover wash — depth without a card */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 inset-y-0 -z-10 bg-gradient-to-r from-beige-200/[0.035] to-transparent opacity-0 transition-opacity duration-700 ease-editorial group-hover:opacity-100"
              />

              <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
                <div className="lg:col-span-1">
                  <motion.span
                    variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
                    transition={{ duration: 0.7 }}
                    className="font-mono text-[10px] text-beige-500"
                  >
                    {String(i + 1).padStart(2, '0')}
                  </motion.span>
                </div>

                <div className="lg:col-span-6">
                  <motion.h3
                    variants={{
                      hidden: { opacity: 0, y: 22 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    transition={{ duration: 0.95, ease: EASE_EDITORIAL }}
                    className="font-serif text-[clamp(1.7rem,3.4vw,2.7rem)] leading-[1.12] tracking-[-0.015em] text-beige-100"
                  >
                    {item.organization}
                  </motion.h3>

                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 14 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    transition={{ duration: 0.8, ease: EASE_EDITORIAL }}
                    className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2"
                  >
                    <span className="text-[11px] uppercase tracking-metadata text-gold">
                      {item.position}
                    </span>
                    <span aria-hidden className="h-px w-8 bg-beige-200/20" />
                    <span className="font-mono text-[11px] tracking-wide2 text-beige-400">
                      {item.period}
                    </span>
                  </motion.div>
                </div>

                <div className="lg:col-span-5">
                  <motion.ul
                    variants={{
                      hidden: {},
                      visible: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
                    }}
                    className="flex flex-col gap-4"
                  >
                    {item.points.map((point) => (
                      <motion.li
                        key={point}
                        variants={{
                          hidden: { opacity: 0, y: 16 },
                          visible: { opacity: 1, y: 0 },
                        }}
                        transition={{ duration: 0.85, ease: EASE_EDITORIAL }}
                        className="text-[14px] leading-[1.8] text-beige-300 text-pretty sm:text-[15px]"
                      >
                        {point}
                      </motion.li>
                    ))}
                  </motion.ul>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
