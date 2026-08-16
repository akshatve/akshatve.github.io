'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { projects } from '@/data/resume';
import type { Project } from '@/types';
import { EASE_EDITORIAL, cn } from '@/lib/utils';
import { usePointerFine } from '@/hooks/use-media-query';
import { SectionLabel } from '@/components/shared/section-label';
import { ProjectVisual } from '@/components/shared/project-visual';
import { FakeNewsVisual } from '@/components/shared/fake-news-visual';

/**
 * Vertical project list. Each entry gets its own full-width row so there is
 * room for real detail — description paragraphs plus skill pills — read by
 * scrolling down rather than sideways.
 *
 * Structure intentionally mirrors the Leadership section so both read as one
 * editorial system.
 */
export function Projects() {
  return (
    <section id="projects" className="relative scroll-mt-24 py-28 sm:py-36 lg:py-44">
      <div className="shell">
        <SectionLabel index="04" label="Projects" />

        <div className="mt-16 flex flex-col lg:mt-24">
          {projects.map((project) => (
            <ProjectRow key={project.number} project={project} />
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * One project. Hover state is tracked here so the interactive visual can react
 * to the whole row, not just itself. On touch there is no hover, so the visual
 * activates when the row scrolls into view instead.
 */
function ProjectRow({ project }: { project: Project }) {
  const ref = useRef<HTMLElement>(null);
  const fine = usePointerFine();
  const inView = useInView(ref, { once: true, margin: '-25%' });
  const [hovered, setHovered] = useState(false);
  const visualActive = fine ? hovered : inView;

  return (
    <>
            <motion.article
              ref={ref}
              onHoverStart={() => setHovered(true)}
              onHoverEnd={() => setHovered(false)}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-15%' }}
              transition={{ staggerChildren: 0.1 }}
              className="group relative border-t border-beige-200/12 py-14 last:border-b sm:py-16"
            >
              {/* Hover wash — depth without a card */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-beige-200/[0.035] to-transparent opacity-0 transition-opacity duration-700 ease-editorial group-hover:opacity-100"
              />

              <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
                <div className="lg:col-span-1">
                  <motion.span
                    variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
                    transition={{ duration: 0.7 }}
                    className="font-mono text-[11px] text-gold"
                  >
                    {project.number}
                  </motion.span>
                </div>

                {/* Title, period and decorative motif */}
                <div className="lg:col-span-5">
                  <motion.h3
                    variants={{
                      hidden: { opacity: 0, y: 22 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    transition={{ duration: 0.95, ease: EASE_EDITORIAL }}
                    className="font-serif text-[clamp(1.7rem,3.4vw,2.7rem)] leading-[1.12] tracking-[-0.015em] text-beige-100"
                  >
                    {project.title}
                  </motion.h3>

                  <motion.p
                    variants={{
                      hidden: { opacity: 0, y: 14 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    transition={{ duration: 0.8, ease: EASE_EDITORIAL }}
                    className="mt-4 font-mono text-[11px] tracking-wide2 text-beige-400"
                  >
                    {project.period}
                  </motion.p>

                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 18 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    transition={{ duration: 1, ease: EASE_EDITORIAL }}
                    className={cn(
                      'relative mt-8 hidden overflow-hidden border border-beige-200/12 lg:block',
                      project.visual === 'fakenews' ? 'h-[19.5rem]' : 'h-40',
                    )}
                  >
                    {project.visual === 'fakenews' ? (
                      <FakeNewsVisual active={visualActive} />
                    ) : (
                      <>
                        <span className="absolute inset-0 opacity-55 transition-opacity duration-700 ease-editorial group-hover:opacity-80">
                          <ProjectVisual variant={project.visual} />
                        </span>
                        <span
                          aria-hidden
                          className="absolute inset-0 bg-gradient-to-t from-navy-800 via-transparent to-transparent"
                        />
                      </>
                    )}
                  </motion.div>
                </div>

                {/* Description + skills */}
                <div className="lg:col-span-6">
                  <motion.ul
                    variants={{
                      hidden: {},
                      visible: { transition: { staggerChildren: 0.12, delayChildren: 0.12 } },
                    }}
                    className="flex flex-col gap-5"
                  >
                    {project.points.map((point) => (
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

                  {project.skills.length > 0 && (
                    <>
                      <motion.p
                        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
                        transition={{ duration: 0.7 }}
                        className="meta mb-5 mt-10"
                      >
                        Skills used
                      </motion.p>

                      <motion.ul
                        variants={{
                          hidden: {},
                          visible: { transition: { staggerChildren: 0.05 } },
                        }}
                        className="flex flex-wrap gap-2.5"
                      >
                        {project.skills.map((skill) => (
                          <motion.li
                            key={skill}
                            variants={{
                              hidden: { opacity: 0, y: 12, scale: 0.96 },
                              visible: { opacity: 1, y: 0, scale: 1 },
                            }}
                            transition={{ duration: 0.6, ease: EASE_EDITORIAL }}
                          >
                            <span
                              tabIndex={0}
                              className="inline-flex cursor-default items-center rounded-full border border-beige-200/20 bg-beige-200/[0.04] px-4 py-2 text-[12.5px] text-beige-300 outline-offset-2 transition-all duration-500 ease-editorial hover:-translate-y-0.5 hover:border-gold/60 hover:bg-gold/10 hover:text-beige-100 focus-visible:-translate-y-0.5 focus-visible:border-gold/60 focus-visible:text-beige-100"
                            >
                              {skill}
                            </span>
                          </motion.li>
                        ))}
                      </motion.ul>
                    </>
                  )}
                </div>
              </div>
            </motion.article>
    </>
  );
}
