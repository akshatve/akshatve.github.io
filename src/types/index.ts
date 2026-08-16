export type SectionId =
  | 'hero'
  | 'about'
  | 'experience'
  | 'leadership'
  | 'projects'
  | 'skills'
  | 'certifications'
  | 'contact';

export interface NavItem {
  id: Exclude<SectionId, 'hero'>;
  label: string;
  /** Two-digit index rendered as editorial metadata. */
  index: string;
}

export interface Experience {
  company: string;
  role: string;
  period: string;
  /** Verbatim bullets from the résumé. Never paraphrase or extend these. */
  points: string[];
}

export interface Leadership {
  organization: string;
  position: string;
  period: string;
  points: string[];
  /** Optional skill pills rendered beneath the description. */
  skills?: string[];
}

export interface Project {
  /** Display index, e.g. "01". */
  number: string;
  title: string;
  period: string;
  /** One-line teaser shown in the closed card. */
  teaser: string;
  /** Full résumé sentence, shown in the expanded case study. */
  summary: string;
  /** Short context line — derived only from what the résumé states. */
  context: string;
  /** Discrete points of what was built, split from the résumé sentence. */
  built: string[];
  tech: string[];
  /** Decorative visual treatment key — not data-bearing. */
  visual: 'text' | 'flow' | 'finance' | 'database';
}

export interface Certification {
  title: string;
  /** Short qualifier from the résumé line, e.g. "Tableau dashboards". */
  detail: string;
  issuer: string;
  /** Fuller description of the work, written by Akshat. */
  description: string;
}

export interface SkillGroup {
  label: string;
  items: string[];
}

export interface Education {
  school: string;
  degree: string;
  period: string;
}
