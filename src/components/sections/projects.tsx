'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { projects } from '@/data/resume';
import type { Project } from '@/types';
import { EASE_EDITORIAL, cn } from '@/lib/utils';
import { usePointerFine } from '@/hooks/use-media-query';
import { SectionLabel } from '@/components/shared/section-label';
import { ProjectVisual } from '@/components/shared/project-visual';
import { FakeNewsVisual } from '@/components/shared/fake-news-visual';
import { FinanceVisual } from '@/components/shared/finance-visual';

/** Grace period before an un-hovered preview releases. */
const CLOSE_DELAY = 220;

export function Projects() {
  return (
    <section id="projects" className="relative scroll-mt-24 py-28 sm:py-36 lg:py-44">
      <div className="shell">
        <SectionLabel index="04" label="Projects" />

        {/* Desktop: menu + preview panel. Mobile: plain stack. Both render
            from the same data and are switched with CSS rather than JS, so
            there is no layout flash on hydration. */}
        <div className="mt-16 hidden lg:mt-24 lg:block">
          <Showcase />
        </div>

        <div className="mt-14 flex flex-col gap-4 lg:hidden">
          {projects.map((p) => (
            <StackedCard key={p.number} project={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ desktop */

function Showcase() {
  const fine = usePointerFine();
  const [activeId, setActiveId] = useState(projects[0].number);
  const [lockedId, setLockedId] = useState<string | null>(null);
  const [wedge, setWedge] = useState<string | null>(null);

  const stageRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number | null>(null);

  const active = projects.find((p) => p.number === activeId) ?? projects[0];

  const cancelClose = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const disarm = useCallback(() => setWedge(null), []);

  /**
   * Safe triangle: a wedge from the cursor to the panel's near corners.
   * While the pointer sits inside it the cursor is plausibly travelling
   * toward the panel, so the release is held off — a diagonal traverse no
   * longer drops the preview the way a bare pointerleave would.
   */
  const arm = useCallback(
    (x: number, y: number) => {
      if (!fine) return;
      const r = stageRef.current?.getBoundingClientRect();
      if (!r) return;
      const pad = 24; // catches shallow diagonals
      setWedge(
        `polygon(${x}px ${y}px, ${r.left}px ${r.top - pad}px, ${r.left}px ${r.bottom + pad}px)`,
      );
    },
    [fine],
  );

  const scheduleClose = useCallback(() => {
    cancelClose();
    // The panel keeps its last project; releasing only drops the wedge, so
    // the reader is never left staring at an empty container.
    timer.current = window.setTimeout(disarm, CLOSE_DELAY);
  }, [cancelClose, disarm]);

  useEffect(() => {
    if (!lockedId) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setLockedId(null);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [lockedId]);

  useEffect(() => () => cancelClose(), [cancelClose]);

  const select = (id: string) => {
    if (lockedId) return;
    cancelClose();
    setActiveId(id);
  };

  return (
    <>
      {/* Hover bridge. Mounted only while armed, so it can never be left
          behind swallowing clicks elsewhere on the page. */}
      {wedge && fine && (
        <div
          aria-hidden
          className="fixed inset-0 z-40"
          style={{ clipPath: wedge }}
          onPointerEnter={cancelClose}
          onPointerLeave={() => {
            disarm();
            cancelClose();
          }}
          // Belt and braces: the moment the cursor passes the panel's left
          // edge the wedge has done its job, so drop it. Without this a
          // missed pointerleave could leave an invisible overlay mounted.
          onPointerMove={(e) => {
            const r = stageRef.current?.getBoundingClientRect();
            if (r && e.clientX > r.left) disarm();
          }}
        />
      )}

      <div
        className="grid grid-cols-12 gap-12"
        // Leaving the whole showcase always releases the bridge.
        onPointerLeave={() => {
          disarm();
          cancelClose();
        }}
      >
        <div className="col-span-5">
          <ul role="tablist" aria-label="Projects">
            {projects.map((p) => {
              const isActive = p.number === active.number;
              const isLocked = lockedId === p.number;

              return (
                <li key={p.number}>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`project-panel-${p.number}`}
                    onPointerEnter={() => select(p.number)}
                    onPointerMove={(e) => !lockedId && arm(e.clientX, e.clientY)}
                    onFocus={() => select(p.number)}
                    onClick={() => {
                      setLockedId(isLocked ? null : p.number);
                      setActiveId(p.number);
                      cancelClose();
                      disarm();
                    }}
                    className={cn(
                      'group relative flex w-full items-baseline gap-5 border-t border-beige-200/10 py-7 pr-4 text-left transition-all duration-500 ease-editorial',
                      'last:border-b',
                      // the highlight: wash + indent, deepening on hover
                      isActive
                        ? 'bg-beige-200/[0.055] pl-8'
                        : 'pl-2 hover:bg-beige-200/[0.03] hover:pl-5',
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        'absolute left-0 top-1/2 h-[calc(100%-2.25rem)] w-px -translate-y-1/2 bg-gold transition-opacity duration-500',
                        isActive ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <span
                      className={cn(
                        'font-mono text-[10px] transition-colors duration-500',
                        isActive ? 'text-gold' : 'text-beige-500',
                      )}
                    >
                      {p.number}
                    </span>
                    <span
                      className={cn(
                        'font-serif text-[clamp(1.15rem,1.9vw,1.6rem)] leading-tight tracking-[-0.01em] transition-colors duration-500',
                        isActive ? 'text-beige-100' : 'text-beige-300 group-hover:text-beige-100',
                      )}
                    >
                      {p.title}
                    </span>
                    <span
                      className={cn(
                        'ml-auto shrink-0 font-mono text-[9px] uppercase tracking-metadata transition-all duration-500',
                        isLocked ? 'translate-x-0 text-gold opacity-100' : 'translate-x-1 opacity-0',
                      )}
                    >
                      Locked
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <p className="mt-6 font-mono text-[9.5px] uppercase tracking-metadata text-beige-500">
            {lockedId ? 'Click again or press Esc to release' : 'Click a project to lock it'}
          </p>
        </div>

        <div
          ref={stageRef}
          className="col-span-7"
          onPointerEnter={() => {
            cancelClose();
            disarm();
          }}
          onPointerLeave={scheduleClose}
        >
          <div className="sticky top-28 border border-beige-200/12 bg-navy-700/30 p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.number}
                id={`project-panel-${active.number}`}
                role="tabpanel"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4, ease: EASE_EDITORIAL }}
              >
                <div className="flex items-baseline justify-between gap-6">
                  <span className="font-mono text-[10px] tracking-wide2 text-gold">
                    {active.number}
                  </span>
                  <span className="font-mono text-[10px] tracking-wide2 text-beige-400">
                    {active.period}
                  </span>
                </div>

                <h3 className="mt-4 font-serif text-[clamp(1.5rem,2.6vw,2.1rem)] leading-[1.15] tracking-[-0.015em] text-beige-100">
                  {active.title}
                </h3>

                <div className="relative mt-6 h-[15rem] overflow-hidden border border-beige-200/12">
                  <Visual project={active} />
                </div>

                <div className="mt-7 flex max-h-[14rem] flex-col gap-4 overflow-y-auto pr-2">
                  {active.points.map((point) => (
                    <p key={point} className="text-[14px] leading-[1.8] text-beige-300 text-pretty">
                      {point}
                    </p>
                  ))}
                </div>

                <p className="meta mb-4 mt-8">Skills used</p>
                <ul className="flex flex-wrap gap-2.5">
                  {active.skills.map((s) => (
                    <li key={s}>
                      <span
                        tabIndex={0}
                        className="inline-flex cursor-default items-center rounded-full border border-beige-200/20 bg-beige-200/[0.04] px-4 py-2 text-[12.5px] text-beige-300 outline-offset-2 transition-all duration-500 ease-editorial hover:-translate-y-0.5 hover:border-gold/60 hover:bg-gold/10 hover:text-beige-100 focus-visible:-translate-y-0.5 focus-visible:border-gold/60"
                      >
                        {s}
                      </span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
}

/** Bespoke panel where one exists, else the abstract motif. */
function Visual({ project }: { project: Project }) {
  if (project.visual === 'fakenews') return <FakeNewsVisual active />;
  if (project.visual === 'finance') return <FinanceVisual active />;
  return (
    <>
      <span className="absolute inset-0 opacity-60">
        <ProjectVisual variant={project.visual} />
      </span>
      <span
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-navy-800 via-transparent to-transparent"
      />
    </>
  );
}

/* ------------------------------------------------------------------- mobile */

function StackedCard({ project }: { project: Project }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-12%' }}
      transition={{ duration: 0.8, ease: EASE_EDITORIAL }}
      className="border border-beige-200/12 bg-navy-700/25 p-6 transition-colors duration-500 hover:border-beige-200/25"
    >
      <div className="flex items-baseline justify-between gap-4">
        <span className="font-mono text-[10px] text-gold">{project.number}</span>
        <span className="font-mono text-[10px] tracking-wide2 text-beige-400">
          {project.period}
        </span>
      </div>

      <h3 className="mt-3 font-serif text-2xl leading-tight tracking-[-0.015em] text-beige-100">
        {project.title}
      </h3>

      <div className="mt-5 flex flex-col gap-4">
        {project.points.map((point) => (
          <p key={point} className="text-[14px] leading-[1.8] text-beige-300 text-pretty">
            {point}
          </p>
        ))}
      </div>

      <p className="meta mb-4 mt-7">Skills used</p>
      <ul className="flex flex-wrap gap-2.5">
        {project.skills.map((s) => (
          <li key={s}>
            <span className="inline-flex items-center rounded-full border border-beige-200/20 bg-beige-200/[0.04] px-3.5 py-1.5 text-[12px] text-beige-300">
              {s}
            </span>
          </li>
        ))}
      </ul>
    </motion.article>
  );
}
