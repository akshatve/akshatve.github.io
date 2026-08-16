'use client';

import { motion } from 'framer-motion';
import { EASE_EDITORIAL } from '@/lib/utils';
import { usePrefersReducedMotion } from '@/hooks/use-media-query';

/**
 * Interactive panel for the Stack Exchange relational analysis.
 *
 * Three tables draw in, join lines light up between them, and a query scan
 * sweeps across on a loop. The only figure shown — 2.4+ GB — is stated in the
 * résumé; nothing else carries a number.
 */

const TABLES = [
  { x: 20, label: 'POSTS' },
  { x: 122, label: 'TAGS' },
  { x: 224, label: 'VOTES' },
];
const TOP = 30;
const BOX_W = 76;
const BOX_H = 84;
const ROWS = 5;

export function DatabaseVisual({ active }: { active: boolean }) {
  const reduced = usePrefersReducedMotion();
  const d = (s: number) => (reduced ? 0 : s);

  return (
    <div className="relative h-full w-full overflow-hidden bg-navy-900/40 p-5">
      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-baseline justify-between">
          <p className="font-mono text-[8.5px] uppercase tracking-metadata text-beige-500">
            SQLite · Cross Validated
          </p>
          <motion.p
            className="font-mono text-[8.5px] uppercase tracking-wide2 text-gold"
            animate={{ opacity: active ? 1 : 0 }}
            transition={{ duration: 0.5, delay: d(1.2) }}
          >
            2.4+ GB
          </motion.p>
        </div>

        <svg viewBox="0 0 320 150" className="mt-2 w-full flex-1" preserveAspectRatio="none" aria-hidden>
          {/* join lines between adjacent tables */}
          {[0, 1].map((i) => (
            <motion.line
              key={`j${i}`}
              x1={TABLES[i].x + BOX_W}
              y1={TOP + 34}
              x2={TABLES[i + 1].x}
              y2={TOP + 52}
              stroke="rgba(216,192,138,0.55)"
              strokeWidth="1"
              initial={false}
              animate={{ pathLength: active ? 1 : 0, opacity: active ? 1 : 0 }}
              transition={{ duration: d(0.6), delay: d(0.75 + i * 0.25), ease: EASE_EDITORIAL }}
            />
          ))}

          {TABLES.map((t, ti) => (
            <g key={t.label}>
              <motion.rect
                x={t.x}
                y={TOP}
                width={BOX_W}
                height={BOX_H}
                fill="rgba(5,11,20,0.75)"
                stroke={ti === 1 ? '#D8C08A' : 'rgba(232,222,200,0.4)'}
                strokeWidth="1"
                initial={false}
                animate={{ opacity: active ? 1 : 0.2, y: active ? TOP : TOP + 8 }}
                transition={{ duration: d(0.6), delay: d(0.1 + ti * 0.16), ease: EASE_EDITORIAL }}
              />

              {/* header rule */}
              <motion.line
                x1={t.x}
                y1={TOP + 16}
                x2={t.x + BOX_W}
                y2={TOP + 16}
                stroke="rgba(232,222,200,0.3)"
                strokeWidth="1"
                initial={false}
                animate={{ opacity: active ? 1 : 0 }}
                transition={{ duration: d(0.4), delay: d(0.25 + ti * 0.16) }}
              />

              <motion.text
                x={t.x + 6}
                y={TOP + 11}
                fill="rgba(232,222,200,0.65)"
                style={{ font: '7px ui-monospace, monospace', letterSpacing: '0.14em' }}
                initial={false}
                animate={{ opacity: active ? 1 : 0 }}
                transition={{ duration: d(0.4), delay: d(0.3 + ti * 0.16) }}
              >
                {t.label}
              </motion.text>

              {/* rows, each sliding in */}
              {Array.from({ length: ROWS }, (_, r) => (
                <motion.rect
                  key={r}
                  x={t.x + 6}
                  y={TOP + 24 + r * 12}
                  height="3"
                  fill="rgba(232,222,200,0.28)"
                  initial={false}
                  animate={{
                    width: active ? BOX_W - 12 - ((r * 7 + ti * 5) % 22) : 0,
                    opacity: active ? 1 : 0,
                  }}
                  transition={{
                    duration: d(0.5),
                    delay: d(0.35 + ti * 0.12 + r * 0.06),
                    ease: EASE_EDITORIAL,
                  }}
                />
              ))}
            </g>
          ))}

          {/* query scan sweeping across the tables on a loop */}
          {active && !reduced && (
            <motion.rect
              y={TOP - 4}
              width="2"
              height={BOX_H + 8}
              fill="rgba(216,192,138,0.75)"
              initial={{ x: 16 }}
              animate={{ x: [16, 304], opacity: [0, 0.9, 0.9, 0] }}
              transition={{
                duration: 2.4,
                delay: 1.2,
                repeat: Infinity,
                repeatDelay: 0.9,
                ease: 'linear',
                times: [0, 0.08, 0.9, 1],
              }}
            />
          )}
        </svg>

        {/* modelled dimensions */}
        <div className="mt-2 grid grid-cols-3 gap-2 border-t border-beige-200/10 pt-3">
          {['Response times', 'Tag frequency', 'Bounty impact'].map((label, i) => (
            <motion.div
              key={label}
              initial={false}
              animate={{ opacity: active ? 1 : 0.3, y: active ? 0 : 4 }}
              transition={{ duration: d(0.5), delay: d(1.25 + i * 0.09), ease: EASE_EDITORIAL }}
            >
              <p className="font-mono text-[7.5px] uppercase tracking-wide2 text-beige-400">
                {label}
              </p>
              <motion.span
                className="mt-1.5 block h-[2px] bg-gold/60"
                initial={false}
                animate={{ width: active ? '100%' : '0%' }}
                transition={{ duration: d(0.6), delay: d(1.3 + i * 0.09), ease: EASE_EDITORIAL }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
