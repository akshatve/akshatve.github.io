import dynamic from 'next/dynamic';
import { Navbar } from '@/components/layout/navbar';
import { ScrollProgress } from '@/components/layout/scroll-progress';
import { Hero } from '@/components/sections/hero';
import { About } from '@/components/sections/about';

/**
 * Everything below the fold is code-split — the hero and about ship in the
 * initial bundle, the rest streams in as the visitor scrolls.
 */
const Experience = dynamic(() =>
  import('@/components/sections/experience').then((m) => m.Experience),
);
const Leadership = dynamic(() =>
  import('@/components/sections/leadership').then((m) => m.Leadership),
);
const Projects = dynamic(() => import('@/components/sections/projects').then((m) => m.Projects));
const Skills = dynamic(() => import('@/components/sections/skills').then((m) => m.Skills));
const Certifications = dynamic(() =>
  import('@/components/sections/certifications').then((m) => m.Certifications),
);
const Contact = dynamic(() => import('@/components/sections/contact').then((m) => m.Contact));
const Footer = dynamic(() => import('@/components/layout/footer').then((m) => m.Footer));
const Cursor = dynamic(() => import('@/components/layout/cursor').then((m) => m.Cursor));
const DataField = dynamic(() => import('@/components/layout/data-field').then((m) => m.DataField));

export default function HomePage() {
  return (
    <>
      <DataField />
      <div className="grain" aria-hidden />
      <Cursor />
      <ScrollProgress />
      <Navbar />

      <main id="main" className="relative z-[1]">
        <Hero />
        <About />
        <Experience />
        <Leadership />
        <Projects />
        <Skills />
        <Certifications />
        <Contact />
      </main>

      <Footer />
    </>
  );
}
