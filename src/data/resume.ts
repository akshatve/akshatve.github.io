import type {
  Certification,
  Education,
  Experience,
  Leadership,
  NavItem,
  Project,
  SkillGroup,
} from '@/types';

/**
 * ─────────────────────────────────────────────────────────────────────
 * SOURCE OF TRUTH — content comes from Akshat's résumé, plus additions he
 * has supplied directly (marked inline where they differ from the PDF).
 *
 * Nothing here may be invented by anyone else. No fabricated metrics, dates,
 * employers, links, or outcomes. If neither the résumé nor Akshat states it,
 * it does not appear on the site.
 * ─────────────────────────────────────────────────────────────────────
 */

export const profile = {
  name: 'Akshat Verma',
  title: 'Data Science Undergraduate',
  location: 'Davis, CA',
  phone: '+1 (530) 564-9941',
  /** Unformatted, for the tel: href. */
  phoneRaw: '+15305649941',
  email: 'akshat.verma3005@gmail.com',
  /**
   * `summary`     → <meta> description / Open Graph (full résumé summary)
   * `summaryLead` → hero introduction
   * `about`       → About section paragraphs
   */
  summary:
    'Motivated Data Science undergraduate with a strong foundation in statistical modelling, data analysis, and visualisation. Experienced in leadership and cross-functional communication, with a proven ability to leverage technical skills for impactful results.',
  summaryLead:
    'Motivated Data Science undergraduate with a strong foundation in statistical modelling, data analysis, and visualisation.',
  /** About section copy, written by Akshat. Rendered as separate paragraphs. */
  about: [
    'As a Data Science undergraduate at UC Davis, I am passionate about building end-to-end machine learning models, exploring natural language processing, and turning complex datasets into actionable insights. My technical toolkit relies heavily on Python, R, and SQL, with hands-on experience spanning adversarial NLP pipelines, predictive logistics analytics, and optimized relational database queries.',
    'Beyond technical development, I bring real-world corporate analytics experience from industry internships, along with proven leadership as a former Marketing Director and Project Lead. I thrive at the intersection of quantitative analysis and strategic problem-solving, where I can translate technical findings into high-impact business solutions and collaborate with cross-functional teams.',
  ],
  /** Hero metadata strip. */
  metadata: ['AKSHAT VERMA', 'DATA SCIENCE', 'UC DAVIS'],
} as const;

export const navItems: NavItem[] = [
  { id: 'about', label: 'About', index: '01' },
  { id: 'experience', label: 'Experience', index: '02' },
  { id: 'leadership', label: 'Leadership', index: '03' },
  { id: 'projects', label: 'Projects', index: '04' },
  { id: 'skills', label: 'Skills', index: '05' },
  { id: 'certifications', label: 'Certifications', index: '06' },
  { id: 'contact', label: 'Contact', index: '07' },
];

export const education: Education = {
  school: 'University of California, Davis',
  degree: 'B.S. in Data Science',
  period: '2023 – 2027',
};

/** Discipline labels animated into place in the About section. */
export const disciplines = [
  'DATA SCIENCE',
  'STATISTICAL MODELLING',
  'DATA ANALYSIS',
  'VISUALIZATION',
];

export const experiences: Experience[] = [
  {
    company: 'Biocipher Technologies Private Limited',
    role: 'Data Scientist Intern',
    period: '06/2024 – 08/2024',
    points: [
      'Extracted, cleaned, and modeled corporate datasets to identify operational trends and generate actionable business intelligence.',
      'Built automated workflows and contributed visualizations to research reports used in executive decision-making.',
    ],
  },
  {
    company: 'Wealth Clinic',
    role: 'Research and Financial Data Analyst Intern',
    period: '03/2023 – 07/2023',
    // Supplied directly by Akshat (not present in the PDF résumé).
    points: [
      'Engineered data extraction and cleaning workflows using Python and SQL to query Tally ERP 9 ledgers, transforming raw financial data into structured datasets for analysis.',
      'Designed statistical scripts to detect transaction anomalies and discrepancies across balance sheets, improving auditing accuracy and data integrity.',
    ],
  },
];

export const leadership: Leadership[] = [
  {
    organization: 'Machine Learning Student Network',
    position: 'Marketing Director',
    period: '12/2024 – 06/2026',
    // Description and skills supplied directly by Akshat.
    points: [
      'Served as Marketing Director for the Machine Learning Student Network, directing end-to-end social media outreach, professional branding, and recruitment campaigns across Instagram, Discord, and LinkedIn.',
      'Designed digital visual assets and structured targeted promo strategy in coordination with cross-functional club teams.',
      'Streamlined multi-channel campaign execution to expand club visibility, drive member acquisition, and elevate organizational presence across professional networks.',
    ],
    skills: [
      'Social Media Strategy & Brand Management (Instagram, Discord, LinkedIn)',
      'Digital Campaign & Recruitment Planning',
      'Visual Asset Design & Content Creation',
      'Cross-Functional Team Leadership',
      'Community Engagement & Outreach',
    ],
  },
  {
    organization: 'Davis Data Science Club',
    position: 'Project Lead',
    period: '01/2026 – 03/2026',
    // Description and skills supplied directly by Akshat.
    points: [
      'Led an end-to-end financial analytics project for the Davis Data Science Club, managing a team through the ingestion, cleaning, and standardization of 15–20 years of multi-statement financial data using the Alpha Vantage API.',
      'Engineered key metrics like gross margins, net margins, and Return on Equity (ROE) across major tech firms by consolidating disparate income statements, balance sheets, and cash flow reports into clean timeline datasets.',
      'Performed exploratory data analysis and applied regression models to uncover profitability drivers, evaluate risk, and synthesize quantitative trends into actionable business insights and visual reports.',
    ],
    skills: [
      'Python (Pandas, NumPy)',
      'REST APIs (Alpha Vantage API)',
      'Data Cleaning & Standardization',
      'Feature Engineering & Financial Ratio Calculation',
      'Exploratory Data Analysis (EDA)',
      'Linear & Logistic Regression',
      'Data Visualisation & Reporting',
      'Technical Project Leadership',
    ],
  },
];

