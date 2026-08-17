'use client';

import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { useEffect } from 'react';
import { EASE_EDITORIAL } from '@/lib/utils';
import { usePrefersReducedMotion } from '@/hooks/use-media-query';

/**
 * Interactive panel for the Fake News Classifier project.
 *
 * Four layers animate in sequence when `active` flips true:
 *   1. token attribution highlights on a sample headline
 *   2. per-model confidence bars
 *   3. ensemble spread with a sliding indicator and calibrated verdict
 *   4. key metrics, counting up
 *
 * `active` is driven by hover on desktop and by scroll-into-view on touch,
 * where there is no hover state to trigger it.
 *
 * The sample headline is illustrative UI copy, not a real model output.
 */

/** Sample headline, split so attributed spans can be highlighted. */
const HEADLINE: { text: string; weight?: number }[] = [
  { text: 'Local council ' },
  { text: 'votes', weight: 0.82 },
  { text: ' to ' },
  { text: 'expand transit', weight: 0.64 },
  { text: ' after ' },
  { text: 'four-hour hearing', weight: 0.47 },
];

const MODELS = [
  { label: 'TF-IDF + LOGREG', kind: 'Lexical', value: 71 },
  { label: 'DISTILBERT', kind: 'Contextual', value: 86 },
];

const METRICS = [
  { value: 99, suffix: '%', label: 'Test acc.' },
  { value: 44, suffix: 'K', label: 'Corpus' },
  { value: 2, suffix: '', label: 'Models' },
  { text: 'Prob.', label: 'Output' },
];

/** Counts to `to` when active; snaps instantly under reduced motion. */
function Count({ to, suffix, active }: { to: number; suffix: string; active: boolean }) {
  const reduced = usePrefersReducedMotion();
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => `${Math.round(v)}${suffix}`);

  useEffect(() => {
    if (!active) {
      mv.set(0);
      return;
    }
    if (reduced) {
      mv.set(to);
      return;
    }
    const controls = animate(mv, to, { duration: 1.1, ease: EASE_EDITORIAL });
    return () => controls.stop();
  }, [active, to, mv, reduced]);

  return <motion.span>{rounded}</motion.span>;
}

export function FakeNewsVisual({ active }: { active: boolean }) {
  const reduced = usePrefersReducedMotion();
  const show = active;

  return (
    <div className="relative h-full w-full overflow-hidden bg-navy-900/40 p-5">
      {/* hairline grid backdrop */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(232,222,200,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(232,222,200,0.05) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative flex h-full flex-col justify-between">
        {/* 1 — token attribution */}
        <div>
          <p className="font-mono text-[8.5px] uppercase tracking-metadata text-beige-500">
            Token attribution
          </p>
          <p className="mt-2.5 text-[12.5px] leading-[1.7] text-beige-200">
            {HEADLINE.map((seg, i) =>
              seg.weight ? (
                <motion.span
                  key={i}
                  className="rounded-[3px] px-[3px] py-[1px]"
                  initial={false}
                  animate={{
                    backgroundColor: show
                      ? `rgba(216,192,138,${0.1 + seg.weight * 0.16})`
                      : 'rgba(216,192,138,0)',
                    boxShadow: show
                      ? `inset 0 0 0 1px rgba(216,192,138,${0.25 + seg.weight * 0.35})`
                      : 'inset 0 0 0 1px rgba(216,192,138,0)',
                    color: show ? '#F3ECDC' : '#E8DEC8',
                  }}
                  transition={{
                    duration: reduced ? 0 : 0.5,
                    delay: reduced ? 0 : i * 0.09,
                    ease: EASE_EDITORIAL,
                  }}
                >
                  {seg.text}
                </motion.span>
              ) : (
                <span key={i}>{seg.text}</span>
              ),
            )}
          </p>
        </div>

        {/* 2 — per-model confidence */}
        <div className="mt-4 flex flex-col gap-3">
          {MODELS.map((m, i) => (
            <div key={m.label}>
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-[8.5px] uppercase tracking-wide2 text-beige-400">
                  {m.label}{' '}
                  <span className="text-beige-500">({m.kind})</span>
                </span>
                <motion.span
                  className="font-mono text-[9px] tabular-nums text-gold"
                  animate={{ opacity: show ? 1 : 0 }}
                  transition={{ duration: 0.4, delay: reduced ? 0 : 0.35 + i * 0.12 }}
                >
                  {m.value}%
                </motion.span>
              </div>
              <div className="mt-1.5 h-[3px] w-full overflow-hidden bg-beige-200/10">
                <motion.div
                  className="h-full bg-gradient-to-r from-beige-300/70 to-gold"
                  initial={false}
                  animate={{ width: show ? `${m.value}%` : '0%' }}
                  transition={{
                    duration: reduced ? 0 : 1.05,
                    delay: reduced ? 0 : 0.25 + i * 0.14,
                    ease: EASE_EDITORIAL,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* 3 — ensemble spread + calibrated verdict */}
        <div className="mt-4">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[8.5px] uppercase tracking-wide2 text-beige-400">
              Ensemble spread
            </span>
            <motion.span
              className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wide2 text-beige-100"
              animate={{ opacity: show ? 1 : 0 }}
              transition={{ duration: 0.5, delay: reduced ? 0 : 0.95 }}
            >
              <motion.span
                className="block size-1.5 rounded-full bg-gold"
                animate={
                  show && !reduced
                    ? { boxShadow: ['0 0 0px rgba(216,192,138,0.9)', '0 0 8px rgba(216,192,138,0.9)', '0 0 0px rgba(216,192,138,0.9)'] }
                    : { boxShadow: '0 0 0px rgba(216,192,138,0)' }
                }
                transition={{ duration: 2, repeat: show && !reduced ? Infinity : 0 }}
              />
              Credible
            </motion.span>
          </div>

          <div className="relative mt-2 h-[3px] w-full bg-beige-200/10">
            {/* spread between the two model outputs */}
            <motion.div
              className="absolute inset-y-0 bg-beige-200/25"
              initial={false}
              animate={{ left: '71%', width: show ? '15%' : '0%' }}
              transition={{ duration: reduced ? 0 : 0.8, delay: reduced ? 0 : 0.75, ease: EASE_EDITORIAL }}
            />
            {/* calibrated point estimate */}
            <motion.span
              className="absolute -top-[3px] size-[9px] -translate-x-1/2 rotate-45 border border-gold bg-navy-900"
              initial={false}
              animate={{ left: show ? '79%' : '0%', opacity: show ? 1 : 0 }}
              transition={{ duration: reduced ? 0 : 1, delay: reduced ? 0 : 0.85, ease: EASE_EDITORIAL }}
            />
          </div>
        </div>

        {/* 4 — key metrics */}
        <div className="mt-4 grid grid-cols-4 gap-2 border-t border-beige-200/10 pt-3">
          {METRICS.map((m, i) => (
            <motion.div
              key={m.label}
              initial={false}
              animate={{ opacity: show ? 1 : 0.35, scale: show ? 1 : 0.96 }}
              transition={{
                duration: reduced ? 0 : 0.55,
                delay: reduced ? 0 : 1.05 + i * 0.08,
                ease: EASE_EDITORIAL,
              }}
            >
              <p className="font-mono text-[13px] tabular-nums leading-none text-beige-100">
                {'value' in m && typeof m.value === 'number' ? (
                  <Count to={m.value} suffix={m.suffix ?? ''} active={show} />
                ) : (
                  m.text
                )}
              </p>
              <p className="mt-1.5 font-mono text-[7.5px] uppercase tracking-wide2 text-beige-500">
                {m.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
