'use client';

import { useEffect, useState } from 'react';

/**
 * Tracks which section is currently in view.
 *
 * Picks the entry closest to the top of the viewport rather than the largest
 * intersection ratio — with sections of very different heights, ratio alone
 * makes short sections lose to tall neighbours and the nav highlight skips.
 */
export function useActiveSection(ids: string[], rootMargin = '-45% 0px -50% 0px') {
  const [active, setActive] = useState(ids[0] ?? '');

  useEffect(() => {
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (!visible.length) return;

        const nearest = visible.reduce((best, e) =>
          Math.abs(e.boundingClientRect.top) < Math.abs(best.boundingClientRect.top) ? e : best,
        );
        setActive(nearest.target.id);
      },
      { rootMargin, threshold: 0 },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [ids, rootMargin]);

  return active;
}
