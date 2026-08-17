'use client';

import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '@/hooks/use-media-query';

/**
 * Interactive panel for the Fake News Classifier.
 *
 * An embedding space: article points start scattered, then migrate into two
 * lobes as a decision boundary sweeps in. Points that land near the boundary
 * stay gold and keep drifting — the calibrated-uncertainty band. That is the
 * point the description makes ("non-binary credibility assessments over false
 * certainty"), so the visual argues it rather than drawing bar charts.
 *
 * Canvas rather than DOM nodes: ~90 points animating at once is one paint
 * instead of ninety layers. Deterministic seeding, so it never depends on
 * render-time randomness.
 */

const COUNT = 90;
const SETTLE_MS = 1800;

/** Small deterministic PRNG — stable output, no hydration surprises. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export function FakeNewsVisual({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    let start = performance.now();

    type P = {
      sx: number; sy: number;   // scattered origin
      tx: number; ty: number;   // settled target
      amb: boolean;             // sits in the uncertainty band
      ph: number;               // drift phase
      r: number;
    };
    let pts: P[] = [];

    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const rand = rng(20260815);
      const plotH = h * 0.62;
      pts = Array.from({ length: COUNT }, () => {
        const side = rand() < 0.5 ? -1 : 1;
        // ~14% land in the ambiguous band straddling the boundary
        const amb = rand() < 0.14;
        const spreadX = amb ? 0.05 : 0.15;
        const cx = amb ? 0.5 : 0.5 + side * 0.21;
        return {
          sx: rand() * w,
          sy: 18 + rand() * plotH,
          tx: (cx + (rand() - 0.5) * spreadX) * w,
          ty: 18 + (0.2 + rand() * 0.6) * plotH,
          amb,
          ph: rand() * Math.PI * 2,
          r: rand() < 0.12 ? 2.1 : 1.35,
        };
      });
    };

    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

    const draw = (now: number) => {
      const raw = active ? Math.min(1, (now - start) / SETTLE_MS) : 0;
      const t = reduced ? (active ? 1 : 0) : easeOut(raw);
      const plotH = h * 0.62;
      const boundaryX = w * 0.5;

      ctx.clearRect(0, 0, w, h);

      // uncertainty band — widens as the boundary resolves
      const bandW = 26 * t;
      ctx.fillStyle = 'rgba(216,192,138,0.07)';
      ctx.fillRect(boundaryX - bandW, 10, bandW * 2, plotH + 14);

      // decision boundary, drawing downward
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.moveTo(boundaryX, 10);
      ctx.lineTo(boundaryX, 10 + (plotH + 14) * t);
      ctx.strokeStyle = 'rgba(216,192,138,0.75)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);

      // article points migrating from scatter to their cluster
      for (const p of pts) {
        // ambiguous points never fully settle — they keep drifting
        const drift = p.amb && !reduced ? Math.sin(now / 900 + p.ph) * 5 * t : 0;
        const x = p.sx + (p.tx - p.sx) * t + drift;
        const y = p.sy + (p.ty - p.sy) * t;

        ctx.beginPath();
        ctx.fillStyle = p.amb
          ? `rgba(216,192,138,${0.35 + 0.5 * t})`
          : `rgba(232,222,200,${0.16 + 0.4 * t})`;
        ctx.arc(x, y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // calibrated probability density along the bottom
      const baseY = h - 12;
      ctx.beginPath();
      for (let i = 0; i <= 60; i += 1) {
        const px = (i / 60) * w;
        const u = i / 60;
        // two lobes plus a shallow trough — a soft distribution, not a verdict
        const lobe =
          Math.exp(-Math.pow((u - 0.29) / 0.13, 2)) +
          Math.exp(-Math.pow((u - 0.71) / 0.13, 2)) * 0.92;
        const py = baseY - lobe * 26 * t;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = `rgba(232,222,200,${0.45 * t})`;
      ctx.lineWidth = 1.1;
      ctx.stroke();

      raf = requestAnimationFrame(draw);
    };

    build();
    start = performance.now();
    raf = requestAnimationFrame(draw);

    const onResize = () => {
      build();
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

      {/* labels sit above the canvas */}
      <div className="pointer-events-none relative flex h-full flex-col justify-between p-5">
        <div className="flex items-baseline justify-between">
          <p className="font-mono text-[8.5px] uppercase tracking-metadata text-beige-500">
            Embedding space · ~44K articles
          </p>
          <p className="font-mono text-[8.5px] uppercase tracking-wide2 text-gold">
            Calibrated
          </p>
        </div>

        <div className="flex items-end justify-between">
          <span className="font-mono text-[8px] uppercase tracking-wide2 text-beige-400">
            Credible
          </span>
          <span className="font-mono text-[8px] uppercase tracking-wide2 text-gold">
            Uncertain
          </span>
          <span className="font-mono text-[8px] uppercase tracking-wide2 text-beige-400">
            Suspect
          </span>
        </div>
      </div>
    </div>
  );
}
