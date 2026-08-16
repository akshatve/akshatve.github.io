'use client';

import { motion } from 'framer-motion';
import { EASE_EDITORIAL } from '@/lib/utils';
import { usePrefersReducedMotion } from '@/hooks/use-media-query';

/**
 * Interactive panel for the Applied Financial Analytics project.
 *
 * On activation: an OLS trendline writes itself across the plot, a confidence
 * band fades outward around it, and the statistical readouts label in.
 *
 * DELIBERATELY NUMBER-FREE. The description names R², t-statistics, p-values
 * and 3-year confidence intervals but states no values for them, so the panel
 * shows the *shape* of the analysis and labels the statistics without
 * asserting any result. Putting invented figures next to Akshat's name is
 * exactly the failure mode to avoid.
 */

const W = 320;
const H = 150;

/** Illustrative series shape — decorative geometry, not project data. */
const POINTS = [
  [14, 118], [45, 110], [76, 112], [107, 99], [138, 92],
  [169, 84], [200, 71], [231, 64], [262, 52], [293, 41],
] as const;

const FIT_START = { x: 14, y: 116 };
const FIT_END = { x: 293, y: 44 };

const READOUTS = ['R²', 't-stat', 'p-value', '3-yr CI'];

export function FinanceVisual({ active }: { active: boolean }) {
  const reduced = usePrefersReducedMotion();
  const d = (ms: number) => (reduced ? 0 : ms);

  return (
    <div className="relative h-full w-full overflow-hidden bg-navy-900/40 p-5">
      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-baseline justify-between">
          <p className="font-mono text-[8.5px] uppercase tracking-metadata text-beige-500">
            OLS trend · 2006–2025
          </p>
          <motion.p
            className="font-mono text-[8.5px] uppercase tracking-wide2 text-gold"
            animate={{ opacity: active ? 1 : 0 }}
            transition={{ duration: 0.5, delay: d(1.3) }}
          >
            Forecast →
          </motion.p>
        </div>

        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mt-3 w-full flex-1"
          preserveAspectRatio="none"
          aria-hidden
        >
          {/* plot grid */}
          <g stroke="rgba(232,222,200,0.08)" strokeWidth="0.6">
            {[0, 1, 2, 3].map((i) => (
              <line key={`h${i}`} x1="0" y1={20 + i * 36} x2={W} y2={20 + i * 36} />
            ))}
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <line key={`v${i}`} x1={14 + i * 56} y1="8" x2={14 + i * 56} y2={H - 8} />
            ))}
          </g>

          {/* confidence band — expands outward around the fit */}
          <motion.path
            d={`M ${FIT_START.x} ${FIT_START.y} L ${FIT_END.x} ${FIT_END.y} L ${FIT_END.x} ${FIT_END.y + 26} L ${FIT_START.x} ${FIT_START.y + 10} Z`}
            fill="rgba(216,192,138,0.10)"
            initial={false}
            animate={{ opacity: active ? 1 : 0, scaleY: active ? 1 : 0.2 }}
            style={{ transformOrigin: 'center' }}
            transition={{ duration: d(0.9), delay: d(0.95), ease: EASE_EDITORIAL }}
          />
          <motion.path
            d={`M ${FIT_START.x} ${FIT_START.y} L ${FIT_END.x} ${FIT_END.y} L ${FIT_END.x} ${FIT_END.y - 26} L ${FIT_START.x} ${FIT_START.y - 10} Z`}
            fill="rgba(216,192,138,0.10)"
            initial={false}
            animate={{ opacity: active ? 1 : 0, scaleY: active ? 1 : 0.2 }}
            style={{ transformOrigin: 'center' }}
            transition={{ duration: d(0.9), delay: d(0.95), ease: EASE_EDITORIAL }}
          />

          {/* observed series */}
          <motion.polyline
            points={POINTS.map((p) => p.join(',')).join(' ')}
            fill="none"
            stroke="rgba(232,222,200,0.35)"
            strokeWidth="1"
            initial={false}
            animate={{ pathLength: active ? 1 : 0, opacity: active ? 1 : 0 }}
            transition={{ duration: d(1.1), ease: EASE_EDITORIAL }}
          />

          {/* OLS fit — writes on after the series */}
          <motion.line
            x1={FIT_START.x}
            y1={FIT_START.y}
            x2={FIT_END.x}
            y2={FIT_END.y}
            stroke="#D8C08A"
            strokeWidth="1.4"
            initial={false}
            animate={{ pathLength: active ? 1 : 0 }}
            transition={{ duration: d(1), delay: d(0.55), ease: EASE_EDITORIAL }}
          />

          {/* forecast sweep — keeps the panel alive after the one-shot trace */}
          {active && !reduced && (
            <motion.rect
              y="6"
              width="1.5"
              height={H - 12}
              fill="rgba(216,192,138,0.5)"
              initial={{ x: 14 }}
              animate={{ x: [14, 300], opacity: [0, 0.85, 0.85, 0] }}
              transition={{
                duration: 2.8,
                delay: 1.6,
                repeat: Infinity,
                repeatDelay: 1.1,
                ease: 'linear',
                times: [0, 0.08, 0.9, 1],
              }}
            />
          )}

          {/* observation markers */}
          {POINTS.map(([x, y], i) => (
            <motion.circle
              key={i}
              cx={x}
              cy={y}
              r="1.8"
              fill="#E8DEC8"
              initial={false}
              animate={{ opacity: active ? 0.75 : 0 }}
              transition={{ duration: d(0.4), delay: d(0.1 + i * 0.05) }}
            />
          ))}
        </svg>

        {/* statistical readouts — labelled, deliberately without values */}
        <div className="mt-3 grid grid-cols-4 gap-2 border-t border-beige-200/10 pt-3">
          {READOUTS.map((label, i) => (
            <motion.div
              key={label}
              initial={false}
              animate={{ opacity: active ? 1 : 0.3, y: active ? 0 : 4 }}
              transition={{ duration: d(0.5), delay: d(1.2 + i * 0.08), ease: EASE_EDITORIAL }}
            >
              <p className="font-mono text-[10px] leading-none text-beige-100">{label}</p>
              <motion.span
                className="mt-2 block h-[2px] bg-gold/60"
                initial={false}
                animate={{ width: active ? '100%' : '0%' }}
                transition={{ duration: d(0.6), delay: d(1.25 + i * 0.08), ease: EASE_EDITORIAL }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
