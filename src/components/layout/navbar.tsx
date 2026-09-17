'use client';

import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useTransform,
  useVelocity,
} from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { navItems, profile } from '@/data/resume';
import { useActiveSection } from '@/hooks/use-active-section';
import { usePrefersReducedMotion } from '@/hooks/use-media-query';
import { useSmoothScrollTo } from '@/hooks/use-smooth-scroll-to';
import { EASE_EDITORIAL, cn } from '@/lib/utils';

const SECTION_IDS = navItems.map((n) => n.id);

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const active = useActiveSection(SECTION_IDS);
  const scrollTo = useSmoothScrollTo();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (v) => setScrolled(v > 40));

  // Lock the page while the mobile sheet is open, and allow Escape to close.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const go = (id: string) => {
    setMenuOpen(false);
    scrollTo(id, -80);
  };

  return (
    <>
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1.1, delay: 2.4, ease: EASE_EDITORIAL }}
        className={cn(
          'fixed inset-x-0 top-0 z-[70] transition-colors duration-700',
          scrolled ? 'bg-navy-800/85 backdrop-blur-md' : 'bg-transparent',
        )}
      >
        <div
          className={cn(
            'shell flex items-center justify-between transition-all duration-700 ease-editorial',
            scrolled ? 'py-4' : 'py-7',
          )}
        >
          <button
            type="button"
            onClick={() => scrollTo('hero', 0)}
            className="meta text-beige-200 transition-colors duration-500 hover:text-gold"
          >
            {profile.name}
          </button>

          {/* Desktop nav */}
          <GlassNav active={active} onSelect={go} />

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            className="meta flex items-center gap-2 text-beige-200 lg:hidden"
          >
            <Menu aria-hidden className="size-4" />
            Menu
          </button>
        </div>
        <div className={cn('rule transition-opacity duration-700', scrolled ? 'opacity-100' : 'opacity-0')} />
      </motion.header>

      {/* Mobile sheet */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[85] bg-navy-900 lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
          >
            <div className="shell flex items-center justify-between py-7">
              <span className="meta text-beige-200">{profile.name}</span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="meta flex items-center gap-2 text-beige-200"
                autoFocus
              >
                <X aria-hidden className="size-4" />
                Close
              </button>
            </div>

            <nav aria-label="Mobile" className="shell mt-10">
              <ul className="flex flex-col">
                {navItems.map((item, i) => (
                  <motion.li
                    key={item.id}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 + i * 0.05, duration: 0.6, ease: EASE_EDITORIAL }}
                    className="border-b border-beige-200/10"
                  >
                    <button
                      type="button"
                      onClick={() => go(item.id)}
                      className="flex w-full items-baseline gap-4 py-5 text-left"
                    >
                      <span className="font-mono text-[10px] text-beige-500">{item.index}</span>
                      <span className="font-serif text-3xl text-beige-200">{item.label}</span>
                    </button>
                  </motion.li>
                ))}
              </ul>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ------------------------------------------------------------ desktop nav */

/**
 * Liquid-glass navigation.
 *
 * The row sits in a frosted capsule; a single glass lens glides to the hovered
 * item and settles back on the active section. The lens's two edges run on
 * separate springs — the leading edge stiff, the trailing edge loose — so it
 * stretches in the direction of travel like a droplet, and squashes slightly
 * with speed. A specular highlight follows the pointer across the glass.
 */
function GlassNav({ active, onSelect }: { active: string | null; onSelect: (id: string) => void }) {
  const reduced = usePrefersReducedMotion();
  const listRef = useRef<HTMLUListElement>(null);
  const lensRef = useRef<HTMLSpanElement>(null);
  const itemRefs = useRef<Record<string, HTMLLIElement | null>>({});
  const placed = useRef(false);

  const [hovered, setHovered] = useState<string | null>(null);
  const target = hovered ?? active;

  const left = useMotionValue(0);
  const right = useMotionValue(0);
  const width = useTransform(() => right.get() - left.get());
  const velocity = useVelocity(left);
  const scaleY = useTransform(velocity, [-1400, 0, 1400], [0.8, 1, 0.8], { clamp: true });
  const opacity = useMotionValue(0);

  const moveLens = useCallback(
    (id: string | null) => {
      const el = id ? itemRefs.current[id] : null;
      if (!el) {
        animate(opacity, 0, { duration: reduced ? 0 : 0.3 });
        return;
      }
      const l = el.offsetLeft;
      const r = el.offsetLeft + el.offsetWidth;

      if (!placed.current || reduced) {
        // First placement (or reduced motion): no travel, just appear.
        left.set(l);
        right.set(r);
        placed.current = true;
      } else {
        const goingRight = l > left.get();
        const lead = { type: 'spring', stiffness: 520, damping: 36, mass: 0.7 } as const;
        const trail = { type: 'spring', stiffness: 230, damping: 24, mass: 0.9 } as const;
        animate(left, l, goingRight ? trail : lead);
        animate(right, r, goingRight ? lead : trail);
      }
      animate(opacity, 1, { duration: reduced ? 0 : 0.35 });
    },
    [left, right, opacity, reduced],
  );

  useLayoutEffect(() => {
    moveLens(target);
  }, [target, moveLens]);

  // Re-measure when fonts settle or the layout changes size.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const ro = new ResizeObserver(() => {
      placed.current = false;
      moveLens(target);
    });
    ro.observe(list);
    return () => ro.disconnect();
  }, [target, moveLens]);

  const trackSheen = (e: React.PointerEvent) => {
    const lens = lensRef.current;
    if (!lens) return;
    const r = lens.getBoundingClientRect();
    lens.style.setProperty('--sheen-x', `${e.clientX - r.left}px`);
  };

  return (
    <nav aria-label="Primary" className="hidden lg:block">
      <ul
        ref={listRef}
        onPointerMove={trackSheen}
        onPointerLeave={() => setHovered(null)}
        className="glass-capsule relative flex items-center gap-0.5 rounded-full p-1.5"
      >
        <motion.span
          ref={lensRef}
          aria-hidden
          style={{ x: left, width, scaleY, opacity }}
          className="glass-lens pointer-events-none absolute inset-y-1.5 left-0 rounded-full"
        />

        {navItems.map((item) => {
          const isActive = active === item.id;
          const isLit = target === item.id;
          return (
            <li
              key={item.id}
              ref={(el) => {
                itemRefs.current[item.id] = el;
              }}
              className="relative z-10"
            >
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                onPointerEnter={() => setHovered(item.id)}
                onFocus={() => setHovered(item.id)}
                onBlur={() => setHovered(null)}
                aria-current={isActive ? 'true' : undefined}
                className="flex items-baseline gap-1.5 rounded-full px-3.5 py-2 outline-none focus-visible:ring-1 focus-visible:ring-gold/60"
              >
                <span
                  className={cn(
                    'font-mono text-[9px] transition-colors duration-500',
                    isActive ? 'text-gold' : isLit ? 'text-beige-300' : 'text-beige-500',
                  )}
                >
                  {item.index}
                </span>
                <span
                  className={cn(
                    'text-[11px] uppercase tracking-wide2 transition-colors duration-500',
                    isActive || isLit ? 'text-beige-100' : 'text-beige-400',
                  )}
                >
                  {item.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
