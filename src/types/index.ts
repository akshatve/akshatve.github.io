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
  /** Description paragraphs. Same shape as Leadership.points. */
  points: string[];
  /** Skill / technology pills rendered beneath the description. */
  skills: string[];
  /**
   * Visual treatment. 'fakenews' renders a bespoke interactive panel; the
   * others are abstract decorative motifs carrying no data.
   */
  visual: 'fakenews' | 'text' | 'flow' | 'finance';
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
