'use client';

import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useEffect, useState } from 'react';
import { usePointerFine, usePrefersReducedMotion } from '@/hooks/use-media-query';

/**
 * Two-part cursor: a small beige dot that tracks precisely, and a larger thin
 * ring that lags behind on a softer spring. The ring expands over interactive
 * elements.
 *
 * Only mounts for fine pointers, and hides the native cursor via a body
 * attribute so touch devices are never left without one.
 */
export function Cursor() {
  const fine = usePointerFine();
  const reduced = usePrefersReducedMotion();
  const enabled = fine && !reduced;

  const [hovering, setHovering] = useState(false);
  const [visible, setVisible] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);

  // Dot tracks tightly; ring trails with more give.
  const dotX = useSpring(x, { stiffness: 1100, damping: 46, mass: 0.22 });
  const dotY = useSpring(y, { stiffness: 1100, damping: 46, mass: 0.22 });
  const ringX = useSpring(x, { stiffness: 190, damping: 22, mass: 0.55 });
  const ringY = useSpring(y, { stiffness: 190, damping: 22, mass: 0.55 });

  useEffect(() => {
    if (!enabled) return;

    document.body.setAttribute('data-cursor-active', 'true');

    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
    };

    // Delegated so elements added later (modal contents) are covered too.
    const over = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null;
      setHovering(
        !!t?.closest?.('a, button, [role="button"], input, textarea, select, [data-cursor]'),
      );
    };

    const leave = () => setVisible(false);

    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerover', over, { passive: true });
    document.addEventListener('pointerleave', leave);

    return () => {
      document.body.removeAttribute('data-cursor-active');
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerover', over);
      document.removeEventListener('pointerleave', leave);
    };
  }, [enabled, x, y]);

  if (!enabled) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[90]">
      <motion.div
        className="absolute rounded-full bg-beige-200"
        style={{
          x: dotX,
          y: dotY,
          width: 5,
          height: 5,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{ opacity: visible ? 1 : 0, scale: hovering ? 0 : 1 }}
        transition={{ duration: 0.25 }}
      />
      <motion.div
        className="absolute rounded-full border border-beige-200/45"
        style={{
          x: ringX,
          y: ringY,
          width: 32,
          height: 32,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          opacity: visible ? 1 : 0,
          scale: hovering ? 1.75 : 1,
          borderColor: hovering ? 'rgba(216,192,138,0.8)' : 'rgba(232,222,200,0.45)',
        }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}
