'use client';

import { useLenis } from 'lenis/react';
import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { Project } from '@/types';
import { cn } from '@/lib/utils';
import { ProjectVisual } from '@/components/shared/project-visual';

interface ProjectModalProps {
  project: Project | null;
  onClose: () => void;
}

/**
 * Expanded case study. Opens in-page rather than navigating away.
 *
 * Deliberately NOT built on AnimatePresence. An exiting overlay stays mounted
 * for the length of its exit — and indefinitely if rAF is throttled in a
 * background tab — which leaves a full-screen layer swallowing every click.
 * Framer also drops non-animatable values like `pointerEvents` from `exit`, so
 * the usual escape hatch does not apply. Instead the container is permanently
 * mounted and its interactivity is driven by real state, so "closed" always
 * means `pointer-events: none`, whatever the animation is doing.
 *
 * Accessibility: labelled dialog, Escape to close, focus moved in on open and
 * restored to the trigger on close, and Tab cycled within the panel.
 */
export function ProjectModal({ project, onClose }: ProjectModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const lenis = useLenis();

  const open = project !== null;

  // Retain the last project so its content stays put through the fade-out.
  // Derived during render rather than in an effect: an effect would commit the
  // panel one render later, so the focus effect below would run while the
  // close button did not yet exist and focus would never enter the dialog.
  const shownRef = useRef<Project | null>(null);
  if (project) shownRef.current = project;
  const shown = shownRef.current;

  useEffect(() => {
    if (!open) return;

    restoreRef.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    lenis?.stop();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;

      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables?.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      lenis?.start();
      restoreRef.current?.focus?.();
    };
  }, [open, onClose, lenis]);

  return (
    <div
      aria-hidden={!open}
      data-lenis-prevent
      className={cn(
        'fixed inset-0 z-[95] flex items-start justify-center overflow-y-auto overscroll-contain p-4 transition-opacity duration-300 sm:p-8',
        open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
      )}
    >
      <button
        type="button"
        aria-label="Close case study"
        onClick={onClose}
        tabIndex={open ? 0 : -1}
        className="fixed inset-0 h-full w-full cursor-default bg-navy-900/92 backdrop-blur-sm"
      />

      {shown && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="project-modal-title"
          className={cn(
            'relative my-6 w-full max-w-3xl border border-beige-200/15 bg-navy-800 transition-all duration-500 ease-editorial',
            open ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
          )}
        >
          <div className="relative h-36 overflow-hidden border-b border-beige-200/12 sm:h-44">
            <span className="absolute inset-0 opacity-55">
              <ProjectVisual variant={shown.visual} />
            </span>
            <span
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-navy-800 to-transparent"
            />
            <div className="relative flex items-start justify-between p-6 sm:p-8">
              <span className="font-mono text-[11px] text-gold">{shown.number}</span>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                tabIndex={open ? 0 : -1}
                className="meta flex items-center gap-2 text-beige-200 transition-colors duration-500 hover:text-gold"
              >
                <X aria-hidden className="size-4" />
                Close
              </button>
            </div>
          </div>

          <div className="p-6 sm:p-10">
            <p className="font-mono text-[11px] tracking-wide2 text-beige-400">{shown.period}</p>
            <h2
              id="project-modal-title"
              className="mt-4 font-serif text-[clamp(1.8rem,4vw,2.8rem)] leading-[1.12] tracking-[-0.015em] text-beige-100"
            >
              {shown.title}
            </h2>

            <div className="mt-10 flex flex-col gap-10">
              <Block label="Context">
                <p className="text-[15px] leading-[1.85] text-beige-300 text-pretty">
                  {shown.context}
                </p>
              </Block>

              <Block label="What was built">
                <ul className="flex flex-col gap-4">
                  {shown.built.map((b) => (
                    <li
                      key={b}
                      className="flex gap-4 border-t border-beige-200/10 pt-4 text-[15px] leading-[1.8] text-beige-300 text-pretty"
                    >
                      <span aria-hidden className="mt-2.5 h-px w-3 shrink-0 bg-beige-200/30" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </Block>

              <Block label="Summary">
                <p className="border-l border-beige-200/20 pl-5 font-serif text-lg leading-[1.6] text-beige-200 text-pretty sm:text-xl">
                  {shown.summary}
                </p>
              </Block>

              <Block label="Tools & technologies">
                <ul className="flex flex-wrap gap-x-5 gap-y-3">
                  {shown.tech.map((t) => (
                    <li
                      key={t}
                      className="font-mono text-[11px] uppercase tracking-wide2 text-beige-300"
                    >
                      {t}
                    </li>
                  ))}
                </ul>
              </Block>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="meta mb-5">{label}</h3>
      {children}
    </section>
  );
}
