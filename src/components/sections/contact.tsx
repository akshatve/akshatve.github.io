'use client';

import { motion } from 'framer-motion';
import { profile } from '@/data/resume';
import { EASE_EDITORIAL } from '@/lib/utils';
import { Magnetic } from '@/components/shared/magnetic';
import { SectionLabel } from '@/components/shared/section-label';
import { SplitText } from '@/components/shared/split-text';

const details = [
  { label: 'Email', value: profile.email, href: `mailto:${profile.email}` },
  { label: 'Phone', value: profile.phone, href: `tel:${profile.phoneRaw}` },
  { label: 'Location', value: profile.location, href: null },
];

/** Closing statement plus résumé contact details. */
export function Contact() {
  return (
    <section id="contact" className="relative scroll-mt-24 py-28 sm:py-36 lg:py-44">
      <div className="shell">
        <SectionLabel index="07" label="Contact" />

        <div className="mt-16 lg:mt-24">
          <SplitText
            as="h2"
            text="Let's build something meaningful with data."
            className="max-w-4xl font-serif text-[clamp(2.4rem,7vw,5.6rem)] leading-[1.02] tracking-[-0.025em] text-beige-100"
          />

          <div className="mt-20 grid gap-12 border-t border-beige-200/12 pt-12 sm:grid-cols-3 sm:gap-8">
            {details.map((d, i) => (
              <motion.div
                key={d.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-12%' }}
                transition={{ duration: 0.85, delay: i * 0.09, ease: EASE_EDITORIAL }}
              >
                <span className="meta">{d.label}</span>
                <div className="mt-4">
                  {d.href ? (
                    <Magnetic strength={0.18}>
                      <a
                        href={d.href}
                        className="link-underline inline-block break-all text-[15px] text-beige-200 transition-colors duration-500 hover:text-gold sm:text-base"
                      >
                        {d.value}
                      </a>
                    </Magnetic>
                  ) : (
                    <span className="text-[15px] text-beige-200 sm:text-base">{d.value}</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
