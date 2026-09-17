'use client';

import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { EASE_EDITORIAL } from '@/lib/utils';
import { usePrefersReducedMotion } from '@/hooks/use-media-query';

/**
 * Interactive panel for GoodsFlow.
 *
 * A localized shortage map: a grid of locations sweeps in, each cell shaded by
 * its shortage score, with the seeded edge cases outlined. A focus ring then
 * steps between flagged locations — for each one the demand trend analyzer
 * draws its history and a dashed forecast, and the emitted JSON record types
 * out for the downstream dashboards.
 *
 * Decorative. Scores, trends and location codes come from a fixed seed; the
 * résumé states no values, so nothing here asserts a result.
 */

const COLS = 10;
const ROWS = 5;
const CELL = 16;
const GAP = 3;
const GRID_W = COLS * (CELL + GAP) - GAP;
const GRID_H = ROWS * (CELL + GAP) - GAP;

/** Cells seeded as edge cases (index = row * COLS + col). */
const SEEDED = new Set([7, 21, 42]);

/**
 * Flagged cells the focus ring visits, in order. Chosen by hand from the seeded
 * layout so the ring crosses the whole grid and lands on every edge case.
 */
const FOCUS_ORDER = [7, 38, 21, 16, 42, 45];

const FOCUS_MS = 2600;

