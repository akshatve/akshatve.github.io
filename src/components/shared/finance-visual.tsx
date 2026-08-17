'use client';

import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '@/hooks/use-media-query';

/**
 * Interactive panel for the Applied Financial Analytics project.
 *
 * A box-and-whisker plot with jittered observations, one column per metric
 * named in the description. Points rain down and settle, then each box grows
 * outward from its median and the whiskers extend.
 *
 * DELIBERATELY UNLABELLED ON THE Y AXIS. The distributions are generated from
 * a fixed seed — decorative shape, not measurements. The description states no
 * values, so the panel shows the *kind* of analysis without asserting any
 * result.
 */

/** Metrics named in the project description. */
const GROUPS = ['Revenue', 'Net margin', 'ROA', 'ROE', 'EBITDA'];
const N = 56; // observations per column — dense enough to read as a strip
const SETTLE_MS = 1700;

/** Deterministic PRNG — identical output every render, no hydration risk. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

interface Column {
  vals: number[]; // 0..1, bottom-to-top
  q1: number;
  med: number;
  q3: number;
  lo: number;
  hi: number;
  jitter: number[];
}

function buildColumns(): Column[] {
  const rand = rng(20260816);
  return GROUPS.map((_, gi) => {
    // Heavily right-skewed: a tight bulk near the floor with a long tail, so
    // the box stays compact and the outliers stack into a visible column —
    // the shape a financial-ratio distribution actually takes.
    const tail = 0.62 + gi * 0.09;
    const base = 0.06 + (gi % 2) * 0.02;
    const pw = 6.2 - gi * 0.35;
    const vals = Array.from({ length: N }, () =>
      Math.min(0.96, base + Math.pow(rand(), pw) * tail),
    ).sort((a, b) => a - b);

    const at = (p: number) => vals[Math.floor(p * (vals.length - 1))];
    const q1 = at(0.25);
    const med = at(0.5);
    const q3 = at(0.75);
    const iqr = q3 - q1;

    return {
      vals,
      q1,
      med,
      q3,
      lo: Math.max(vals[0], q1 - 1.5 * iqr),
      hi: Math.min(vals[vals.length - 1], q3 + 1.5 * iqr),
      jitter: Array.from({ length: N }, () => (rand() * 2 - 1) * 0.55),
    };
  });
}

export function FinanceVisual({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cols = buildColumns();
    let raf = 0;
    let w = 0;
    let h = 0;
    let start = performance.now();

    const PAD_T = 26;
    const PAD_B = 26;

    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = canvas.getBoundingClientRect();
      w = r.width;
      h = r.height;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

    const draw = (now: number) => {
      const raw = active ? Math.min(1, (now - start) / SETTLE_MS) : 0;
      const T = reduced ? (active ? 1 : 0) : raw;

      const plotH = h - PAD_T - PAD_B;
      const yOf = (v: number) => PAD_T + plotH * (1 - v);
      const slot = w / GROUPS.length;
      const boxW = Math.min(38, slot * 0.42);

      ctx.clearRect(0, 0, w, h);

      // horizontal guides
      ctx.strokeStyle = 'rgba(232,222,200,0.06)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 3; i += 1) {
        const y = PAD_T + (plotH / 3) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      cols.forEach((c, gi) => {
        const cx = slot * (gi + 0.5);
        const focal = gi === 2; // one column carries the gold accent
        const gT = Math.max(0, Math.min(1, (T - gi * 0.07) / (1 - gi * 0.07 || 1)));
        const e = easeOut(gT);

        // ── jittered observations, raining down into place ──
        c.vals.forEach((v, i) => {
          const pT = Math.max(0, Math.min(1, (T * 1.25 - i / N) * 1.6));
          const pe = easeOut(pT);
          if (pe <= 0) return;

          const targetY = yOf(v);
          const y = -12 + (targetY + 12) * pe;

          // settled points breathe sideways very slightly
          const drift =
            pe > 0.98 && !reduced ? Math.sin(now / 1100 + i * 0.7 + gi) * 1.6 : 0;
          const x = cx + c.jitter[i] * (boxW * 0.62) + drift;

          const outlier = v > c.hi || v < c.lo;
          ctx.beginPath();
          ctx.fillStyle = outlier
            ? `rgba(216,192,138,${0.88 * pe})`
            : focal
              ? `rgba(216,192,138,${0.55 * pe})`
              : `rgba(232,222,200,${0.42 * pe})`;
          ctx.arc(x, y, outlier ? 2.8 : 2.5, 0, Math.PI * 2);
          ctx.fill();
        });

        if (e <= 0) return;

        // ── whiskers, extending from the median ──
        const medY = yOf(c.med);
        const capW = boxW * 0.42;
        ctx.strokeStyle = `rgba(232,222,200,${0.5 * e})`;
        ctx.lineWidth = 1;

        const hiY = medY + (yOf(c.hi) - medY) * e;
        const loY = medY + (yOf(c.lo) - medY) * e;
        ctx.beginPath();
        ctx.moveTo(cx, hiY);
        ctx.lineTo(cx, loY);
        ctx.moveTo(cx - capW, hiY);
        ctx.lineTo(cx + capW, hiY);
        ctx.moveTo(cx - capW, loY);
        ctx.lineTo(cx + capW, loY);
        ctx.stroke();

        // ── box, growing outward from the median ──
        const topY = medY + (yOf(c.q3) - medY) * e;
        const botY = medY + (yOf(c.q1) - medY) * e;
        ctx.fillStyle = focal
          ? `rgba(216,192,138,${0.17 * e})`
          : `rgba(232,222,200,${0.12 * e})`;
        ctx.fillRect(cx - boxW / 2, topY, boxW, botY - topY);
        ctx.strokeStyle = focal
          ? `rgba(216,192,138,${0.7 * e})`
          : `rgba(232,222,200,${0.5 * e})`;
        ctx.strokeRect(cx - boxW / 2, topY, boxW, botY - topY);

        // ── median ──
        ctx.beginPath();
        ctx.moveTo(cx - boxW / 2, medY);
        ctx.lineTo(cx + boxW / 2, medY);
        ctx.strokeStyle = focal ? `rgba(216,192,138,${e})` : `rgba(243,236,220,${0.85 * e})`;
        ctx.lineWidth = 1.6;
        ctx.stroke();

        // ── column label ──
        ctx.fillStyle = focal
          ? `rgba(216,192,138,${0.9 * e})`
          : `rgba(232,222,200,${0.45 * e})`;
        ctx.font = '7.5px ui-monospace, SFMono-Regular, Menlo, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(GROUPS[gi].toUpperCase(), cx, h - 10);
      });

      raf = requestAnimationFrame(draw);
    };

    fit();
    start = performance.now();
    raf = requestAnimationFrame(draw);

    const onResize = () => {
      fit();
      start = performance.now();
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, [active, reduced]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-navy-900/40">
      <canvas ref={canvasRef} aria-hidden className="absolute inset-0 h-full w-full" />

      <div className="pointer-events-none relative flex h-full flex-col justify-between p-4">
        <div className="flex items-baseline justify-between">
          <p className="font-mono text-[8.5px] uppercase tracking-metadata text-beige-500">
            Metric distributions · 2006–2025
          </p>
          <p className="font-mono text-[8.5px] uppercase tracking-wide2 text-gold">
            IQR · median
          </p>
        </div>
      </div>
    </div>
  );
}
