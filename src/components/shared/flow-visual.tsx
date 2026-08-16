'use client';

import { motion } from 'framer-motion';
import { EASE_EDITORIAL } from '@/lib/utils';
import { usePrefersReducedMotion } from '@/hooks/use-media-query';

/**
 * Interactive panel for GoodsFlow.
 *
 * Reads as a logistics pipeline: stages light up in sequence, packets travel
 * the connectors on a loop, a demand trend draws underneath and the shortage
 * scorer fills. Decorative — the résumé states no values, so nothing here
 * carries a number beyond the stage labels.
 */

const STAGES = ['Ingest', 'Seed', 'Score', 'Emit'];
const NODE_Y = 46;
const NODE_X = [26, 108, 190, 272];

/** Illustrative demand shape — geometry, not data. */
const TREND = [
  [26, 122], [60, 116], [94, 119], [128, 108],
  [162, 112], [196, 99], [230, 104], [264, 92], [294, 86],
] as const;

export function FlowVisual({ active }: { active: boolean }) {
  const reduced = usePrefersReducedMotion();
  const d = (s: number) => (reduced ? 0 : s);

  return (
    <div className="relative h-full w-full overflow-hidden bg-navy-900/40 p-5">
      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-baseline justify-between">
          <p className="font-mono text-[8.5px] uppercase tracking-metadata text-beige-500">
            Predictive logistics pipeline
          </p>
          <motion.p
            className="font-mono text-[8.5px] uppercase tracking-wide2 text-gold"
            animate={{ opacity: active ? 1 : 0 }}
            transition={{ duration: 0.5, delay: d(1.15) }}
          >
            JSON out
          </motion.p>
        </div>

        <svg viewBox="0 0 320 150" className="mt-2 w-full flex-1" preserveAspectRatio="none" aria-hidden>
          {/* connectors */}
          {NODE_X.slice(0, -1).map((x, i) => (
            <motion.line
              key={`c${i}`}
              x1={x + 14}
              y1={NODE_Y}
              x2={NODE_X[i + 1] - 14}
              y2={NODE_Y}
              stroke="rgba(232,222,200,0.25)"
              strokeWidth="1"
              initial={false}
              animate={{ pathLength: active ? 1 : 0 }}
              transition={{ duration: d(0.45), delay: d(0.2 + i * 0.22), ease: EASE_EDITORIAL }}
            />
          ))}

          {/* packets travelling the pipeline, staggered and looping */}
          {active &&
            !reduced &&
            [0, 1, 2].map((k) => (
              <motion.rect
                key={`p${k}`}
                width="5"
                height="5"
                y={NODE_Y - 2.5}
                fill="#D8C08A"
                initial={{ x: NODE_X[0] }}
                animate={{ x: [NODE_X[0], NODE_X[3]], opacity: [0, 1, 1, 0] }}
                transition={{
                  duration: 2.6,
                  delay: 1 + k * 0.75,
                  repeat: Infinity,
                  repeatDelay: 0.4,
                  ease: 'linear',
                  times: [0, 0.1, 0.85, 1],
                }}
              />
            ))}

          {/* stage nodes */}
          {NODE_X.map((x, i) => (
            <motion.g
              key={`n${i}`}
              initial={false}
              animate={{ opacity: active ? 1 : 0.25 }}
              transition={{ duration: d(0.45), delay: d(0.12 + i * 0.2) }}
            >
              <rect
                x={x - 14}
                y={NODE_Y - 14}
                width="28"
                height="28"
                fill="rgba(5,11,20,0.9)"
                stroke={i === 2 ? '#D8C08A' : 'rgba(232,222,200,0.4)'}
                strokeWidth="1"
              />
              <text
                x={x}
                y={NODE_Y + 30}
                textAnchor="middle"
                fill="rgba(232,222,200,0.55)"
                style={{ font: '7px ui-monospace, monospace', letterSpacing: '0.1em' }}
              >
                {STAGES[i].toUpperCase()}
              </text>
            </motion.g>
          ))}

          {/* demand trend drawing underneath */}
          <motion.polyline
            points={TREND.map((p) => p.join(',')).join(' ')}
            fill="none"
            stroke="rgba(232,222,200,0.4)"
            strokeWidth="1.1"
            initial={false}
            animate={{ pathLength: active ? 1 : 0, opacity: active ? 1 : 0 }}
            transition={{ duration: d(1.2), delay: d(0.85), ease: EASE_EDITORIAL }}
          />
        </svg>

        {/* shortage scorer */}
        <div className="mt-2">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[8.5px] uppercase tracking-wide2 text-beige-400">
              Shortage risk · localized scorer
            </span>
            <motion.span
              className="flex items-center gap-1.5 font-mono text-[8.5px] uppercase tracking-wide2 text-beige-100"
              animate={{ opacity: active ? 1 : 0 }}
              transition={{ duration: 0.5, delay: d(1.35) }}
            >
              <motion.span
                className="block size-1.5 rounded-full bg-gold"
                animate={
                  active && !reduced
                    ? {
                        boxShadow: [
                          '0 0 0px rgba(216,192,138,.9)',
                          '0 0 8px rgba(216,192,138,.9)',
                          '0 0 0px rgba(216,192,138,.9)',
                        ],
                      }
                    : {}
                }
                transition={{ duration: 2.1, repeat: active && !reduced ? Infinity : 0 }}
              />
              Flagged
            </motion.span>
          </div>
          <div className="mt-1.5 h-[3px] w-full overflow-hidden bg-beige-200/10">
            <motion.div
              className="h-full bg-gradient-to-r from-beige-300/70 to-gold"
              initial={false}
              animate={{ width: active ? '68%' : '0%' }}
              transition={{ duration: d(1), delay: d(1.1), ease: EASE_EDITORIAL }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
