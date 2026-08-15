'use client';

import { motion } from 'framer-motion';
import { EASE_EDITORIAL } from '@/lib/utils';

interface SectionLabelProps {
  index: string;
  label: string;
}

/** Numbered rule + label that opens every section. */
export function SectionLabel({ index, label }: SectionLabelProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-10%' }}
      transition={{ staggerChildren: 0.08 }}
      className="flex items-center gap-5"
    >
      <motion.span
        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
        transition={{ duration: 0.7 }}
        className="font-mono text-[10px] text-gold"
      >
        {index}
      </motion.span>
      <motion.span
        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
        transition={{ duration: 0.7 }}
        className="meta text-beige-300"
      >
        {label}
      </motion.span>
      <motion.span
        variants={{ hidden: { scaleX: 0 }, visible: { scaleX: 1 } }}
        transition={{ duration: 1.2, ease: EASE_EDITORIAL }}
        className="h-px flex-1 origin-left bg-beige-200/15"
      />
    </motion.div>
  );
}
