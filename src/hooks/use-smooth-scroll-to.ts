'use client';

import { useLenis } from 'lenis/react';
import { useCallback } from 'react';

/**
 * Scrolls to a section by id. Falls back to native smooth scrolling when
 * Lenis is absent (reduced-motion visitors), so anchors always work.
 */
export function useSmoothScrollTo() {
  const lenis = useLenis();

  return useCallback(
    (id: string, offset = -72) => {
      const el = document.getElementById(id);
      if (!el) return;

      if (lenis) {
        lenis.scrollTo(el, { offset, duration: 1.35 });
      } else {
        const top = el.getBoundingClientRect().top + window.scrollY + offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    },
    [lenis],
  );
}
