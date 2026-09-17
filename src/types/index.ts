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
  /** Completion certificate image in /public. When set, a button opens it. */
  certificate?: string;
  /** Letter of recommendation image in /public. When set, an LOR button opens it. */
  recommendation?: string;
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
  /** Description paragraphs. Same shape as Leadership.points. */
  points: string[];
  /** Skill / technology pills rendered beneath the description. */
  skills: string[];
  /**
   * Visual treatment. 'fakenews' renders a bespoke interactive panel; the
   * others are abstract decorative motifs carrying no data.
   */
  visual: 'fakenews' | 'text' | 'flow' | 'finance' | 'adversarial';
  /**
   * Optional live demo. A site-relative path to a page in /public (served as
   * a static file) or an absolute URL. Renders a "Live Demo" button under
   * the date when present.
   */
  demo?: string;
}

export interface Certification {
  title: string;
  /** Short qualifier from the résumé line, e.g. "Tableau dashboards". */
  detail: string;
  issuer: string;
  /** Fuller description of the work, written by Akshat. */
  description: string;
  /** Badge image in /public. When set, a "View" button opens it. */
  badge?: string;
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
