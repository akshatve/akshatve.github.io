'use client';

import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '@/hooks/use-media-query';

/**
 * Perspective data corridor behind the whole page.
 *
 * Panels, dots and streaks live in a simple 3D space and are projected through
 * a pinhole camera, so everything converges on a vanishing point at the centre
 * and drifts toward the viewer. Scroll adds to the travel, so the corridor
 * moves as the page moves.
 *
 * Fixed at `z-0` — under <main> (`z-[1]`) — and `pointer-events-none`, so it
 * can never cover content or swallow a click.
 *
 * Canvas, not DOM: a few hundred projected primitives per frame is one paint.
 */

const PANELS = 34;
const DOTS = 90;
const STREAKS = 62;

const FOCAL = 520;
const Z_NEAR = 60;
const Z_FAR = 1500;
const SPREAD = 1500;

const INK = '232,222,200';
const GOLD = '216,192,138';

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

interface Panel {
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  gridded: boolean;
  gold: boolean;
}
interface Dot {
  x: number;
  y: number;
  z: number;
  gold: boolean;
}
interface Streak {
  x: number;
  y: number;
  z: number;
  len: number;
}

export function DataField() {
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
    let travel = 0;

    let panels: Panel[] = [];
    let dots: Dot[] = [];
    let streaks: Streak[] = [];

    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const rand = rng(20260818);
      const pos = () => (rand() - 0.5) * SPREAD;

      panels = Array.from({ length: PANELS }, () => ({
        x: pos(),
        y: pos() * 0.62,
        z: Z_NEAR + rand() * (Z_FAR - Z_NEAR),
        w: 60 + rand() * 150,
        h: 60 + rand() * 150,
        gridded: rand() < 0.42,
        gold: rand() < 0.16,
      }));

      dots = Array.from({ length: DOTS }, () => ({
        x: pos(),
        y: pos() * 0.62,
        z: Z_NEAR + rand() * (Z_FAR - Z_NEAR),
        gold: rand() < 0.2,
      }));

      streaks = Array.from({ length: STREAKS }, () => ({
        x: pos(),
        y: pos() * 0.62,
        z: Z_NEAR + rand() * (Z_FAR - Z_NEAR),
        len: 420 + rand() * 900,
      }));
    };

    /** Depth fade: invisible at the far plane, dimming again very close. */
    const depthAlpha = (z: number) => {
      const far = 1 - Math.min(1, Math.max(0, (z - Z_FAR * 0.55) / (Z_FAR * 0.45)));
      const near = Math.min(1, Math.max(0, (z - Z_NEAR) / 160));
      return far * near;
    };

    const frame = () => {
      const cx = w / 2;
      const cy = h * 0.46; // vanishing point sits slightly above centre
      const scrollY = window.scrollY || 0;
      // scroll pushes the camera forward on top of the constant drift
      const t = travel + scrollY * 0.35;

      ctx.clearRect(0, 0, w, h);

      // soft glow at the vanishing point
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.42);
      glow.addColorStop(0, `rgba(${INK},0.10)`);
      glow.addColorStop(1, `rgba(${INK},0)`);
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      const zOf = (base: number) => {
        const span = Z_FAR - Z_NEAR;
        return Z_NEAR + (((base - t) % span) + span) % span;
      };

      // ── streaks: radial lines converging on the vanishing point ──
      for (const s of streaks) {
        const z1 = zOf(s.z);
        const z2 = z1 + s.len;
        if (z2 > Z_FAR) continue;
        const a = depthAlpha(z1) * 0.9;
        if (a <= 0.01) continue;

        const x1 = cx + (s.x * FOCAL) / z1;
        const y1 = cy + (s.y * FOCAL) / z1;
        const x2 = cx + (s.x * FOCAL) / z2;
        const y2 = cy + (s.y * FOCAL) / z2;

        const g = ctx.createLinearGradient(x1, y1, x2, y2);
        g.addColorStop(0, `rgba(${INK},${a})`);
        g.addColorStop(1, `rgba(${INK},0)`);
        ctx.strokeStyle = g;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // ── panels: far to near so nearer ones sit on top ──
      const drawn = panels
        .map((p) => ({ p, z: zOf(p.z) }))
        .sort((a, b) => b.z - a.z);

      for (const { p, z } of drawn) {
        const a = depthAlpha(z);
        if (a <= 0.01) continue;

        const k = FOCAL / z;
        const px = cx + p.x * k;
        const py = cy + p.y * k;
        const pw = p.w * k;
        const ph = p.h * k;
        if (pw < 2 || px + pw < 0 || px - pw > w || py + ph < 0 || py - ph > h) continue;

        const tint = p.gold ? GOLD : INK;

        ctx.fillStyle = `rgba(${tint},${a * 0.05})`;
        ctx.fillRect(px - pw / 2, py - ph / 2, pw, ph);
        ctx.strokeStyle = `rgba(${tint},${a * 0.3})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(px - pw / 2, py - ph / 2, pw, ph);

        // dot-matrix texture on some panels, like the reference
        if (p.gridded && pw > 26) {
          const step = Math.max(5, pw / 9);
          ctx.fillStyle = `rgba(${tint},${a * 0.34})`;
          for (let gx = px - pw / 2 + step / 2; gx < px + pw / 2; gx += step) {
            for (let gy = py - ph / 2 + step / 2; gy < py + ph / 2; gy += step) {
              ctx.fillRect(gx, gy, 1.2, 1.2);
            }
          }
        }
      }

      // ── dots ──
      for (const d of dots) {
        const z = zOf(d.z);
        const a = depthAlpha(z);
        if (a <= 0.02) continue;
        const k = FOCAL / z;
        const x = cx + d.x * k;
        const y = cy + d.y * k;
        if (x < -8 || x > w + 8 || y < -8 || y > h + 8) continue;

        ctx.beginPath();
        ctx.fillStyle = d.gold ? `rgba(${GOLD},${a * 0.85})` : `rgba(${INK},${a * 0.6})`;
        ctx.arc(x, y, Math.min(2.6, 0.6 + k * 1.6), 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reduced) travel += 0.85;
      if (running) raf = requestAnimationFrame(frame);
    };

    build();

    if (reduced) {
      running = false;
      frame();
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
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
    />
  );
}
