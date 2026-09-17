'use client';

import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '@/hooks/use-media-query';

/**
 * Interactive panel for GoodsFlow.
 *
 * A live supply network. Two hubs dispatch goods along curved routes to five
 * stores; each store's inventory ring drains with its own demand and refills
 * as packets arrive. When a ring falls under the threshold the store turns
 * gold and ripples — the shortage scorer firing — and the routes feeding it
 * brighten as dispatch shifts toward it. Every few seconds a seeded edge case
 * (a sudden demand spike) hits one store. Underneath, the demand trend scrolls
 * past a "now" line into a dashed forecast with a widening confidence band.
 *
 * Decorative. The simulation is a fixed-seed toy — the résumé states no
 * values, so nothing here asserts a result. Canvas so dozens of moving
 * packets cost one paint per frame.
 */

const GOLD = (a: number) => `rgba(216,192,138,${a})`;
const BEIGE = (a: number) => `rgba(232,222,200,${a})`;
const IVORY = (a: number) => `rgba(243,236,220,${a})`;
const MONO = '7px ui-monospace, SFMono-Regular, Menlo, monospace';

/** Hysteresis: a store turns short below ENTER and recovers above EXIT. */
const SHORT_ENTER = 0.25;
const SHORT_EXIT = 0.4;
const EDGE_EVERY = 6.5; // seconds between seeded edge cases
const EMIT_EVERY = 2.2; // seconds between JSON emits

/** Positions are fractions of the network area. */
const HUBS = [
  { x: 0.07, y: 0.26 },
  { x: 0.07, y: 0.78 },
];

const STORES = [
  { x: 0.5, y: 0.12, hubs: [0], base: 0.05, amp: 0.07, freq: 0.9, ph: 0.4 },
  { x: 0.7, y: 0.42, hubs: [0, 1], base: 0.06, amp: 0.08, freq: 0.6, ph: 2.1 },
  { x: 0.92, y: 0.16, hubs: [0], base: 0.045, amp: 0.06, freq: 1.1, ph: 4.2 },
  { x: 0.55, y: 0.86, hubs: [1], base: 0.05, amp: 0.08, freq: 0.75, ph: 1.2 },
  { x: 0.9, y: 0.76, hubs: [0, 1], base: 0.055, amp: 0.07, freq: 0.5, ph: 3.3 },
];

