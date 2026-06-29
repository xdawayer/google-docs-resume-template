import { z } from "zod";

/**
 * The resume CONTENT model — the single source of truth shared by the form, the
 * templates, and localStorage. Content is decoupled from style: the user fills
 * this in; a template renders it; the browser prints it to an ATS-friendly PDF.
 * MVP sections only (YAGNI): basics, summary, experience, education, skills.
 */

export const linkSchema = z.object({ label: z.string().default(""), url: z.string().default("") });

export const experienceSchema = z.object({
  title: z.string().default(""),
  company: z.string().default(""),
  location: z.string().default(""),
  start: z.string().default(""),
  end: z.string().default(""),
  bullets: z.array(z.string()).default([]),
});

export const educationSchema = z.object({
  school: z.string().default(""),
  degree: z.string().default(""),
  field: z.string().default(""),
  location: z.string().default(""),
  graduation: z.string().default(""),
  details: z.string().default(""),
});

// MVP keeps skills simple: a named group with a comma-separated list.
export const skillGroupSchema = z.object({
  category: z.string().default(""),
  items: z.string().default(""),
});

export const resumeSchema = z.object({
  basics: z
    .object({
      fullName: z.string().default(""),
      headline: z.string().default(""),
      email: z.string().default(""),
      phone: z.string().default(""),
      location: z.string().default(""),
      photo: z.string().default(""), // optional URL/data-URL; templates fall back to initials
      links: z.array(linkSchema).default([]),
    })
    .default({}),
  summary: z.string().default(""),
  experience: z.array(experienceSchema).default([]),
  education: z.array(educationSchema).default([]),
  skills: z.array(skillGroupSchema).default([]),
});

export type Link = z.infer<typeof linkSchema>;
export type Experience = z.infer<typeof experienceSchema>;
export type Education = z.infer<typeof educationSchema>;
export type SkillGroup = z.infer<typeof skillGroupSchema>;
export type Resume = z.infer<typeof resumeSchema>;

export const TEMPLATE_IDS = [
  "ats-minimal",
  "executive",
  "modern-sidebar",
  "creative",
  "fresh-graduate",
  "bold",
] as const;
export type TemplateId = (typeof TEMPLATE_IDS)[number];

export interface TemplateMeta {
  label: string;
  /** Single-column, parser-safe. Two-column / designed templates set this false. */
  atsSafe: boolean;
}
export const TEMPLATE_META: Record<TemplateId, TemplateMeta> = {
  "ats-minimal": { label: "ATS Minimal", atsSafe: true },
  executive: { label: "Executive Elegant", atsSafe: true },
  "modern-sidebar": { label: "Modern Sidebar", atsSafe: false },
  creative: { label: "Creative Portfolio", atsSafe: false },
  "fresh-graduate": { label: "Fresh Graduate", atsSafe: false },
  bold: { label: "Bold Two-Column", atsSafe: false },
};

export function emptyExperience(): Experience {
  return { title: "", company: "", location: "", start: "", end: "", bullets: [""] };
}
export function emptyEducation(): Education {
  return { school: "", degree: "", field: "", location: "", graduation: "", details: "" };
}
export function emptySkillGroup(): SkillGroup {
  return { category: "", items: "" };
}

/** A filled example so the preview is never blank on first load. */
/**
 * One sample persona per template, chosen to suit each design (an executive for
 * Executive Elegant, a designer for Creative, a new grad for Fresh Graduate, …).
 * Switching templates on an untouched sample swaps to the fitting persona so the
 * preview always shows relevant content; once the user edits, their content stays.
 */
