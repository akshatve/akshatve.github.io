'use client';

import { motion, useScroll, useSpring } from 'framer-motion';

/** Hairline beige progress bar pinned to the top of the viewport. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 240,
    damping: 34,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden
      className="fixed inset-x-0 top-0 z-[80] h-px origin-left bg-beige-200/70"
      style={{ scaleX }}
    />
  );
}
