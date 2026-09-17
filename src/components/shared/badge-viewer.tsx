'use client';

import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface BadgeViewerProps {
  /** The badge being shown, or null when closed. */
  badge: { src: string; title: string; issuer: string } | null;
  onClose: () => void;
}

/**
 * Lightbox for a certification badge.
 *
 * Permanently mounted, with interactivity driven by state rather than by an
 * exit animation: "closed" always means pointer-events: none, so a stalled
 * transition can never leave an invisible layer blocking the page.
 */
export function BadgeViewer({ badge, onClose }: BadgeViewerProps) {
  const open = badge !== null;
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  // Keep the last badge rendered so the image doesn't vanish mid fade-out.
  const shownRef = useRef<BadgeViewerProps['badge']>(null);
  if (badge) shownRef.current = badge;
  const shown = shownRef.current;

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      restoreRef.current?.focus?.();
    };
  }, [open, onClose]);

  // Portal to <body>: the page content sits in its own stacking context,
  // which would otherwise trap the overlay beneath the navbar.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div
      aria-hidden={!open}
      data-lenis-prevent
      className={cn(
        'fixed inset-0 z-[88] flex items-center justify-center p-5 transition-opacity duration-300 sm:p-10',
        open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
      )}
    >
      <button
        type="button"
        aria-label="Close certificate"
        tabIndex={open ? 0 : -1}
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-navy-900/92 backdrop-blur-sm"
      />

      {shown && (
        <figure
          role="dialog"
          aria-modal="true"
          aria-label={`${shown.title} certificate`}
          className={cn(
            'relative w-full max-w-[34rem] transition-all duration-500 ease-editorial',
            open ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-3 scale-[0.98] opacity-0',
          )}
        >
          <div className="mb-3 flex items-center justify-between gap-4">
            <figcaption className="font-mono text-[11px] uppercase tracking-metadata text-beige-300">
              {shown.title} · {shown.issuer}
            </figcaption>
            <button
              ref={closeRef}
              type="button"
              tabIndex={open ? 0 : -1}
              onClick={onClose}
              className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-metadata text-beige-200 transition-colors duration-500 hover:text-gold"
            >
              <X aria-hidden className="size-4" />
              Close
            </button>
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element -- static export, no image optimiser */}
          <img
            src={shown.src}
            alt={`${shown.title} certificate badge issued with ${shown.issuer}`}
            className="block h-auto w-full border border-beige-200/15"
          />
        </figure>
      )}
    </div>,
    document.body,
  );
}
