'use client';

import { ReactLenis } from 'lenis/react';
import type { ReactNode } from 'react';
import { usePrefersReducedMotion } from '@/hooks/use-media-query';

/**
 * Lenis inertial scrolling. Rendered in `root` mode so it drives the window
 * scroll directly — that keeps native anchors, Framer Motion's useScroll, and
 * IntersectionObserver all working off the same position.
 *
 * Bypassed entirely when the visitor asks for reduced motion.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduced = usePrefersReducedMotion();

  if (reduced) return <>{children}</>;

  return (
    <ReactLenis
      root
      options={{
        lerp: 0.09,
        duration: 1.15,
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.6,
      }}
    >
      {children}
    </ReactLenis>
  );
}
