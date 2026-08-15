'use client';

import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '@/hooks/use-media-query';

/**
 * Slow drifting point field behind the hero — abstract decoration, not data.
 *
 * Canvas rather than DOM nodes so a few hundred points cost one paint instead
 * of hundreds of layers. The loop pauses whenever the hero leaves the viewport
 * or the tab is hidden, so it never burns cycles off-screen.
 */
export function HeroField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let running = true;
    let width = 0;
    let height = 0;

    const points: { x: number; y: number; vy: number; r: number; a: number }[] = [];

    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Density scales with area so large screens don't look sparse.
      const count = Math.min(180, Math.round((width * height) / 11000));
      points.length = 0;
      for (let i = 0; i < count; i += 1) {
        points.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vy: 0.05 + Math.random() * 0.16,
          r: Math.random() < 0.12 ? 1.6 : 0.9,
          a: 0.1 + Math.random() * 0.32,
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      for (const p of points) {
        p.y -= p.vy;
        if (p.y < -4) {
          p.y = height + 4;
          p.x = Math.random() * width;
        }
        ctx.beginPath();
        ctx.fillStyle = `rgba(232, 222, 200, ${p.a})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (running) raf = requestAnimationFrame(draw);
    };

    const start = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(draw);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    build();

    if (reduced) {
      // Render a single static frame — the texture stays, the motion doesn't.
      running = false;
      for (const p of points) {
        ctx.beginPath();
        ctx.fillStyle = `rgba(232, 222, 200, ${p.a})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }

    raf = requestAnimationFrame(draw);

    const onResize = () => build();
    const onVisibility = () => (document.hidden ? stop() : start());

    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { threshold: 0 },
    );
    io.observe(canvas);

    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stop();
      io.disconnect();
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [reduced]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full opacity-70"
    />
  );
}
