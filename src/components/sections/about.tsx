'use client';

import { motion } from 'framer-motion';
import { disciplines, education, profile } from '@/data/resume';
import { EASE_EDITORIAL } from '@/lib/utils';
import { SectionLabel } from '@/components/shared/section-label';
import { SplitText } from '@/components/shared/split-text';

/**
 * About + Education as one editorial spread rather than two boxed cards:
 * a large statement on the left, supporting prose and the degree on the right.
 */
export function About() {
  return (
    <section id="about" className="relative scroll-mt-24 py-28 sm:py-36 lg:py-44">
      <div className="shell">
        <SectionLabel index="01" label="About" />

        <div className="mt-16 grid gap-14 lg:mt-24 lg:grid-cols-12 lg:gap-16">
          {/* Statement */}
          <div className="lg:col-span-7">
            <SplitText
              as="h2"
              text="Turning data into decisions."
              className="font-serif text-[clamp(2.4rem,6vw,4.6rem)] leading-[1.05] tracking-[-0.02em] text-beige-100"
            />

            {/* Disciplines animate into position on entry */}
            <motion.ul
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-15%' }}
              transition={{ staggerChildren: 0.1, delayChildren: 0.35 }}
              className="mt-14 flex flex-col"
            >
              {disciplines.map((d) => (
                <motion.li
                  key={d}
                  variants={{
                    hidden: { opacity: 0, x: -18 },
                    visible: { opacity: 1, x: 0 },
                  }}
                  transition={{ duration: 0.9, ease: EASE_EDITORIAL }}
                  className="group flex items-center gap-5 border-t border-beige-200/10 py-4 last:border-b"
                >
                  <span
                    aria-hidden
                    className="h-px w-6 bg-beige-200/25 transition-all duration-700 ease-editorial group-hover:w-12 group-hover:bg-gold"
                  />
                  <span className="text-[11px] uppercase tracking-metadata text-beige-300 transition-colors duration-500 group-hover:text-beige-100">
                    {d}
                  </span>
                </motion.li>
              ))}
            </motion.ul>
          </div>

          {/* Supporting column */}
          <div className="lg:col-span-5 lg:pt-4">
            <motion.p
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-15%' }}
              transition={{ duration: 1, ease: EASE_EDITORIAL }}
              className="text-[15px] leading-[1.85] text-beige-300 text-pretty sm:text-base"
            >
              {profile.summary}
            </motion.p>

            {/* Education, integrated rather than boxed */}
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-15%' }}
              transition={{ duration: 1, delay: 0.15, ease: EASE_EDITORIAL }}
              className="mt-16"
            >
              <span className="meta">Education</span>
              <div className="mt-6 border-t border-beige-200/15 pt-6">
                <h3 className="font-serif text-2xl leading-tight text-beige-100 sm:text-[28px]">
                  {education.school}
                </h3>
                <p className="mt-3 text-sm text-beige-300">{education.degree}</p>
                <p className="mt-4 font-mono text-[11px] tracking-wide2 text-beige-500">
                  {education.period}
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.25 }}
              className="mt-10 flex items-baseline gap-4"
            >
              <span className="meta">Based in</span>
              <span className="text-sm text-beige-200">{profile.location}</span>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
