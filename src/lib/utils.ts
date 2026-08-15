import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Shared easing curves so motion feels consistent across the site. */
export const EASE_EDITORIAL = [0.22, 1, 0.36, 1] as const;
export const EASE_SMOOTH = [0.65, 0, 0.35, 1] as const;

/** Staggered container variant factory. */
export const stagger = (staggerChildren = 0.08, delayChildren = 0) => ({
  hidden: {},
  visible: { transition: { staggerChildren, delayChildren } },
});

/** Standard rise-and-fade child variant. */
export const riseItem = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: EASE_EDITORIAL },
  },
};