/** Deterministic PRNG — identical output every render, no hydration risk. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

interface Cell {
  i: number;
  col: number;
  row: number;
  risk: number; // 0..1
  seeded: boolean;
}

function buildCells(): Cell[] {
  const rand = rng(20260404);
  return Array.from({ length: COLS * ROWS }, (_, i) => {
    const seeded = SEEDED.has(i);
    // most locations sit low; a handful run hot
    const base = Math.pow(rand(), 2.2);
    return {
      i,
      col: i % COLS,
      row: Math.floor(i / COLS),
      risk: seeded ? 0.95 : base,
      seeded,
    };
  });
}

/** Demand history + forecast for one location, in a 120×64 box. */
function buildTrend(cell: Cell) {
  const rand = rng(1000 + cell.i * 7919);
  const n = 9;
  const rising = cell.risk > 0.55;
  let v = 0.35 + rand() * 0.2;
  const ys = Array.from({ length: n }, (_, k) => {
    if (k > 0) v += (rising ? 0.05 : -0.01) + (rand() - 0.5) * 0.12;
    v = Math.max(0.08, Math.min(0.94, v));
    return v;
  });
  const pts = ys.map((y, k) => [4 + (k * 112) / (n - 1), 60 - y * 52] as const);
  const toPath = (p: readonly (readonly [number, number])[]) =>
    p.map(([x, y], k) => `${k ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  return {
    history: toPath(pts.slice(0, 6)),
    forecast: toPath(pts.slice(5)),
    end: pts[n - 1],
    rising,
  };
}

const locationCode = (c: Cell) => `R${c.row + 1}-${String(c.col + 1).padStart(2, '0')}`;

function cellFill(c: Cell) {
  if (c.risk > 0.7) return 'rgba(216,192,138,0.85)';
  if (c.risk > 0.4) return 'rgba(216,192,138,0.35)';
  if (c.risk > 0.18) return 'rgba(232,222,200,0.16)';
  return 'rgba(232,222,200,0.07)';
}

export function FlowVisual({ active }: { active: boolean }) {
  const reduced = usePrefersReducedMotion();
  const d = (s: number) => (reduced ? 0 : s);

  const cells = useMemo(buildCells, []);
  const focusList = useMemo(() => FOCUS_ORDER.map((i) => cells[i]), [cells]);
  const [f, setF] = useState(0);

  useEffect(() => {
    if (!active || reduced) return;
    const id = window.setTimeout(
      () => setF((n) => (n + 1) % focusList.length),
      f === 0 ? FOCUS_MS + 900 : FOCUS_MS,
    );
    return () => window.clearTimeout(id);
  }, [active, reduced, f, focusList.length]);

  const focus = focusList[f];
  const trend = useMemo(() => buildTrend(focus), [focus]);
  const fx = focus.col * (CELL + GAP);
  const fy = focus.row * (CELL + GAP);

  const json = `{"loc":"${locationCode(focus)}","risk":"high","trend":"${
    trend.rising ? 'up' : 'down'
  }"${focus.seeded ? ',"seeded":true' : ''}}`;

  return (
    <div className="relative h-full w-full overflow-hidden bg-navy-900/40 p-5">
      <div className="flex h-full flex-col">
        <div className="flex items-baseline justify-between">
          <p className="font-mono text-[8.5px] uppercase tracking-metadata text-beige-500">
            Localized shortage scorer
          </p>
          <p className="font-mono text-[8.5px] uppercase tracking-wide2 text-gold">
            JSON → dashboards
          </p>
        </div>

        <div className="mt-3 grid min-h-0 flex-1 grid-cols-12 gap-5">
          {/* ── location grid ── */}
          <div className="col-span-7 flex min-h-0 flex-col">
            <svg
              viewBox={`-3 -3 ${GRID_W + 6} ${GRID_H + 6}`}
              className="min-h-0 w-full flex-1"
              aria-hidden
            >
              {cells.map((c) => (
                <motion.rect
                  key={c.i}
                  x={c.col * (CELL + GAP)}
                  y={c.row * (CELL + GAP)}
                  width={CELL}
                  height={CELL}
                  fill={cellFill(c)}
                  stroke={c.seeded ? 'rgba(243,236,220,0.75)' : 'none'}
                  strokeWidth={c.seeded ? 0.8 : 0}
                  strokeDasharray={c.seeded ? '2 1.5' : undefined}
                  initial={false}
                  animate={{ opacity: active ? 1 : 0 }}
                  // column-by-column sweep, rows offset slightly
                  transition={{ duration: d(0.35), delay: d(0.1 + c.col * 0.07 + c.row * 0.02) }}
                />
              ))}

              {/* sweep line */}
              {active && !reduced && (
                <motion.line
                  y1={-3}
                  y2={GRID_H + 3}
                  stroke="#D8C08A"
                  strokeWidth="0.8"
                  initial={{ x1: -2, x2: -2, opacity: 1 }}
                  animate={{ x1: GRID_W + 2, x2: GRID_W + 2, opacity: [1, 1, 0] }}
                  transition={{ duration: 0.85, delay: 0.1, ease: 'linear' }}
                />
              )}

              {/* focus ring */}
              <motion.rect
                width={CELL + 5}
                height={CELL + 5}
                fill="none"
                stroke="#D8C08A"
                strokeWidth="1"
                initial={{ x: fx - 2.5, y: fy - 2.5, opacity: 0 }}
                animate={{ x: fx - 2.5, y: fy - 2.5, opacity: active ? 1 : 0 }}
                transition={{
                  x: { duration: d(0.7), ease: EASE_EDITORIAL },
                  y: { duration: d(0.7), ease: EASE_EDITORIAL },
                  opacity: { duration: d(0.4), delay: d(0.95) },
                }}
              />
            </svg>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[7.5px] uppercase tracking-wide2 text-beige-500">
              <span className="flex items-center gap-1">
                <span className="block size-2 bg-beige-200/15" /> Low
              </span>
              <span className="flex items-center gap-1">
                <span className="block size-2 bg-gold/35" /> Elevated
              </span>
              <span className="flex items-center gap-1">
                <span className="block size-2 bg-gold/85" /> Shortage
              </span>
              <span className="flex items-center gap-1">
                <span className="block size-2 border border-dashed border-beige-100/75" /> Seeded
                edge case
              </span>
            </div>
          </div>

          {/* ── demand trend for the focused location ── */}
          <div className="col-span-5 flex min-h-0 flex-col">
            <p className="font-mono text-[8px] uppercase tracking-wide2 text-beige-500">
              Demand trend
            </p>
            <svg viewBox="0 0 120 64" className="mt-1 min-h-0 w-full flex-1" aria-hidden>
              {[12, 36, 60].map((y) => (
                <line key={y} x1="0" x2="120" y1={y} y2={y} stroke="rgba(232,222,200,0.06)" />
              ))}
              {/* history / forecast divider */}
              <line
                x1="74"
                x2="74"
                y1="4"
                y2="62"
                stroke="rgba(232,222,200,0.18)"
                strokeDasharray="1.5 2"
              />
              <g key={focus.i}>
                <motion.path
                  d={trend.history}
                  fill="none"
                  stroke="rgba(243,236,220,0.8)"
                  strokeWidth="1.1"
                  initial={{ pathLength: reduced ? 1 : 0 }}
                  animate={{ pathLength: active ? 1 : 0 }}
                  transition={{ duration: d(0.8), delay: d(f === 0 ? 1 : 0.15), ease: EASE_EDITORIAL }}
                />
                <motion.path
                  d={trend.forecast}
                  fill="none"
                  stroke="#D8C08A"
                  strokeWidth="1.2"
                  strokeDasharray="3 2"
                  initial={{ opacity: reduced ? 1 : 0 }}
                  animate={{ opacity: active ? 1 : 0 }}
                  transition={{ duration: d(0.5), delay: d(f === 0 ? 1.7 : 0.85) }}
                />
                <motion.circle
                  cx={trend.end[0]}
                  cy={trend.end[1]}
                  r="2.2"
                  fill="#D8C08A"
                  initial={{ opacity: reduced ? 1 : 0 }}
                  animate={{ opacity: active ? 1 : 0 }}
                  transition={{ duration: d(0.4), delay: d(f === 0 ? 2 : 1.15) }}
                />
              </g>
            </svg>
            <div className="mt-1 flex justify-between font-mono text-[7.5px] uppercase tracking-wide2 text-beige-500">
              <span>History</span>
              <span className="text-gold">Forecast</span>
            </div>
          </div>
        </div>

        {/* ── emitted JSON record ── */}
        <div className="mt-3 flex items-center gap-3 border-t border-beige-200/10 pt-2.5">
          <span className="shrink-0 font-mono text-[7.5px] uppercase tracking-wide2 text-beige-500">
            Emit
          </span>
          <div className="min-w-0 flex-1 overflow-hidden">
            <motion.p
              key={json}
              className="overflow-hidden whitespace-nowrap font-mono text-[9px] text-beige-200"
              initial={{ width: reduced ? '100%' : '0%' }}
              animate={{ width: active ? '100%' : '0%' }}
              transition={{
                duration: d(0.9),
                delay: d(f === 0 ? 1.9 : 1),
                ease: 'linear',
              }}
            >
              {json}
            </motion.p>
          </div>
        </div>
      </div>
    </div>
  );
}
