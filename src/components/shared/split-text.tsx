'use client';

import { motion } from 'framer-motion';
import { EASE_EDITORIAL, cn } from '@/lib/utils';

interface SplitTextProps {
  text: string;
  className?: string;
  /** Seconds before the first word starts. */
  delay?: number;
  /** Per-word offset. */
  stagger?: number;
  /** Animate on mount rather than on scroll into view. */
  immediate?: boolean;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
}

/**
 * Word-by-word mask reveal. Each word sits in an overflow-hidden box and
 * slides up from below, so the text appears to rise out of the page rather
 * than fade in.
 *
 * The words remain real text in the DOM (no per-character spans), so screen
 * readers and copy-paste behave normally.
 */
export function SplitText({
  text,
  className,
  delay = 0,
  stagger = 0.055,
  immediate = false,
  as: Tag = 'span',
}: SplitTextProps) {
  const words = text.split(' ');

  const animateProps = immediate
    ? { animate: 'visible' as const }
    : { whileInView: 'visible' as const, viewport: { once: true, margin: '-12%' } };

  return (
    <Tag className={cn('block', className)}>
      <motion.span
        className="inline"
        initial="hidden"
        {...animateProps}
        transition={{ staggerChildren: stagger, delayChildren: delay }}
      >
        {words.map((word, i) => (
          <span
            key={`${word}-${i}`}
            className="inline-block overflow-hidden align-bottom"
            // Trailing space kept inside the box so wrapping stays natural.
            style={{ paddingBottom: '0.08em' }}
          >
            <motion.span
              className="inline-block"
              variants={{
                hidden: { y: '110%' },
                visible: {
                  y: '0%',
                  transition: { duration: 1.05, ease: EASE_EDITORIAL },
                },
              }}
            >
              {word}
              {i < words.length - 1 ? ' ' : ''}
            </motion.span>
          </span>
        ))}
      </motion.span>
    </Tag>
  );
}
