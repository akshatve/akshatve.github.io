'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { EASE_EDITORIAL, cn } from '@/lib/utils';
import { usePrefersReducedMotion } from '@/hooks/use-media-query';

/**
 * Interactive panel for the Fake Review Detection Pipeline.
 *
 * An adversarial attack in slow motion: words in a sample review are swapped
 * one at a time, the detector's "fake" confidence slides under the flag
 * threshold, and a degradation curve pulls away from the clean baseline —
 * the shaded gap is the robustness gap the TextAttack framework measures.
 *
 * Decorative. The review text is illustrative and the chart carries no
 * values; the résumé states none, so nothing here asserts a result.
 */

/** Illustrative review — not from the dataset. */
const TOKENS = ['Absolutely', 'amazing', 'product,', 'best', 'purchase', 'ever,', 'highly', 'recommend!'];
/** Token index → perturbed replacement, in attack order. */
const SWAPS: [number, string][] = [
  [1, 'amazin'],
  [3, 'finest'],
  [6, 'truly'],
];
const LAST = SWAPS.length;

/** Detector confidence per attack step — geometry, not measurements. */
const CONFIDENCE = [0.9, 0.73, 0.56, 0.34];
const THRESHOLD = 0.5;

/** Degradation curve anchor per step, in the chart's viewBox. */
const CURVE_X = [18, 76, 134, 188];
const CLEAN_Y = 34;
const CURVE_Y = [34, 58, 90, 120];
const CURVE = `M18,34 C52,36 64,52 76,58 S122,86 134,90 S176,114 188,120`;

const STEP_MS = 1400;
const HOLD_MS = 2400;

