'use client';

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { navItems, profile } from '@/data/resume';
import { useActiveSection } from '@/hooks/use-active-section';
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
          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-9">
              {navItems.map((item) => {
                const isActive = active === item.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => go(item.id)}
                      aria-current={isActive ? 'true' : undefined}
                      className="group relative flex items-baseline gap-1.5 py-1"
                    >
                      <span
                        className={cn(
                          'font-mono text-[9px] transition-colors duration-500',
                          isActive ? 'text-gold' : 'text-beige-500',
                        )}
                      >
                        {item.index}
                      </span>
                      <span
                        className={cn(
                          'text-[11px] uppercase tracking-wide2 transition-colors duration-500',
                          isActive
                            ? 'text-beige-100'
                            : 'text-beige-400 group-hover:text-beige-200',
                        )}
                      >
                        {item.label}
                      </span>
                      {/* Shared layout id makes the indicator glide between items */}
                      {isActive && (
                        <motion.span
                          layoutId="nav-indicator"
                          className="absolute -bottom-0.5 left-0 h-px w-full bg-gold"
                          transition={{ duration: 0.5, ease: EASE_EDITORIAL }}
                        />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

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
