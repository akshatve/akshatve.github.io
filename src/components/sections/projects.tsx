'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import useEmblaCarousel from 'embla-carousel-react';
import { useLenis } from 'lenis/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { projects } from '@/data/resume';
import type { Project } from '@/types';
import { useMediaQuery, usePrefersReducedMotion } from '@/hooks/use-media-query';
import { Button } from '@/components/ui/button';
import { SectionLabel } from '@/components/shared/section-label';
import { ProjectCard } from '@/components/shared/project-card';
import { ProjectModal } from '@/components/sections/project-modal';

/**
 * Three deliberately different treatments:
 *
 * - Desktop: GSAP ScrollTrigger pins the section and converts vertical scroll
 *   into horizontal travel. ScrollTrigger handles pinning, resize
 *   recalculation and cleanup far more reliably than hand-rolled sticky maths.
 * - Tablet: an Embla drag carousel — the same exploration, none of the pinning.
 * - Mobile / reduced motion: a plain vertical stack, per the brief.
 */
export function Projects() {
  const [openProject, setOpenProject] = useState<Project | null>(null);
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isTablet = useMediaQuery('(min-width: 640px) and (max-width: 1023px)');
  const reduced = usePrefersReducedMotion();

  const mode: 'pinned' | 'carousel' | 'stack' = reduced
    ? 'stack'
    : isDesktop
      ? 'pinned'
      : isTablet
        ? 'carousel'
        : 'stack';

  return (
    <section id="projects" className="relative scroll-mt-24 pt-28 sm:pt-36 lg:pt-44">
      <div className="shell">
        <SectionLabel index="04" label="Projects" />
      </div>

      {mode === 'pinned' && <PinnedRail onOpen={setOpenProject} />}
      {mode === 'carousel' && <DragCarousel onOpen={setOpenProject} />}
      {mode === 'stack' && (
        <div className="shell mt-14 flex flex-col gap-6 pb-28 sm:pb-36">
          {projects.map((p) => (
            <ProjectCard key={p.number} project={p} onOpen={() => setOpenProject(p)} />
          ))}
        </div>
      )}

      <ProjectModal project={openProject} onClose={() => setOpenProject(null)} />
    </section>
  );
}

/* ---------------------------------------------------------------- desktop */

function PinnedRail({ onOpen }: { onOpen: (p: Project) => void }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(0);
  const lenis = useLenis();

  // Lenis owns the scroll position, so ScrollTrigger has to be told to re-read
  // it — otherwise the scrub lags a frame behind the page.
  useEffect(() => {
    if (!lenis) return;
    const onScroll = () => ScrollTrigger.update();
    lenis.on('scroll', onScroll);
    return () => lenis.off('scroll', onScroll);
  }, [lenis]);

  // Measure the travel and keep it in state, so the wrapper's height is set in
  // CSS rather than by ScrollTrigger's pin-spacer.
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const measure = () => {
      setDistance(Math.max(0, track.scrollWidth - window.innerWidth + 96));
      ScrollTrigger.refresh();
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  useLayoutEffect(() => {
    if (!distance) return;
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // Deliberately NOT using ScrollTrigger's `pin`. The pin is handled by CSS
      // `position: sticky` below, which needs no JavaScript at all — so if GSAP
      // fails to initialise or its ticker is throttled, the section still lays
      // out correctly and the cards simply don't slide. With `pin: true` the
      // same failure collapses the whole section.
      gsap.to(trackRef.current, {
        x: -distance,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: `+=${distance}`,
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [distance]);

  return (
    <div
      ref={sectionRef}
      style={{ height: `calc(100vh + ${distance}px)` }}
      className="relative mt-12"
    >
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div ref={trackRef} className="flex gap-8 pl-6 pr-24 sm:pl-10 lg:pl-16">
          {projects.map((p) => (
            <ProjectCard
              key={p.number}
              project={p}
              onOpen={() => onOpen(p)}
              className="w-[min(78vw,620px)] shrink-0"
            />
          ))}
          <div className="flex w-[280px] shrink-0 items-center">
            <p className="meta leading-relaxed">
              End of selected work
              <span className="mt-3 block h-px w-16 bg-beige-200/20" />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- tablet */

function DragCarousel({ onOpen }: { onOpen: (p: Project) => void }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true,
  });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const sync = useCallback(() => {
    if (!emblaApi) return;
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    sync();
    emblaApi.on('select', sync).on('reInit', sync);
    return () => {
      emblaApi.off('select', sync).off('reInit', sync);
    };
  }, [emblaApi, sync]);

  return (
    <div className="mt-14 pb-28 sm:pb-36">
      {/* data-lenis-prevent stops Lenis hijacking the drag gesture */}
      <div ref={emblaRef} className="overflow-hidden" data-lenis-prevent>
        <div className="flex gap-6 pl-6 pr-6 sm:pl-10 sm:pr-10">
          {projects.map((p) => (
            <ProjectCard
              key={p.number}
              project={p}
              onOpen={() => onOpen(p)}
              className="w-[min(80vw,520px)] shrink-0"
            />
          ))}
        </div>
      </div>

      <div className="shell mt-8 flex items-center gap-3">
        <Button
          size="sm"
          onClick={() => emblaApi?.scrollPrev()}
          disabled={!canPrev}
          aria-label="Previous project"
        >
          <ArrowLeft aria-hidden />
        </Button>
        <Button
          size="sm"
          onClick={() => emblaApi?.scrollNext()}
          disabled={!canNext}
          aria-label="Next project"
        >
          <ArrowRight aria-hidden />
        </Button>
        <span className="meta ml-2">Drag to explore</span>
      </div>
    </div>
  );
}