export function AdversarialVisual({ active }: { active: boolean }) {
  const reduced = usePrefersReducedMotion();
  const [step, setStep] = useState(0);
  const d = (s: number) => (reduced ? 0 : s);

  useEffect(() => {
    if (!active) {
      setStep(0);
      return;
    }
    if (reduced) {
      setStep(LAST);
      return;
    }
    const id = window.setTimeout(
      () => setStep((s) => (s >= LAST ? 0 : s + 1)),
      step === 0 ? 900 : step >= LAST ? HOLD_MS : STEP_MS,
    );
    return () => window.clearTimeout(id);
  }, [active, reduced, step]);

  const swapped = new Map(SWAPS.slice(0, step));
  const current = step > 0 ? SWAPS[step - 1][0] : -1;
  const confidence = CONFIDENCE[step];
  const evaded = confidence < THRESHOLD;

  return (
    <div className="relative h-full w-full overflow-hidden bg-navy-900/40 p-5">
      <div className="flex h-full flex-col">
        <div className="flex items-baseline justify-between">
          <p className="font-mono text-[8.5px] uppercase tracking-metadata text-beige-500">
            Adversarial robustness · TextAttack
          </p>
          <p className="font-mono text-[8.5px] uppercase tracking-wide2 text-gold">
            Perturbation {step}/{LAST}
          </p>
        </div>

        <div className="mt-3 grid min-h-0 flex-1 grid-cols-12 gap-5">
          {/* ── review under attack + detector ── */}
          <div className="col-span-7 flex flex-col justify-between">
            <div>
              <p className="font-mono text-[8px] uppercase tracking-wide2 text-beige-500">
                Review input
              </p>
              <p className="mt-2 flex flex-wrap gap-x-1.5 gap-y-1 font-mono text-[10.5px] leading-snug">
                {TOKENS.map((token, i) => {
                  const replacement = swapped.get(i);
                  return (
                    <motion.span
                      key={`${i}-${replacement ?? token}`}
                      initial={replacement ? { opacity: 0, y: -5 } : false}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: d(0.45), ease: EASE_EDITORIAL }}
                      className={cn(
                        'px-1 transition-colors duration-500',
                        replacement
                          ? 'bg-gold/10 text-gold'
                          : 'text-beige-300',
                        i === current && 'outline outline-1 outline-gold/60',
                      )}
                    >
                      {replacement ?? token}
                    </motion.span>
                  );
                })}
              </p>
            </div>

            <p className="font-mono text-[8px] uppercase tracking-wide2 text-beige-500">
              Features · TF-IDF + stylometric
            </p>

            <div>
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-[8.5px] uppercase tracking-wide2 text-beige-400">
                  Fake confidence
                </span>
                <span
                  className={cn(
                    'flex items-center gap-1.5 font-mono text-[8.5px] uppercase tracking-wide2 transition-colors duration-500',
                    evaded ? 'text-gold' : 'text-beige-100',
                  )}
                >
                  <span
                    className={cn(
                      'block size-1.5 rounded-full transition-colors duration-500',
                      evaded ? 'border border-gold bg-transparent' : 'bg-beige-100',
                    )}
                  />
                  {evaded ? 'Evaded' : 'Flagged'}
                </span>
              </div>
              <div className="relative mt-1.5 h-[3px] w-full bg-beige-200/10">
                <motion.div
                  className="h-full bg-gradient-to-r from-beige-300/70 to-gold"
                  initial={{ width: '0%' }}
                  animate={{ width: `${confidence * 100}%` }}
                  transition={{ duration: d(0.8), ease: EASE_EDITORIAL }}
                />
                {/* flag threshold */}
                <span
                  aria-hidden
                  className="absolute -top-1.5 h-[15px] w-px bg-beige-100/60"
                  style={{ left: `${THRESHOLD * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* ── degradation curve ── */}
          <div className="col-span-5 flex min-h-0 flex-col">
            <p className="font-mono text-[8px] uppercase tracking-wide2 text-beige-500">
              Classifier degradation
            </p>
            <svg viewBox="0 0 200 140" className="mt-1 min-h-0 w-full flex-1" aria-hidden>
              <defs>
                <clipPath id="adv-reveal">
                  <motion.rect
                    x="0"
                    y="0"
                    height="140"
                    initial={{ width: CURVE_X[0] }}
                    animate={{ width: CURVE_X[step] + 1 }}
                    transition={{ duration: d(0.9), ease: EASE_EDITORIAL }}
                  />
                </clipPath>
              </defs>

              {/* guides */}
              {[34, 77, 120].map((y) => (
                <line key={y} x1="10" x2="196" y1={y} y2={y} stroke="rgba(232,222,200,0.06)" />
              ))}

              {/* clean baseline */}
              <line
                x1="18"
                x2="188"
                y1={CLEAN_Y}
                y2={CLEAN_Y}
                stroke="rgba(232,222,200,0.45)"
                strokeDasharray="3 3"
              />
              <text
                x="188"
                y={CLEAN_Y - 6}
                textAnchor="end"
                fill="rgba(232,222,200,0.5)"
                style={{ font: '6.5px ui-monospace, monospace', letterSpacing: '0.1em' }}
              >
                CLEAN
              </text>

              {/* ghost of the full attacked curve */}
              <path d={CURVE} fill="none" stroke="rgba(232,222,200,0.1)" strokeWidth="1" />

              {/* robustness gap + attacked curve, revealed step by step */}
              <g clipPath="url(#adv-reveal)">
                <path d={`${CURVE} L188,${CLEAN_Y} Z`} fill="rgba(216,192,138,0.12)" />
                <path d={CURVE} fill="none" stroke="#D8C08A" strokeWidth="1.4" />
              </g>

              {/* attack position */}
              <motion.circle
                r="3"
                fill="#D8C08A"
                initial={{ cx: CURVE_X[0], cy: CURVE_Y[0] }}
                animate={{ cx: CURVE_X[step], cy: CURVE_Y[step] }}
                transition={{ duration: d(0.9), ease: EASE_EDITORIAL }}
              />

              <motion.text
                x="150"
                y="66"
                textAnchor="middle"
                fill="rgba(216,192,138,0.85)"
                style={{ font: '6.5px ui-monospace, monospace', letterSpacing: '0.1em' }}
                animate={{ opacity: step >= 2 ? 1 : 0 }}
                transition={{ duration: d(0.5) }}
              >
                ROBUSTNESS GAP
              </motion.text>

              <text
                x="18"
                y="136"
                fill="rgba(232,222,200,0.45)"
                style={{ font: '6.5px ui-monospace, monospace', letterSpacing: '0.1em' }}
              >
                NO ATTACK
              </text>
              <text
                x="188"
                y="136"
                textAnchor="end"
                fill="rgba(232,222,200,0.45)"
                style={{ font: '6.5px ui-monospace, monospace', letterSpacing: '0.1em' }}
              >
                ATTACKED
              </text>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
