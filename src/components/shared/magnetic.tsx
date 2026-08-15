'use client';

import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useRef, type ReactNode } from 'react';
import { usePointerFine } from '@/hooks/use-media-query';
import { cn } from '@/lib/utils';

interface MagneticProps {
  children: ReactNode;
  /** 0–1. How far the element follows the pointer. */
  strength?: number;
  className?: string;
}

/**
 * Pulls its child slightly toward the cursor while hovered.
 *
 * Disabled entirely on coarse pointers: without hover there is no way to
 * release the offset, so a touch would leave the element stuck off-centre.
 */
export function Magnetic({ children, strength = 0.28, className }: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null);
  const fine = usePointerFine();

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 160, damping: 18, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 160, damping: 18, mass: 0.4 });

  if (!fine) return <div className={className}>{children}</div>;

  return (
    <motion.div
      ref={ref}
      className={cn('inline-block', className)}
      style={{ x: springX, y: springY }}
      onPointerMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * strength);
        y.set((e.clientY - (r.top + r.height / 2)) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}
