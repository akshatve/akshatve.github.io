'use client';

import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { experiences } from '@/data/resume';
import { EASE_EDITORIAL } from '@/lib/utils';
import { SectionLabel } from '@/components/shared/section-label';

/**
 * Vertical timeline whose spine draws itself as the section scrolls past.
 * Each entry reveals its role, dates and bullets on a short stagger.
 */
export function Experience() {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 75%', 'end 55%'],
  });
  const scaleY = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });
  const dotY = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  return (
    <section id="experience" className="relative scroll-mt-24 py-28 sm:py-36 lg:py-44">
      <div className="shell">
        <SectionLabel index="02" label="Experience" />

        <div ref={ref} className="relative mt-16 lg:mt-24">
          {/* Spine — track plus the drawn progress line */}
          <div
            aria-hidden
            className="absolute left-0 top-0 h-full w-px bg-beige-200/10 sm:left-2"
          />
          <motion.div
            aria-hidden
            style={{ scaleY }}
            className="absolute left-0 top-0 h-full w-px origin-top bg-beige-200/55 sm:left-2"
          />
          <motion.span
            aria-hidden
            style={{ top: dotY }}
            className="absolute -left-[3px] h-1.5 w-1.5 rounded-full bg-gold sm:left-[5px]"
          />

          <div className="flex flex-col gap-20 pl-8 sm:gap-24 sm:pl-16 lg:pl-24">
            {experiences.map((exp, i) => (
              <motion.article
                key={exp.company}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-18%' }}
                transition={{ staggerChildren: 0.1 }}
                className="group relative"
              >
                {/* Node on the spine */}
                <span
                  aria-hidden
                  className="absolute -left-8 top-3 h-px w-4 bg-beige-200/25 transition-all duration-700 ease-editorial group-hover:w-6 group-hover:bg-gold sm:-left-16 sm:w-8 sm:group-hover:w-12 lg:-left-24 lg:w-14"
                />

                <motion.div
                  variants={{
                    hidden: { opacity: 0 },
                    visible: { opacity: 1 },
                  }}
                  transition={{ duration: 0.7 }}
                  className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2"
                >
                  <span className="font-mono text-[10px] text-beige-500">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="font-mono text-[11px] tracking-wide2 text-beige-400">
                    {exp.period}
                  </span>
                </motion.div>

                <motion.h3
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  transition={{ duration: 0.9, ease: EASE_EDITORIAL }}
                  className="mt-5 font-serif text-[clamp(1.75rem,3.6vw,2.9rem)] leading-[1.1] tracking-[-0.015em] text-beige-100 transition-colors duration-500 group-hover:text-white"
                >
                  {exp.company}
                </motion.h3>

                <motion.p
                  variants={{
                    hidden: { opacity: 0, y: 14 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  transition={{ duration: 0.8, ease: EASE_EDITORIAL }}
                  className="mt-3 text-[11px] uppercase tracking-metadata text-gold"
                >
                  {exp.role}
                </motion.p>

                {/* Bullets reveal one at a time */}
                <motion.ul
                  variants={{
                    hidden: {},
                    visible: { transition: { staggerChildren: 0.14, delayChildren: 0.2 } },
                  }}
                  className="mt-8 flex max-w-3xl flex-col gap-5"
                >
                  {exp.points.map((point) => (
                    <motion.li
                      key={point}
                      variants={{
                        hidden: { opacity: 0, y: 16 },
                        visible: { opacity: 1, y: 0 },
                      }}
                      transition={{ duration: 0.85, ease: EASE_EDITORIAL }}
                      className="flex gap-4 border-t border-beige-200/10 pt-5 text-[14px] leading-[1.8] text-beige-300 text-pretty sm:text-[15px]"
                    >
                      <span aria-hidden className="mt-2.5 h-px w-3 shrink-0 bg-beige-200/30" />
                      <span>{point}</span>
                    </motion.li>
                  ))}
                </motion.ul>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