/** Deterministic PRNG — the toy plays out the same way every time. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

interface Pt {
  x: number;
  y: number;
}

function bezier(p0: Pt, c1: Pt, c2: Pt, p3: Pt, t: number): Pt {
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * p3.y,
  };
}

export function FlowVisual({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const emitRef = useRef<HTMLSpanElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !active) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rand = rng(20260404);

    // ── simulation state ──
    const routes = STORES.flatMap((s, si) => s.hubs.map((hi) => ({ si, hi, spawn: rand() })));
    const level = STORES.map(() => 0.55 + rand() * 0.35);
    const short = STORES.map(() => false);
    const edgeUntil = STORES.map(() => -1);
    let packets: { r: number; t: number; speed: number }[] = [];
    let time = 0;
    let nextEdge = 4.2;
    let edgeIdx = 0;
    let nextEmit = 3.2;

    const step = (dt: number) => {
      time += dt;

      STORES.forEach((s, i) => {
        const demand = s.base + s.amp * (0.5 + 0.5 * Math.sin(time * s.freq + s.ph));
        level[i] = Math.max(0, level[i] - demand * dt);
        short[i] = short[i] ? level[i] < SHORT_EXIT : level[i] < SHORT_ENTER;
      });

      // dispatch leans toward the stores that need it most
      routes.forEach((r, ri) => {
        const need = Math.min(1, Math.max(0, (0.8 - level[r.si]) / 0.8));
        const rate = (0.6 + 3 * need) / STORES[r.si].hubs.length;
        r.spawn += rate * dt;
        while (r.spawn >= 1) {
          r.spawn -= 1;
          packets.push({ r: ri, t: 0, speed: 0.42 + rand() * 0.18 });
        }
      });

      packets = packets.filter((p) => {
        p.t += p.speed * dt;
        if (p.t < 1) return true;
        const si = routes[p.r].si;
        level[si] = Math.min(1, level[si] + 0.06);
        return false;
      });

      if (time >= nextEdge) {
        const si = [1, 3, 0, 4, 2][edgeIdx % 5];
        level[si] = Math.max(0, level[si] - 0.42);
        edgeUntil[si] = time + 2;
        edgeIdx += 1;
        nextEdge += EDGE_EVERY;
      }

      if (time >= nextEmit) {
        nextEmit += EMIT_EVERY;
        emitRef.current?.animate(
          [
            { opacity: 1, transform: 'scale(1.6)' },
            { opacity: 0.35, transform: 'scale(1)' },
          ],
          { duration: 700, easing: 'ease-out' },
        );
      }
    };

    // ── layout ──
    let w = 0;
    let h = 0;
    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = canvas.getBoundingClientRect();
      w = r.width;
      h = r.height;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const geometry = () => {
      const top = 40;
      const bottom = h * 0.62;
      const left = 26;
      const right = w - 30;
      const map = (p: Pt) => ({
        x: left + (right - left) * p.x,
        y: top + (bottom - top) * p.y,
      });
      const hubs = HUBS.map(map);
      const stores = STORES.map(map);
      const curves = routes.map(({ si, hi }) => {
        const p0 = hubs[hi];
        const p3 = stores[si];
        const mx = p0.x + (p3.x - p0.x) * 0.55;
        return { p0, c1: { x: mx, y: p0.y }, c2: { x: mx, y: p3.y }, p3 };
      });
      return { hubs, stores, curves };
    };

    // ── drawing ──
    const draw = (intro: number) => {
      const g = geometry();
      ctx.clearRect(0, 0, w, h);

      // routes, drawn in on intro; brighter when feeding a short store
      g.curves.forEach((c, ri) => {
        const hot = short[routes[ri].si];
        ctx.beginPath();
        const n = 40;
        const upto = Math.max(1, Math.round(n * intro));
        for (let k = 0; k <= upto; k += 1) {
          const p = bezier(c.p0, c.c1, c.c2, c.p3, k / n);
          if (k === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = hot ? GOLD(0.42) : BEIGE(0.13);
        ctx.lineWidth = hot ? 1.2 : 1;
        ctx.stroke();
      });

      // packets with short fading trails
      if (intro >= 1) {
        packets.forEach((p) => {
          const c = g.curves[p.r];
          const hot = short[routes[p.r].si];
          for (let k = 3; k >= 0; k -= 1) {
            const tt = p.t - k * 0.018;
            if (tt < 0) continue;
            const q = bezier(c.p0, c.c1, c.c2, c.p3, tt);
            const a = (1 - k / 4) * Math.min(1, p.t * 6);
            ctx.beginPath();
            ctx.fillStyle = hot ? GOLD(0.95 * a) : IVORY(0.75 * a);
            ctx.arc(q.x, q.y, k === 0 ? 1.9 : 1.3, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }

      // hubs
      g.hubs.forEach((p, i) => {
        const s = 8;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.globalAlpha = intro;
        ctx.fillStyle = 'rgba(5,11,20,0.95)';
        ctx.fillRect(-s, -s, s * 2, s * 2);
        ctx.strokeStyle = BEIGE(0.6);
        ctx.lineWidth = 1;
        ctx.strokeRect(-s, -s, s * 2, s * 2);
        // slow rotating dispatch marker
        ctx.rotate(time * 0.8 + i);
        ctx.strokeStyle = GOLD(0.55);
        ctx.setLineDash([2, 3]);
        ctx.strokeRect(-s - 4, -s - 4, (s + 4) * 2, (s + 4) * 2);
        ctx.setLineDash([]);
        ctx.restore();
        ctx.fillStyle = BEIGE(0.5 * intro);
        ctx.font = MONO;
        ctx.textAlign = 'center';
        ctx.fillText(`HUB ${i + 1}`, p.x, p.y + 25);
      });

      // stores: inventory ring, shortage ripple, edge-case marker
      g.stores.forEach((p, i) => {
        const pop = Math.max(0, Math.min(1, intro * 1.6 - 0.4 - i * 0.08));
        if (pop <= 0) return;
        const hot = short[i];
        const R = 11;

        if (hot) {
          for (let k = 0; k < 2; k += 1) {
            const ph = (time * 0.9 + k * 0.5) % 1;
            ctx.beginPath();
            ctx.strokeStyle = GOLD(0.5 * (1 - ph));
            ctx.lineWidth = 1;
            ctx.arc(p.x, p.y, R + 4 + ph * 18, 0, Math.PI * 2);
            ctx.stroke();
          }
        }

        ctx.beginPath();
        ctx.fillStyle = 'rgba(5,11,20,0.95)';
        ctx.arc(p.x, p.y, R * pop, 0, Math.PI * 2);
        ctx.fill();

        // ring track + level
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.strokeStyle = BEIGE(0.12 * pop);
        ctx.arc(p.x, p.y, R * pop, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.strokeStyle = hot ? GOLD(pop) : IVORY(0.75 * pop);
        ctx.arc(p.x, p.y, R * pop, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * level[i] * pop);
        ctx.stroke();

        // core
        ctx.beginPath();
        ctx.fillStyle = hot ? GOLD(pop) : BEIGE(0.35 * pop);
        ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = MONO;
        ctx.textAlign = 'center';
        ctx.fillStyle = hot ? GOLD(0.95 * pop) : BEIGE(0.45 * pop);
        ctx.fillText(hot ? 'SHORTAGE' : `S${i + 1}`, p.x, p.y + R + 12);

        if (time < edgeUntil[i]) {
          const life = (edgeUntil[i] - time) / 2;
          const s = R + 7;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(-time * 1.4);
          ctx.strokeStyle = IVORY(0.8 * life);
          ctx.setLineDash([3, 2.5]);
          ctx.lineWidth = 1;
          ctx.strokeRect(-s, -s, s * 2, s * 2);
          ctx.restore();
          ctx.setLineDash([]);
          ctx.fillStyle = IVORY(0.85 * life);
          // left of the node, clear of the header and the store label
          ctx.textAlign = 'right';
          ctx.fillText('EDGE CASE', p.x - s - 5, p.y + 2.5);
        }
      });

      // ── demand trend strip ──
      const x0 = 26;
      const x1 = w - 30;
      const top = h * 0.74;
      const bot = h - 22;
      const mid = (top + bot) / 2;
      const amp = (bot - top) / 2;
      const nowX = x0 + (x1 - x0) * 0.68;

      ctx.strokeStyle = BEIGE(0.06);
      ctx.lineWidth = 1;
      [top, mid, bot].forEach((y) => {
        ctx.beginPath();
        ctx.moveTo(x0, y);
        ctx.lineTo(x1, y);
        ctx.stroke();
      });

      const slow = (u: number) => 0.55 * Math.sin(u * 1.3) + 0.25 * Math.sin(u * 0.55 + 1.7);
      const fast = (u: number) => 0.18 * Math.sin(u * 4.1 + 0.6) + 0.08 * Math.sin(u * 9.3);
      const uOf = (x: number) => time * 0.45 + ((x - nowX) / (x1 - x0)) * 6;
      const yOf = (v: number) => mid - v * amp * 0.9;

      const reveal = x0 + (x1 - x0) * intro;

      // confidence band, widening into the future
      if (reveal > nowX) {
        const end = Math.min(x1, reveal);
        ctx.beginPath();
        for (let x = nowX; x <= end; x += 3) {
          const spread = 0.06 + ((x - nowX) / (x1 - nowX)) * 0.35;
          ctx.lineTo(x, yOf(slow(uOf(x)) + spread));
        }
        for (let x = end; x >= nowX; x -= 3) {
          const spread = 0.06 + ((x - nowX) / (x1 - nowX)) * 0.35;
          ctx.lineTo(x, yOf(slow(uOf(x)) - spread));
        }
        ctx.closePath();
        ctx.fillStyle = GOLD(0.1);
        ctx.fill();
      }

      // history
      ctx.beginPath();
      for (let x = x0; x <= Math.min(nowX, reveal); x += 2) {
        const y = yOf(slow(uOf(x)) + fast(uOf(x)));
        if (x === x0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = IVORY(0.75);
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // forecast
      if (reveal > nowX) {
        ctx.beginPath();
        for (let x = nowX; x <= Math.min(x1, reveal); x += 2) {
          const y = yOf(slow(uOf(x)));
          if (x === nowX) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.setLineDash([4, 3]);
        ctx.strokeStyle = GOLD(0.9);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // now marker
      ctx.beginPath();
      ctx.setLineDash([1.5, 2.5]);
      ctx.moveTo(nowX, top - 4);
      ctx.lineTo(nowX, bot + 4);
      ctx.strokeStyle = BEIGE(0.35);
      ctx.stroke();
      ctx.setLineDash([]);
      if (reveal >= nowX) {
        ctx.beginPath();
        ctx.fillStyle = GOLD(1);
        ctx.arc(nowX, yOf(slow(uOf(nowX)) + fast(uOf(nowX))), 2.4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.font = MONO;
      ctx.textAlign = 'left';
      ctx.fillStyle = BEIGE(0.45);
      ctx.fillText('DEMAND TREND', x0, h - 8);
      ctx.textAlign = 'center';
      ctx.fillText('NOW', nowX, h - 8);
      ctx.textAlign = 'right';
      ctx.fillStyle = GOLD(0.8);
      ctx.fillText('FORECAST', x1, h - 8);
    };

    fit();

    // Pre-run so goods are already in transit when the panel opens.
    for (let k = 0; k < 50; k += 1) step(0.05);

    if (reduced) {
      for (let k = 0; k < 40; k += 1) step(0.05);
      draw(1);
      return;
    }

    let raf = 0;
    const start = performance.now();
    let last = start;
    const loop = (now: number) => {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      const intro = Math.min(1, (now - start) / 1100);
      step(dt);
      draw(1 - Math.pow(1 - intro, 3));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const ro = new ResizeObserver(fit);
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [active, reduced]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-navy-900/40">
      <canvas ref={canvasRef} aria-hidden className="absolute inset-0 h-full w-full" />

      <div className="pointer-events-none relative flex items-baseline justify-between p-4">
        <p className="font-mono text-[8.5px] uppercase tracking-metadata text-beige-500">
          Predictive logistics network
        </p>
        <p className="flex items-center gap-1.5 font-mono text-[8.5px] uppercase tracking-wide2 text-gold">
          <span ref={emitRef} className="block size-1.5 rounded-full bg-gold opacity-35" />
          JSON → dashboards
        </p>
      </div>
    </div>
  );
}
