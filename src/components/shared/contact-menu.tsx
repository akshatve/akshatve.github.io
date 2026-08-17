'use client';

import { motion } from 'framer-motion';
import { Mail, Phone } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { profile } from '@/data/resume';
import { EASE_EDITORIAL, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

/**
 * "Get in touch" button that reveals two ways to reach Akshat.
 *
 * Both options are plain links, deliberately:
 *   • mailto: hands off to whatever mail client the visitor has set as their
 *     default — Gmail, Apple Mail, Outlook. A site cannot (and should not try
 *     to) force a specific one; the OS handler decides.
 *   • tel:   opens the dialer, which asks for confirmation before calling.
 *     Nothing dials automatically.
 *
 * Keyboard: Escape closes, arrows move between options, focus returns to the
 * trigger on close. Closes on outside click too.
 */
export function ContactMenu() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstItemRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!open) return;

    firstItemRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;

      const items = rootRef.current?.querySelectorAll<HTMLAnchorElement>('[role="menuitem"]');
      if (!items?.length) return;
      e.preventDefault();
      const list = Array.from(items);
      const i = list.indexOf(document.activeElement as HTMLAnchorElement);
      const next = e.key === 'ArrowDown' ? i + 1 : i - 1;
      list[(next + list.length) % list.length].focus();
    };

    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };

    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  const options = [
    {
      icon: Mail,
      label: 'Email',
      value: profile.email,
      href: `mailto:${profile.email}`,
      hint: 'Opens your mail app',
    },
    {
      icon: Phone,
      label: 'Phone',
      value: profile.phone,
      href: `tel:${profile.phoneRaw}`,
      hint: 'Opens your dialler',
    },
  ];

  return (
    <div ref={rootRef} className="relative">
      <Button
        ref={triggerRef}
        type="button"
        variant="outline"
        size="md"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="group/ct"
      >
        Get in touch
        <Mail className="transition-transform duration-500 ease-editorial group-hover/ct:translate-x-0.5" />
      </Button>

      <motion.div
        role="menu"
        aria-label="Contact options"
        aria-hidden={!open}
        initial={false}
        animate={open ? { opacity: 1, y: 0 } : { opacity: 0, y: -6 }}
        transition={{ duration: 0.32, ease: EASE_EDITORIAL }}
        // Interactivity comes from state, never from the animation. Framer
        // applies non-animatable values like pointerEvents a beat late, which
        // left the menu unclickable while open and — worse — still swallowing
        // clicks once closed.
        className={cn(
          'absolute left-0 top-[calc(100%+0.6rem)] z-30 w-[min(20rem,80vw)]',
          'border border-beige-200/20 bg-navy-800/95 backdrop-blur-md',
          open ? 'pointer-events-auto' : 'pointer-events-none',
        )}
      >
        {options.map((o, i) => (
          <a
            key={o.label}
            ref={i === 0 ? firstItemRef : undefined}
            role="menuitem"
            href={o.href}
            tabIndex={open ? 0 : -1}
            onClick={() => setOpen(false)}
            className="group/mi flex items-center gap-4 border-b border-beige-200/10 px-5 py-4 outline-offset-[-2px] transition-colors duration-400 last:border-b-0 hover:bg-beige-200/[0.05]"
          >
            <o.icon
              aria-hidden
              className="size-4 shrink-0 text-beige-400 transition-colors duration-400 group-hover/mi:text-gold"
            />
            <span className="min-w-0">
              <span className="block font-mono text-[9px] uppercase tracking-metadata text-beige-500">
                {o.label} · {o.hint}
              </span>
              <span className="mt-1 block truncate text-[13.5px] text-beige-200 transition-colors duration-400 group-hover/mi:text-beige-100">
                {o.value}
              </span>
            </span>
          </a>
        ))}
      </motion.div>
    </div>
  );
}