export const projects: Project[] = [
  {
    number: '01',
    title: 'Fake Review Detection Pipeline',
    period: '05/2026 – 06/2026',
    teaser: 'Adversarial robustness testing for review classification.',
    summary:
      'Co-authored a detection pipeline on a 40,000-instance Amazon-style dataset combining TF-IDF n-grams with 15 stylometric features; built a TextAttack multi-perturbation framework to quantify classifier degradation under adversarial attacks.',
    context: 'Co-authored a detection pipeline on a 40,000-instance Amazon-style dataset.',
    built: [
      'Combined TF-IDF n-grams with 15 stylometric features.',
      'Built a TextAttack multi-perturbation framework.',
      'Quantified classifier degradation under adversarial attacks.',
    ],
    // Only technologies the résumé ties to THIS project. Python, scikit-learn
    // and RoBERTa appear under Skills but are not attributed here, so listing
    // them on this card would be an invented association.
    tech: ['TF-IDF n-grams', 'Stylometric Features', 'TextAttack'],
    visual: 'text',
  },
  {
    number: '02',
    title: 'GoodsFlow — Inventory & Shortage Analytics Platform',
    period: '04/2026',
    teaser: 'End-to-end predictive logistics pipeline.',
    summary:
      'Engineered an end-to-end predictive logistics pipeline in Python with data seeding for edge cases; developed a localized shortage scorer and demand trend analyzer outputting JSON datasets for downstream dashboards.',
    context:
      'An end-to-end predictive logistics pipeline engineered in Python, with data seeding for edge cases.',
    built: [
      'Developed a localized shortage scorer.',
      'Built a demand trend analyzer.',
      'Output JSON datasets for downstream dashboards.',
    ],
    tech: ['Python', 'JSON'],
    visual: 'flow',
  },
  {
    number: '03',
    title: 'Applied Financial Analytics for Business Insights',
    period: '01/2026 – 03/2026',
    teaser: 'Financial ratios, regression and risk categorization.',
    summary:
      "Led DDSC's end-to-end financial analytics project; engineered financial ratios from company statements and stock price data, applied linear regression for profitability trends and logistic regression for risk categorization.",
    context:
      "Led the Davis Data Science Club's end-to-end financial analytics project.",
    built: [
      'Engineered financial ratios from company statements and stock price data.',
      'Applied linear regression for profitability trends.',
      'Applied logistic regression for risk categorization.',
    ],
    tech: ['Linear Regression', 'Logistic Regression'],
    visual: 'finance',
  },
  {
    number: '04',
    title: 'Stack Exchange Relational Data Analysis',
    period: '05/2026',
    teaser: 'SQL workflows over a 2.4+ GB SQLite dataset.',
    summary:
      'Optimized SQL workflows on a 2.4+ GB SQLite Cross Validated dataset using RSQLite and DBI; modeled response times, tag frequencies, and the impact of bounties on community engagement in R.',
    context:
      'Optimized SQL workflows on a 2.4+ GB SQLite Cross Validated dataset.',
    built: [
      'Optimized SQL workflows using RSQLite and DBI.',
      'Modeled response times and tag frequencies.',
      'Modeled the impact of bounties on community engagement in R.',
    ],
    tech: ['R', 'SQL', 'SQLite', 'RSQLite', 'DBI'],
    visual: 'database',
  },
];

/** Titles/issuers from the résumé; `description` written by Akshat. */
export const certifications: Certification[] = [
  {
    title: 'AI Professional Skills',
    detail: 'AI for real-world projects',
    issuer: 'OpenAI',
    description:
      'I applied OpenAI frameworks to solve complex challenges by building and evaluating scalable, intelligent AI solutions.',
  },
  {
    title: 'Data Analysis',
    detail: 'Excel-based recommendations',
    issuer: 'GRAMMY Awards',
    description:
      'I performed quantitative analysis on GRAMMY Awards media datasets using advanced Excel modeling to deliver strategic recommendations.',
  },
  {
    title: 'Data Visualization',
    detail: 'Tableau dashboards',
    issuer: 'Intel',
    description:
      'I designed interactive Tableau dashboards using Intel corporate datasets to transform multi-variable data into executive-ready visual insights.',
  },
  {
    title: 'Intercultural Skills',
    detail: 'Global team collaboration',
    issuer: 'UNESCO',
    description:
      'I developed cross-cultural communication strategies and emotional intelligence frameworks to collaborate effectively across international teams.',
  },
];

export const skillGroups: SkillGroup[] = [
  {
    label: 'Programming & Tools',
    items: ['Python', 'R', 'SQL', 'SQLite', 'Excel', 'Tableau', 'Tally ERP 9', 'Jupyter', 'Git'],
  },
  {
    label: 'ML & NLP',
    items: [
      'scikit-learn',
      'Logistic / Linear Regression',
      'Random Forest',
      'RoBERTa',
      'TF-IDF',
      'TextAttack',
    ],
  },
  {
    label: 'Data & Analytics',
    items: [
      'Statistical Modelling',
      'Data Visualization',
      'Predictive Analytics',
      'GIS Analysis',
    ],
  },
];
