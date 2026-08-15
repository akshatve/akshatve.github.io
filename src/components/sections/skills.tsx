'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { skillGroups } from '@/data/resume';
import { EASE_EDITORIAL, cn } from '@/lib/utils';
import { SectionLabel } from '@/components/shared/section-label';

/**
 * Skill ecosystem. A central DATA SCIENCE anchor with the résumé's three
 * groups branching from it. Hovering a group illuminates its members and
 * dims the rest, so relationships read without extra colour.
 */
export function Skills() {
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  return (
    <section id="skills" className="relative scroll-mt-24 py-28 sm:py-36 lg:py-44">
      <div className="shell">
        <SectionLabel index="05" label="Skills" />

        <div className="mt-16 lg:mt-24">
          {/* Anchor */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-15%' }}
            transition={{ duration: 1, ease: EASE_EDITORIAL }}
            className="flex items-center gap-6"
          >
            <span className="font-serif text-[clamp(1.9rem,4.5vw,3.4rem)] leading-none tracking-[-0.02em] text-beige-100">
              Data Science
            </span>
            <span aria-hidden className="h-px flex-1 bg-beige-200/15" />
          </motion.div>

          <div
            className="mt-14 grid gap-px border border-beige-200/12 bg-beige-200/12 sm:mt-16 lg:grid-cols-3"
            onMouseLeave={() => setActiveGroup(null)}
          >
            {skillGroups.map((group, gi) => {
              const dimmed = activeGroup !== null && activeGroup !== group.label;

              return (
                <motion.div
                  key={group.label}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-12%' }}
                  transition={{ duration: 0.9, delay: gi * 0.1, ease: EASE_EDITORIAL }}
                  onMouseEnter={() => setActiveGroup(group.label)}
                  onFocusCapture={() => setActiveGroup(group.label)}
                  className={cn(
                    'relative bg-navy-800 p-7 transition-opacity duration-500 sm:p-9',
                    dimmed ? 'opacity-40' : 'opacity-100',
                  )}
                >
                  <div className="flex items-baseline gap-4">
                    <span className="font-mono text-[10px] text-gold">
                      {String(gi + 1).padStart(2, '0')}
                    </span>
                    <h3 className="text-[11px] uppercase tracking-metadata text-beige-200">
                      {group.label}
                    </h3>
                  </div>

                  <span
                    aria-hidden
                    className={cn(
                      'mt-6 block h-px origin-left bg-beige-200/20 transition-all duration-700 ease-editorial',
                      activeGroup === group.label ? 'w-full bg-gold/50' : 'w-10',
                    )}
                  />

                  <ul className="mt-7 flex flex-col">
                    {group.items.map((item) => (
                      <li key={item}>
                        <span
                          tabIndex={0}
                          className="group/skill flex items-center gap-4 border-b border-beige-200/[0.07] py-3 outline-offset-2 transition-colors duration-500"
                        >
                          <span
                            aria-hidden
                            className={cn(
                              'h-1 w-1 shrink-0 rounded-full transition-colors duration-500',
                              activeGroup === group.label ? 'bg-gold' : 'bg-beige-200/30',
                            )}
                          />
                          <span
                            className={cn(
                              'text-[13px] transition-colors duration-500 group-hover/skill:text-beige-100',
                              activeGroup === group.label ? 'text-beige-200' : 'text-beige-300',
                            )}
                          >
                            {item}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