const PERSONAS: Record<TemplateId, unknown> = {
  "ats-minimal": {
    basics: {
      fullName: "Alex Morgan",
      headline: "Marketing Specialist",
      email: "alex.morgan@email.com",
      phone: "(555) 123-4567",
      location: "Austin, TX",
      links: [{ label: "LinkedIn", url: "linkedin.com/in/alexmorgan" }],
    },
    summary:
      "Results-driven marketing specialist with 6 years of experience developing data-informed campaigns that increase brand awareness, engagement, and conversion.",
    experience: [
      {
        title: "Marketing Specialist",
        company: "Brightline Digital",
        location: "Austin, TX",
        start: "2021",
        end: "Present",
        bullets: [
          "Planned multi-channel campaigns across email, social, and search that grew qualified leads 35%.",
          "Cut cost per acquisition 22% by reworking audience targeting and landing-page copy.",
        ],
      },
      {
        title: "Marketing Coordinator",
        company: "Summit Creative",
        location: "Austin, TX",
        start: "2018",
        end: "2021",
        bullets: [
          "Increased website traffic 28% and generated 250+ marketing-qualified leads per quarter.",
        ],
      },
    ],
    education: [
      {
        school: "University of Texas at Austin",
        degree: "B.B.A.",
        field: "Marketing",
        location: "Austin, TX",
        graduation: "2018",
      },
    ],
    skills: [
      { category: "Marketing", items: "Content Strategy, SEO, Email, Paid Social" },
      { category: "Tools", items: "HubSpot, Google Analytics, Figma, Notion" },
    ],
  },

  executive: {
    basics: {
      fullName: "James Anderson",
      headline: "Chief Operating Officer",
      email: "james.anderson@email.com",
      phone: "(555) 248-1090",
      location: "New York, NY",
      links: [{ label: "LinkedIn", url: "linkedin.com/in/jamesanderson" }],
    },
    summary:
      "Accomplished operations executive with 20+ years driving enterprise performance, organizational transformation, and sustainable growth across global markets.",
    experience: [
      {
        title: "Chief Operating Officer",
        company: "Summit Global Industries",
        location: "New York, NY",
        start: "2019",
        end: "Present",
        bullets: [
          "Led a $1.2B operation to 22% margin expansion through restructuring and disciplined capital allocation.",
          "Built a 600-person org across four regions and reduced operating costs 18% over three years.",
        ],
      },
      {
        title: "SVP, Operations",
        company: "Vertex Holdings",
        location: "Chicago, IL",
        start: "2013",
        end: "2019",
        bullets: [
          "Integrated three acquisitions, standardizing systems and capturing $40M in annual synergies.",
        ],
      },
    ],
    education: [
      {
        school: "The Wharton School",
        degree: "M.B.A.",
        field: "Finance & Strategy",
        location: "Philadelphia, PA",
        graduation: "2003",
      },
    ],
    skills: [
      { category: "Leadership", items: "P&L Ownership, M&A, Org Design, Board Reporting" },
      { category: "Operations", items: "Supply Chain, Lean, Transformation, Risk" },
    ],
  },

  "modern-sidebar": {
    basics: {
      fullName: "Alex Morgan",
      headline: "Senior Software Engineer",
      email: "alex.morgan@email.com",
      phone: "(555) 123-4567",
      location: "Austin, TX",
      links: [{ label: "LinkedIn", url: "linkedin.com/in/alexmorgan" }],
    },
    summary:
      "Backend-leaning full-stack engineer with 7 years building reliable, high-scale services. I care about latency, clean APIs, and shipping.",
    experience: [
      {
        title: "Senior Software Engineer",
        company: "Northwind Systems",
        location: "Austin, TX",
        start: "2022",
        end: "Present",
        bullets: [
          "Cut p95 API latency from 850ms to 210ms by adding a read-through cache and trimming N+1 queries.",
          "Shipped a CI pipeline that dropped mean deploy time from 40 to 9 minutes across 14 services.",
        ],
      },
      {
        title: "Software Engineer",
        company: "Bluepeak",
        location: "Remote",
        start: "2019",
        end: "2022",
        bullets: [
          "Designed an idempotent retry layer that reduced duplicate-charge incidents to zero over 12 months.",
        ],
      },
    ],
    education: [
      {
        school: "University of Texas at Austin",
        degree: "B.S.",
        field: "Computer Science",
        location: "Austin, TX",
        graduation: "2019",
      },
    ],
    skills: [
      { category: "Languages", items: "TypeScript, Go, Python, SQL" },
      { category: "Infrastructure", items: "AWS, Docker, Postgres, Redis" },
    ],
  },

  creative: {
    basics: {
      fullName: "Maya Rivera",
      headline: "Graphic Designer",
      email: "maya.rivera@email.com",
      phone: "(555) 770-3321",
      location: "Los Angeles, CA",
      links: [
        { label: "Portfolio", url: "mayarivera.design" },
        { label: "Dribbble", url: "dribbble.com/mayarivera" },
      ],
    },
    summary:
      "Multidisciplinary designer with 6 years shaping brand identities, campaigns, and digital products for lifestyle and tech clients.",
    experience: [
      {
        title: "Senior Graphic Designer",
        company: "Brightside Studio",
        location: "Los Angeles, CA",
        start: "2021",
        end: "Present",
        bullets: [
          "Led the rebrand of a national retail client, lifting brand-recall scores 31% in post-launch surveys.",
          "Designed campaign systems shipped across web, social, and print for 12+ launches a year.",
        ],
      },
      {
        title: "Graphic Designer",
        company: "Bluefin Agency",
        location: "Remote",
        start: "2018",
        end: "2021",
        bullets: [
          "Built reusable design systems that cut production time on recurring deliverables by 40%.",
        ],
      },
    ],
    education: [
      {
        school: "Rhode Island School of Design",
        degree: "B.F.A.",
        field: "Graphic Design",
        location: "Providence, RI",
        graduation: "2018",
      },
    ],
    skills: [
      { category: "Design", items: "Branding, Layout, Typography, Illustration" },
      { category: "Tools", items: "Figma, Photoshop, Illustrator, After Effects" },
    ],
  },

  "fresh-graduate": {
    basics: {
      fullName: "Jordan Lee",
      headline: "Business Administration Graduate",
      email: "jordan.lee@email.com",
      phone: "(555) 412-7788",
      location: "Toronto, ON",
      links: [{ label: "LinkedIn", url: "linkedin.com/in/jordanlee" }],
    },
    summary:
      "Recent business administration graduate with a marketing focus, eager to apply coursework, internship, and project experience to a first full-time role.",
    experience: [
      {
        title: "Marketing Intern",
        company: "Brightpath Labs",
        location: "Toronto, ON",
        start: "May 2024",
        end: "Aug 2024",
        bullets: [
          "Supported a product-launch campaign that reached 18k students through email and campus channels.",
          "Built a weekly performance dashboard adopted by the four-person marketing team.",
        ],
      },
    ],
    education: [
      {
        school: "University of Toronto",
        degree: "B.B.A.",
        field: "Business Administration",
        location: "Toronto, ON",
        graduation: "2025",
        details:
          "Relevant coursework: Marketing Analytics, Consumer Behavior, Financial Accounting.",
      },
    ],
    skills: [
      { category: "Skills", items: "Market Research, Excel, Copywriting, Social Media" },
      { category: "Tools", items: "Google Analytics, Canva, HubSpot, Notion" },
    ],
  },

  bold: {
    basics: {
      fullName: "Jordan Mitchell",
      headline: "Marketing Manager",
      email: "jordan.mitchell@email.com",
      phone: "(555) 423-4487",
      location: "Austin, TX",
      links: [{ label: "LinkedIn", url: "linkedin.com/in/jordanmitchell" }],
    },
    summary:
      "Results-driven marketing manager with 7+ years leading brand, demand-gen, and content teams that grow pipeline and measurable impact.",
    experience: [
      {
        title: "Marketing Manager",
        company: "Brightwave Solutions",
        location: "Austin, TX",
        start: "2020",
        end: "Present",
        bullets: [
          "Owned a $2M budget and led a five-person team to 42% YoY pipeline growth.",
          "Launched an ABM program that produced $6M in influenced revenue in its first year.",
        ],
      },
      {
        title: "Senior Marketing Specialist",
        company: "Elevate Tech Group",
        location: "Austin, TX",
        start: "2017",
        end: "2020",
        bullets: ["Scaled content and paid programs that doubled inbound MQLs over two years."],
      },
    ],
    education: [
      {
        school: "Texas A&M University",
        degree: "B.S.",
        field: "Marketing",
        location: "College Station, TX",
        graduation: "2016",
      },
    ],
    skills: [
      { category: "Marketing", items: "Demand Gen, Brand, ABM, Content Strategy" },
      { category: "Tools", items: "HubSpot, Salesforce, GA4, Asana" },
    ],
  },
};

export function sampleFor(template: TemplateId): Resume {
  return resumeSchema.parse(PERSONAS[template]);
}

/** Default sample (used on first load before a template is chosen). */
export function sampleResume(): Resume {
  return sampleFor("ats-minimal");
}

/** True when `r` is still an untouched sample persona (no user edits yet). */
export function isPristineSample(r: Resume): boolean {
  const sig = JSON.stringify(r);
  return TEMPLATE_IDS.some((id) => JSON.stringify(sampleFor(id)) === sig);
}

const STORAGE_KEY = "resumedocs.builder.v1";

export function loadResume(): Resume | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return resumeSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveResume(resume: Resume): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(resume));
  } catch {
    /* quota / private mode — ignore, preview still works in-memory */
  }
}
