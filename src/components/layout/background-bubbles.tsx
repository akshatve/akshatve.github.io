'use client';

import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '@/hooks/use-media-query';

/**
 * Site-wide bubble field.
 *
 * Fixed behind the page: `z-0` sits under <main> (`z-[1]`), and the layer is
 * `pointer-events-none`, so it can never cover content or intercept a click.
 *
 * Each bubble drifts upward continuously and is additionally offset by scroll
 * position at its own depth factor, so scrolling parallaxes the field rather
 * than dragging it rigidly with the page.
 *
 * Canvas rather than DOM: ~30 soft radial gradients are one paint per frame
 * instead of thirty blurred layers, which is the difference between smooth and
 * janky on a long scrolling page.
 */

const COUNT = 30;

/** Deterministic PRNG so the field is identical on every load. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

interface Bubble {
  x: number; // 0..1 of width
  y: number; // px, wraps over an extended span
  r: number;
  rise: number; // px per frame
  depth: number; // parallax factor
  sway: number; // horizontal wobble amplitude
  phase: number;
  alpha: number;
}

export function BackgroundBubbles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let running = true;
    let w = 0;
    let h = 0;
    let span = 0;
    let bubbles: Bubble[] = [];

    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      span = h * 1.6; // vertical wrap distance
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const rand = rng(20260817);
      bubbles = Array.from({ length: COUNT }, () => {
        const depth = 0.06 + rand() * 0.3; // near bubbles parallax more
        return {
          x: rand(),
          y: rand() * span,
          r: 14 + rand() * 86,
          rise: 0.09 + rand() * 0.24,
          depth,
          sway: 8 + rand() * 26,
          phase: rand() * Math.PI * 2,
          alpha: 0.05 + rand() * 0.09,
        };
      });
    };

    const drawBubble = (b: Bubble, x: number, y: number) => {
      // rim-lit sphere: hollow centre, beige edge, faint gold just inside it
      const g = ctx.createRadialGradient(x, y, b.r * 0.2, x, y, b.r);
      g.addColorStop(0, 'rgba(232,222,200,0)');
      g.addColorStop(0.72, `rgba(232,222,200,${b.alpha * 0.28})`);
      g.addColorStop(0.93, `rgba(216,192,138,${b.alpha * 1.15})`);
      g.addColorStop(1, 'rgba(232,222,200,0)');

      ctx.beginPath();
      ctx.fillStyle = g;
      ctx.arc(x, y, b.r, 0, Math.PI * 2);
      ctx.fill();

      // specular highlight, upper-left
      ctx.beginPath();
      ctx.fillStyle = `rgba(243,236,220,${b.alpha * 0.9})`;
      ctx.arc(x - b.r * 0.34, y - b.r * 0.36, Math.max(0.8, b.r * 0.055), 0, Math.PI * 2);
      ctx.fill();
    };

    const frame = (now: number) => {
      const scrollY = window.scrollY || 0;
      ctx.clearRect(0, 0, w, h);

      for (const b of bubbles) {
        if (!reduced) b.y -= b.rise;
        // wrap through an extended span so bubbles re-enter from below
        let y = b.y - scrollY * b.depth;
        y = ((y % span) + span) % span;
        y -= (span - h) / 2;

        const x = b.x * w + Math.sin(now / 3400 + b.phase) * b.sway;

        // skip anything comfortably outside the viewport
        if (y < -b.r - 20 || y > h + b.r + 20) continue;
        drawBubble(b, x, y);
      }

      if (running) raf = requestAnimationFrame(frame);
    };

    build();

    if (reduced) {
      // one static frame — the texture stays, the motion doesn't
      running = false;
      frame(0);
      return;
    }

    raf = requestAnimationFrame(frame);

    const start = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const onResize = () => build();
    const onVisibility = () => (document.hidden ? stop() : start());

    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stop();
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [reduced]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      // z-0 keeps it under <main> (z-[1]); pointer-events-none means it can
      // never swallow a click even if a stacking context changes later.
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
    />
  );
}
