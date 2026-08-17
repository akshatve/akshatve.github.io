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
    title: 'Fake News Classifier',
    period: '05/2026 – 06/2026',
    // Description and skills supplied directly by Akshat.
    points: [
      'Engineered an end-to-end NLP credibility pipeline using a corpus of ~44K real-world news articles to evaluate news authenticity beyond simple binary labels.',
      'Built and benchmarked a classical lexical model (TF-IDF + Logistic Regression) against a fine-tuned contextual Transformer (DistilBERT), achieving 99% test accuracy on held-out data.',
      'Designed a probabilistic output framework featuring token attribution highlighting and calibrated confidence scoring to prioritize ethical, non-binary credibility assessments over false certainty.',
    ],
    skills: [
      'Python',
      'TF-IDF + Logistic Regression',
      'DistilBERT (Transformers)',
      'Model Benchmarking',
      'Token Attribution',
      'Confidence Calibration',
    ],
    visual: 'fakenews',
  },
  {
    number: '02',
    title: 'GoodsFlow — Inventory & Shortage Analytics Platform',
    period: '04/2026',
    points: [
      'Engineered an end-to-end predictive logistics pipeline in Python with data seeding for edge cases; developed a localized shortage scorer and demand trend analyzer outputting JSON datasets for downstream dashboards.',
    ],
    skills: ['Python', 'JSON'],
    visual: 'flow',
  },
  {
    number: '03',
    title: 'Applied Financial Analytics for Business Insights',
    period: '01/2026 – 03/2026',
    // Description supplied directly by Akshat.
    points: [
      'The Applied Financial Analytics Dashboard is an interactive Python-based platform engineered to execute automated quantitative evaluations and linear predictive modeling across fundamental enterprise data. Built using Python data engineering and visualization tools, the application translates multi-year financial disclosures into dynamic visual indicators and statistical metrics.',
      'Centered on a preloaded machine learning analytics dataset spanning two decades of historical financial records (2006–2025) for major technology corporations like Apple Inc. and Alphabet Inc., the platform synthesizes data across income statements, balance sheets, and cash flow reports to evaluate key metrics such as revenue streams, net margins, return on assets, return on equity, and EBITDA.',
      'To deliver forward-looking financial insights, the system incorporates an integrated Python-driven ordinary least squares (OLS) linear regression engine that calculates statistical parameters — including R² scores, t-statistics, p-values, and 3-year confidence interval forecasts — to quantify trend strength and evaluate projected growth trajectories.',
      'In addition to pre-configured enterprise analytics, the platform features a flexible data ingestion module. Through an interactive upload workspace, users can import custom multi-statement CSV files for automated data parsing, feature extraction, and statistical regression calculation directly within the application runtime.',
    ],
    // Drawn only from the technologies named in the description above.
    skills: [
      'Python',
      'OLS Linear Regression',
      'Financial Statement Analysis',
      'Statistical Inference (R², t-stats, p-values)',
      'Confidence Interval Forecasting',
      'Feature Extraction',
      'CSV Data Ingestion & Parsing',
      'Data Visualisation',
    ],
    visual: 'finance',
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
