'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useRef } from 'react';
import type { Project } from '@/types';
import { ArrowUpRight } from 'lucide-react';
import { usePointerFine } from '@/hooks/use-media-query';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ProjectVisual } from '@/components/shared/project-visual';

interface ProjectCardProps {
  project: Project;
  onOpen: () => void;
  className?: string;
}

/**
 * Closed project state. Tilts a few degrees toward the cursor on fine
 * pointers; on touch it is a plain, fully tappable button.
 *
 * Rendered as a <button> so it is keyboard-focusable and announces itself
 * correctly — the whole card opens the case study.
 */
export function ProjectCard({ project, onOpen, className }: ProjectCardProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const fine = usePointerFine();

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], ['4deg', '-4deg']), {
    stiffness: 150,
    damping: 20,
  });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], ['-5deg', '5deg']), {
    stiffness: 150,
    damping: 20,
  });

  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={onOpen}
      aria-label={`${project.title} — open case study`}
      style={fine ? { rotateX: rx, rotateY: ry, transformPerspective: 1200 } : undefined}
      onPointerMove={
        fine
          ? (e) => {
              const r = e.currentTarget.getBoundingClientRect();
              mx.set((e.clientX - r.left) / r.width - 0.5);
              my.set((e.clientY - r.top) / r.height - 0.5);
            }
          : undefined
      }
      onPointerLeave={
        fine
          ? () => {
              mx.set(0);
              my.set(0);
            }
          : undefined
      }
      className={cn(
        'group relative flex flex-col overflow-hidden border border-beige-200/12 bg-navy-700/40 text-left',
        'transition-colors duration-700 ease-editorial hover:border-beige-200/30',
        className,
      )}
    >
      {/* Decorative motif */}
      <span className="pointer-events-none absolute inset-0 opacity-45 transition-opacity duration-700 ease-editorial group-hover:opacity-75">
        <ProjectVisual variant={project.visual} />
      </span>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy-800 via-navy-800/85 to-navy-800/35"
      />

      <span className="relative flex items-start justify-between gap-6 p-7 sm:p-9">
        <span className="font-mono text-[11px] text-gold">{project.number}</span>
        <span className="font-mono text-[10px] tracking-wide2 text-beige-400">
          {project.period}
        </span>
      </span>

      <span className="relative mt-auto p-7 pt-0 sm:p-9 sm:pt-0">
        <span className="block font-serif text-[clamp(1.5rem,2.6vw,2.1rem)] leading-[1.15] tracking-[-0.015em] text-beige-100 transition-transform duration-700 ease-editorial group-hover:-translate-y-0.5">
          {project.title}
        </span>

        <span className="mt-4 block text-[13px] leading-relaxed text-beige-300 sm:text-sm">
          {project.teaser}
        </span>

        <span className="mt-6 flex flex-wrap gap-x-3 gap-y-2">
          {project.tech.map((t) => (
            <Badge key={t} variant="plain">
              {t}
            </Badge>
          ))}
        </span>

        {/* Reveal strip */}
        <span className="mt-7 flex items-center gap-3 overflow-hidden">
          <span className="meta text-beige-200 transition-colors duration-500 group-hover:text-gold">
            View project
          </span>
          <span
            aria-hidden
            className="h-px w-6 origin-left bg-beige-200/30 transition-all duration-700 ease-editorial group-hover:w-14 group-hover:bg-gold"
          />
          <ArrowUpRight
            aria-hidden
            className="size-3.5 text-beige-300 transition-all duration-700 ease-editorial group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-gold"
          />
        </span>
      </span>
    </motion.button>
  );
}
