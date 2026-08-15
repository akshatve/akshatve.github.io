'use client';

import { useEffect, useState } from 'react';

/**
 * SSR-safe media query hook.
 *
 * Always returns `false` on the server and on the first client render, then
 * updates after mount — so the server and client markup always agree.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);

    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/** True only for mouse/trackpad pointers — gates cursor and magnetic effects. */
export function usePointerFine() {
  return useMediaQuery('(hover: hover) and (pointer: fine)');
}

export function usePrefersReducedMotion() {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

export function useIsDesktop() {
  return useMediaQuery('(min-width: 1024px)');
}
