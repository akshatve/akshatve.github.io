'use client';

import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '@/hooks/use-media-query';

/**
 * Occasional shooting stars behind the hero.
 *
 * Each star streaks from the upper right toward the lower left with a tapering
 * beige tail and a faint gold head, then fades. They are deliberately sparse —
 * one every second or two, never more than a few at once — so the hero stays
 * calm and the name stays the focus.
 *
 * Motion is time-based rather than per-frame, so speed is identical on 60Hz
 * and 120Hz displays and a dropped frame doesn't make a star jump.
 *
 * The loop pauses when the hero leaves the viewport or the tab is hidden, and
 * the component renders nothing for visitors who prefer reduced motion.
 */

interface Star {
  x: number;
  y: number;
  vx: number; // px / s
  vy: number;
  tail: number; // px
  age: number; // s
  life: number; // s
  width: number;
}

const MAX_STARS = 3;

export function ShootingStars() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let running = false;
    let visible = true;
    let w = 0;
    let h = 0;
    let last = 0;
    let nextSpawn = 0.6; // first star shortly after load
    const stars: Star[] = [];

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const spawn = () => {
      // Start along the top edge or the upper part of the right edge, so the
      // streak crosses the frame rather than appearing mid-air.
      const fromTop = Math.random() < 0.65;
      const x = fromTop ? w * (0.3 + Math.random() * 0.75) : w + 20;
      const y = fromTop ? -20 : h * Math.random() * 0.45;

      // Down-left, with a little variance in angle.
      const angle = (205 + Math.random() * 20) * (Math.PI / 180);
      const speed = 620 + Math.random() * 480;

      stars.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: -Math.sin(angle) * speed,
        tail: 90 + Math.random() * 130,
        age: 0,
        life: 0.9 + Math.random() * 0.8,
        width: 0.9 + Math.random() * 0.8,
      });
    };

    const draw = (dt: number) => {
      ctx.clearRect(0, 0, w, h);

      for (let i = stars.length - 1; i >= 0; i -= 1) {
        const s = stars[i];
        s.age += dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;

        const t = s.age / s.life;
        if (t >= 1 || s.x < -300 || s.y > h + 300) {
          stars.splice(i, 1);
          continue;
        }

        // Quick fade in, long fade out.
        const alpha = t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85;

        const speed = Math.hypot(s.vx, s.vy);
        const tx = s.x - (s.vx / speed) * s.tail;
        const ty = s.y - (s.vy / speed) * s.tail;

        const grad = ctx.createLinearGradient(s.x, s.y, tx, ty);
        grad.addColorStop(0, `rgba(243, 236, 220, ${0.85 * alpha})`);
        grad.addColorStop(0.35, `rgba(216, 192, 138, ${0.35 * alpha})`);
        grad.addColorStop(1, 'rgba(216, 192, 138, 0)');

        ctx.strokeStyle = grad;
        ctx.lineWidth = s.width;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(tx, ty);
        ctx.stroke();

        // Soft glowing head.
        const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 5);
        glow.addColorStop(0, `rgba(243, 236, 220, ${0.9 * alpha})`);
        glow.addColorStop(1, 'rgba(216, 192, 138, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const frame = (now: number) => {
      // Clamp dt: after a paused tab resumes, a huge dt would teleport stars.
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;

      nextSpawn -= dt;
      if (nextSpawn <= 0) {
        if (stars.length < MAX_STARS) spawn();
        nextSpawn = 0.9 + Math.random() * 1.7;
      }

      draw(dt);
      if (running) raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (running || !visible || document.hidden) return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    size();
    start();

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) start();
        else stop();
      },
      { threshold: 0 },
    );
    io.observe(canvas);

    const onVisibility = () => (document.hidden ? stop() : start());
    window.addEventListener('resize', size);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stop();
      io.disconnect();
      window.removeEventListener('resize', size);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [reduced]);

  if (reduced) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
