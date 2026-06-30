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

// Projects (项目经历): like an experience entry but for a named project, with an
// optional link. `link` is a URL sink — sanitizeResume routes it through normalizeUrl.
export const projectSchema = z.object({
  name: z.string().default(""),
  role: z.string().default(""),
  link: z.string().default(""),
  start: z.string().default(""),
  end: z.string().default(""),
  bullets: z.array(z.string()).default([]),
});

// Job target (期望职位): the single objective block — target role, type, where,
// pay, and availability. All optional; an all-empty block renders nothing.
export const jobTargetSchema = z.object({
  title: z.string().default(""),
  employmentType: z.string().default(""),
  locations: z.string().default(""),
  salary: z.string().default(""),
  availability: z.string().default(""),
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
  // Highlights (个人优势): a short bulleted list of strengths/selling points.
  highlights: z.array(z.string()).default([]),
  jobTarget: jobTargetSchema.default({}),
  experience: z.array(experienceSchema).default([]),
  projects: z.array(projectSchema).default([]),
  education: z.array(educationSchema).default([]),
  skills: z.array(skillGroupSchema).default([]),
});

export type Link = z.infer<typeof linkSchema>;
export type Experience = z.infer<typeof experienceSchema>;
export type Education = z.infer<typeof educationSchema>;
export type SkillGroup = z.infer<typeof skillGroupSchema>;
export type Project = z.infer<typeof projectSchema>;
export type JobTarget = z.infer<typeof jobTargetSchema>;
export type Resume = z.infer<typeof resumeSchema>;

export const TEMPLATE_IDS = [
  "ats-minimal",
  "executive",
  "modern-sidebar",
  "creative",
  "fresh-graduate",
  "bold",
  "technical",
  "header-band",
  "clinical",
  "academic",
  "corporate",
  "timeline",
  "portrait",
  "minimalist",
  "functional",
  "compact",
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
  technical: { label: "Technical", atsSafe: true },
  "header-band": { label: "Header Band", atsSafe: true },
  clinical: { label: "Clinical", atsSafe: true },
  academic: { label: "Academic", atsSafe: true },
  corporate: { label: "Corporate", atsSafe: true },
  timeline: { label: "Timeline", atsSafe: false },
  portrait: { label: "Portrait", atsSafe: false },
  minimalist: { label: "Minimalist", atsSafe: true },
  functional: { label: "Functional", atsSafe: true },
  compact: { label: "Compact", atsSafe: true },
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
export function emptyProject(): Project {
  return { name: "", role: "", link: "", start: "", end: "", bullets: [""] };
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
    highlights: [
      "6 years turning audience data into multi-channel campaigns that move pipeline.",
      "Cut cost per acquisition 22% while growing qualified leads 35%.",
    ],
    jobTarget: {
      title: "Senior Marketing Specialist",
      employmentType: "Full-time",
      locations: "Austin, TX · Remote",
      salary: "$85k–$105k",
      availability: "Open to offers",
    },
    projects: [
      {
        name: "Lifecycle Email Revamp",
        role: "Campaign Lead",
        link: "",
        start: "2022",
        end: "2023",
        bullets: ["Rebuilt the onboarding series, lifting activation 18% in one quarter."],
      },
    ],
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
    highlights: [
      "20+ years scaling global operations and leading multi-region transformation.",
      "Repeated margin expansion through restructuring and disciplined capital allocation.",
    ],
    jobTarget: {
      title: "Chief Operating Officer",
      employmentType: "Full-time",
      locations: "New York, NY",
      salary: "",
      availability: "Open to board & operating roles",
    },
    projects: [
      {
        name: "Enterprise Restructuring Program",
        role: "Executive Sponsor",
        link: "",
        start: "2020",
        end: "2022",
        bullets: ["Led a four-region restructuring that expanded operating margin 22%."],
      },
    ],
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
    highlights: [
      "7 years building reliable, high-scale backend services.",
      "Obsessed with latency, clean APIs, and shipping safely.",
    ],
    jobTarget: {
      title: "Senior / Staff Software Engineer",
      employmentType: "Full-time",
      locations: "Austin, TX · Remote",
      salary: "$170k–$210k",
      availability: "Available in 30 days",
    },
    projects: [
      {
        name: "Read-through Cache Layer",
        role: "Tech Lead",
        link: "",
        start: "2023",
        end: "2023",
        bullets: ["Cut p95 API latency from 850ms to 210ms across 14 services."],
      },
    ],
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
    highlights: [
      "6 years shaping brand identities and campaign systems end to end.",
      "Lifted brand-recall scores 31% on a national retail rebrand.",
    ],
    jobTarget: {
      title: "Senior Brand / Product Designer",
      employmentType: "Full-time",
      locations: "Los Angeles, CA · Remote",
      salary: "",
      availability: "Open to offers",
    },
    projects: [
      {
        name: "National Retail Rebrand",
        role: "Design Lead",
        link: "mayarivera.design",
        start: "2022",
        end: "2023",
        bullets: [
          "Delivered a cross-channel identity system shipped across web, social, and print.",
        ],
      },
    ],
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
    highlights: [
      "Business administration graduate with a marketing focus.",
      "Hands-on internship and campus-project experience in campaigns and analytics.",
    ],
    jobTarget: {
      title: "Marketing Coordinator / Analyst",
      employmentType: "Full-time",
      locations: "Toronto, ON",
      salary: "",
      availability: "Available immediately",
    },
    projects: [
      {
        name: "Campus Launch Campaign",
        role: "Project Lead",
        link: "",
        start: "2024",
        end: "2024",
        bullets: ["Reached 18k students through email and campus channels for a product launch."],
      },
    ],
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
    highlights: [
      "7+ years leading brand, demand-gen, and content teams.",
      "Drove 42% YoY pipeline growth on a $2M budget.",
    ],
    jobTarget: {
      title: "Director of Marketing / Marketing Manager",
      employmentType: "Full-time",
      locations: "Austin, TX · Remote",
      salary: "$130k–$160k",
      availability: "Open to offers",
    },
    projects: [
      {
        name: "ABM Program Launch",
        role: "Program Owner",
        link: "",
        start: "2021",
        end: "2022",
        bullets: ["Built an ABM program that influenced $6M in revenue in year one."],
      },
    ],
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

  technical: {
    basics: {
      fullName: "Daniel Park",
      headline: "Software Engineer",
      email: "daniel.park@email.com",
      phone: "(555) 318-2204",
      location: "Seattle, WA",
      links: [
        { label: "GitHub", url: "github.com/danielpark" },
        { label: "LinkedIn", url: "linkedin.com/in/danielpark" },
      ],
    },
    summary:
      "Full-stack software engineer with 6 years building cloud services and developer tooling. I care about reliability, clean interfaces, and shipping measurable wins.",
    highlights: [
      "6 years shipping cloud services across the stack, from API to infrastructure.",
      "Cut build times 60% and reduced production incidents by half.",
    ],
    jobTarget: {
      title: "Senior Software Engineer",
      employmentType: "Full-time",
      locations: "Seattle, WA · Remote",
      salary: "$160k–$200k",
      availability: "Available in 30 days",
    },
    projects: [
      {
        name: "Internal Deploy Platform",
        role: "Tech Lead",
        link: "",
        start: "2023",
        end: "2024",
        bullets: [
          "Built a self-serve deploy platform adopted by 20+ teams, cutting release lead time 70%.",
        ],
      },
    ],
    experience: [
      {
        title: "Software Engineer",
        company: "Cloudgrid",
        location: "Seattle, WA",
        start: "2021",
        end: "Present",
        bullets: [
          "Designed a service-mesh migration that cut p95 latency 45% across 30 services.",
          "Reduced CI build times from 22 to 9 minutes, saving ~80 engineer-hours weekly.",
        ],
      },
      {
        title: "Software Engineer",
        company: "Datawave",
        location: "Remote",
        start: "2018",
        end: "2021",
        bullets: [
          "Built an event-driven ingestion pipeline processing 4B events/day at 99.99% uptime.",
        ],
      },
    ],
    education: [
      {
        school: "University of Washington",
        degree: "B.S.",
        field: "Computer Science",
        location: "Seattle, WA",
        graduation: "2018",
      },
    ],
    skills: [
      { category: "Languages", items: "TypeScript, Go, Python, Rust, SQL" },
      { category: "Infrastructure", items: "AWS, Kubernetes, Terraform, Postgres, Kafka" },
    ],
  },

  "header-band": {
    basics: {
      fullName: "Sophia Bennett",
      headline: "Account Executive",
      email: "sophia.bennett@email.com",
      phone: "(555) 902-7741",
      location: "Chicago, IL",
      links: [{ label: "LinkedIn", url: "linkedin.com/in/sophiabennett" }],
    },
    summary:
      "Enterprise account executive with 8 years closing complex B2B deals and growing strategic accounts. Consistent quota-beating performer focused on durable customer value.",
    highlights: [
      "8 years exceeding quota in enterprise B2B sales.",
      "Closed $14M in new ARR over three years at 128% average quota attainment.",
    ],
    jobTarget: {
      title: "Senior Account Executive",
      employmentType: "Full-time",
      locations: "Chicago, IL · Remote",
      salary: "$120k base · $240k OTE",
      availability: "Open to offers",
    },
    projects: [
      {
        name: "Land-and-Expand Play",
        role: "Deal Lead",
        link: "",
        start: "2022",
        end: "2023",
        bullets: ["Designed an expansion motion that grew three accounts from $90k to $1.2M ARR."],
      },
    ],
    experience: [
      {
        title: "Account Executive",
        company: "Apex Software",
        location: "Chicago, IL",
        start: "2020",
        end: "Present",
        bullets: [
          "Closed $14M in new ARR across enterprise accounts at 128% average quota attainment.",
          "Built a referral pipeline that sourced 30% of net-new bookings in 2023.",
        ],
      },
      {
        title: "Sales Development Representative",
        company: "Brightline",
        location: "Chicago, IL",
        start: "2017",
        end: "2020",
        bullets: ["Booked 400+ qualified meetings and was promoted to AE within 18 months."],
      },
    ],
    education: [
      {
        school: "University of Illinois",
        degree: "B.A.",
        field: "Communications",
        location: "Urbana, IL",
        graduation: "2016",
      },
    ],
    skills: [
      { category: "Sales", items: "Enterprise B2B, MEDDIC, Forecasting, Negotiation" },
      { category: "Tools", items: "Salesforce, Outreach, Gong, Sales Navigator" },
    ],
  },

  clinical: {
    basics: {
      fullName: "Emily Carter",
      headline: "Registered Nurse, BSN",
      email: "emily.carter@email.com",
      phone: "(555) 640-1187",
      location: "Denver, CO",
      links: [{ label: "LinkedIn", url: "linkedin.com/in/emilycarterrn" }],
    },
    summary:
      "Compassionate registered nurse with 7 years of acute-care experience across medical-surgical and ICU settings. Committed to safe, patient-centered care and strong interdisciplinary teamwork.",
    highlights: [
      "7 years of acute-care nursing across med-surg and ICU.",
      "Maintained a 98% patient-satisfaction score across 2023.",
    ],
    jobTarget: {
      title: "ICU Registered Nurse",
      employmentType: "Full-time",
      locations: "Denver, CO",
      salary: "",
      availability: "Available immediately",
    },
    projects: [
      {
        name: "Falls-Reduction Initiative",
        role: "Unit Champion",
        link: "",
        start: "2022",
        end: "2023",
        bullets: ["Led a falls-prevention protocol that cut unit fall rates 35% in six months."],
      },
    ],
    experience: [
      {
        title: "Registered Nurse, ICU",
        company: "Denver General Hospital",
        location: "Denver, CO",
        start: "2020",
        end: "Present",
        bullets: [
          "Provided critical care for up to 3 high-acuity patients per shift in a 24-bed ICU.",
          "Precepted 8 new-graduate nurses, improving unit onboarding time and retention.",
        ],
      },
      {
        title: "Registered Nurse, Med-Surg",
        company: "Front Range Medical Center",
        location: "Boulder, CO",
        start: "2017",
        end: "2020",
        bullets: [
          "Managed care for 5–6 patients per shift with a focus on safe medication administration.",
        ],
      },
    ],
    education: [
      {
        school: "University of Colorado",
        degree: "B.S.N.",
        field: "Nursing",
        location: "Aurora, CO",
        graduation: "2017",
      },
    ],
    skills: [
      { category: "Licenses & Certifications", items: "RN License (CO), BLS, ACLS, PALS" },
      {
        category: "Clinical Skills",
        items: "Critical Care, IV Therapy, EHR (Epic), Patient Education",
      },
    ],
  },

  academic: {
    basics: {
      fullName: "Sarah Thompson",
      headline: "High School Science Teacher",
      email: "sarah.thompson@email.com",
      phone: "(555) 271-9930",
      location: "Portland, OR",
      links: [{ label: "LinkedIn", url: "linkedin.com/in/sarahthompson" }],
    },
    summary:
      "Dedicated high school science teacher with 9 years designing inquiry-based curricula that raise engagement and outcomes. Experienced in differentiated instruction and AP Biology.",
    highlights: [
      "9 years teaching high school biology and chemistry.",
      "Raised AP Biology pass rates from 68% to 89% over three years.",
    ],
    jobTarget: {
      title: "Science Department Lead",
      employmentType: "Full-time",
      locations: "Portland, OR",
      salary: "",
      availability: "Available for the 2026–27 school year",
    },
    projects: [
      {
        name: "STEM Curriculum Redesign",
        role: "Lead Author",
        link: "",
        start: "2022",
        end: "2023",
        bullets: [
          "Redesigned the 10th-grade science curriculum around inquiry labs, lifting engagement 22%.",
        ],
      },
    ],
    experience: [
      {
        title: "High School Science Teacher",
        company: "Lincoln High School",
        location: "Portland, OR",
        start: "2019",
        end: "Present",
        bullets: [
          "Taught AP Biology and Chemistry to 140+ students, raising AP pass rates from 68% to 89%.",
          "Mentored three first-year teachers and chaired the science assessment committee.",
        ],
      },
      {
        title: "Science Teacher",
        company: "Maple Grove High School",
        location: "Salem, OR",
        start: "2016",
        end: "2019",
        bullets: ["Built hands-on lab units that increased state science proficiency 15%."],
      },
    ],
    education: [
      {
        school: "University of Oregon",
        degree: "M.Ed.",
        field: "Science Education",
        location: "Eugene, OR",
        graduation: "2016",
        details: "B.S. in Biology, 2014. Relevant: Curriculum Design, Educational Assessment.",
      },
    ],
    skills: [
      {
        category: "Certifications",
        items: "Oregon Teaching License, AP Biology Certified, CPR/First Aid",
      },
      {
        category: "Skills",
        items: "Curriculum Design, Differentiated Instruction, Google Classroom, Assessment",
      },
    ],
  },

  corporate: {
    basics: {
      fullName: "Michael Chen",
      headline: "Senior Financial Analyst",
      email: "michael.chen@email.com",
      phone: "(555) 488-3360",
      location: "New York, NY",
      links: [{ label: "LinkedIn", url: "linkedin.com/in/michaelchen" }],
    },
    summary:
      "CPA and senior financial analyst with 8 years in FP&A and corporate finance. I translate complex data into decisions that protect margin and fund growth.",
    highlights: [
      "8 years in FP&A, forecasting, and management reporting.",
      "Built models that informed $200M+ in capital-allocation decisions.",
    ],
    jobTarget: {
      title: "Finance Manager / FP&A Lead",
      employmentType: "Full-time",
      locations: "New York, NY · Hybrid",
      salary: "$130k–$160k",
      availability: "Open to offers",
    },
    projects: [
      {
        name: "Annual Budgeting Overhaul",
        role: "Project Lead",
        link: "",
        start: "2022",
        end: "2023",
        bullets: [
          "Rebuilt the budgeting process, cutting cycle time 40% and tightening forecast accuracy to within 3%.",
        ],
      },
    ],
    experience: [
      {
        title: "Senior Financial Analyst",
        company: "Meridian Capital",
        location: "New York, NY",
        start: "2020",
        end: "Present",
        bullets: [
          "Owned FP&A for a $500M business unit, delivering monthly forecasts within 3% of actuals.",
          "Identified $4.2M in annual cost savings through margin and vendor analysis.",
        ],
      },
      {
        title: "Financial Analyst",
        company: "Harbor Industries",
        location: "Jersey City, NJ",
        start: "2016",
        end: "2020",
        bullets: ["Built the three-statement model used in a $120M acquisition and integration."],
      },
    ],
    education: [
      {
        school: "New York University",
        degree: "B.S.",
        field: "Finance & Accounting",
        location: "New York, NY",
        graduation: "2016",
      },
    ],
    skills: [
      { category: "Certifications", items: "CPA, CFA Level II" },
      { category: "Finance", items: "FP&A, Financial Modeling, Forecasting, Valuation, GAAP" },
      { category: "Tools", items: "Excel, SAP, NetSuite, Tableau, SQL" },
    ],
  },

  timeline: {
    basics: {
      fullName: "David Wilson",
      headline: "Project Manager, PMP",
      email: "david.wilson@email.com",
      phone: "(555) 753-2218",
      location: "Atlanta, GA",
      links: [{ label: "LinkedIn", url: "linkedin.com/in/davidwilson" }],
    },
    summary:
      "PMP-certified project manager with 9 years delivering cross-functional programs on time and under budget. Skilled at aligning stakeholders and de-risking complex delivery.",
    highlights: [
      "9 years delivering cross-functional programs end to end.",
      "Delivered a $5M program three weeks early and 8% under budget.",
    ],
    jobTarget: {
      title: "Senior Project / Program Manager",
      employmentType: "Full-time",
      locations: "Atlanta, GA · Remote",
      salary: "$115k–$140k",
      availability: "Open to offers",
    },
    projects: [
      {
        name: "ERP Rollout",
        role: "Program Manager",
        link: "",
        start: "2022",
        end: "2023",
        bullets: [
          "Led a 14-month ERP rollout across five departments, delivered on time with 92% adoption.",
        ],
      },
    ],
    experience: [
      {
        title: "Project Manager",
        company: "Summit Logistics",
        location: "Atlanta, GA",
        start: "2019",
        end: "Present",
        bullets: [
          "Managed a $12M portfolio of programs, delivering 95% of milestones on schedule.",
          "Cut average project delivery time 18% by standardizing intake and stage-gate reviews.",
        ],
      },
      {
        title: "Associate Project Manager",
        company: "Brightpath Consulting",
        location: "Atlanta, GA",
        start: "2015",
        end: "2019",
        bullets: [
          "Coordinated cross-functional teams of 20+ across concurrent client engagements.",
        ],
      },
    ],
    education: [
      {
        school: "Georgia Institute of Technology",
        degree: "B.S.",
        field: "Industrial Engineering",
        location: "Atlanta, GA",
        graduation: "2014",
      },
    ],
    skills: [
      { category: "Certifications", items: "PMP, Certified ScrumMaster (CSM)" },
      { category: "Skills", items: "Agile, Stakeholder Management, Risk Management, Roadmapping" },
      { category: "Tools", items: "Jira, Asana, MS Project, Confluence" },
    ],
  },

  portrait: {
    basics: {
      fullName: "Olivia Hayes",
      headline: "Real Estate Agent",
      email: "olivia.hayes@email.com",
      phone: "(555) 614-2208",
      location: "Scottsdale, AZ",
      photo:
        "data:image/png;base64,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",
      links: [{ label: "Website", url: "oliviahayes.realty" }],
    },
    summary:
      "Licensed real estate agent with 7 years guiding buyers and sellers through residential transactions. Relationship-driven, with a record of fast closings and high client referral rates.",
    highlights: [
      "Closed $42M in residential volume over three years.",
      "Maintained a 4.9-star client rating across 120+ reviews.",
    ],
    jobTarget: {
      title: "Senior Real Estate Agent",
      employmentType: "Full-time",
      locations: "Scottsdale, AZ",
      salary: "",
      availability: "Open to new brokerage",
    },
    projects: [
      {
        name: "Luxury Listings Program",
        role: "Lead Agent",
        link: "",
        start: "2022",
        end: "2023",
        bullets: [
          "Grew the luxury segment 60% by building a referral and staging partner network.",
        ],
      },
    ],
    experience: [
      {
        title: "Real Estate Agent",
        company: "Desert Sky Realty",
        location: "Scottsdale, AZ",
        start: "2019",
        end: "Present",
        bullets: [
          "Closed $42M in residential volume, averaging 28 transactions a year at 98% of list price.",
          "Built a referral pipeline that drove 65% of new business through past-client relationships.",
        ],
      },
      {
        title: "Real Estate Associate",
        company: "Canyon Realty Group",
        location: "Phoenix, AZ",
        start: "2017",
        end: "2019",
        bullets: ["Supported a top-producing team and managed 40+ active listings end to end."],
      },
    ],
    education: [
      {
        school: "Arizona State University",
        degree: "B.S.",
        field: "Business Administration",
        location: "Tempe, AZ",
        graduation: "2016",
      },
    ],
    skills: [
      { category: "Licenses", items: "AZ Real Estate License, Notary Public" },
      { category: "Strengths", items: "Negotiation, Staging, CRM, Market Analysis" },
    ],
  },

  minimalist: {
    basics: {
      fullName: "Ethan Brooks",
      headline: "Product Manager",
      email: "ethan.brooks@email.com",
      phone: "(555) 207-4419",
      location: "San Francisco, CA",
      links: [{ label: "LinkedIn", url: "linkedin.com/in/ethanbrooks" }],
    },
    summary:
      "Product manager with 7 years shipping B2B SaaS products from discovery to launch. I keep teams focused on the few things that move retention and revenue.",
    highlights: [
      "Shipped products that grew net revenue retention from 104% to 121%.",
      "Run lean discovery — fewer, better bets, validated before build.",
    ],
    jobTarget: {
      title: "Senior Product Manager",
      employmentType: "Full-time",
      locations: "San Francisco, CA · Remote",
      salary: "$160k–$190k",
      availability: "Open to offers",
    },
    projects: [
      {
        name: "Self-Serve Onboarding",
        role: "Product Lead",
        link: "",
        start: "2023",
        end: "2024",
        bullets: [
          "Launched a self-serve flow that lifted activation 27% and cut time-to-value in half.",
        ],
      },
    ],
    experience: [
      {
        title: "Product Manager",
        company: "Northstar Software",
        location: "San Francisco, CA",
        start: "2021",
        end: "Present",
        bullets: [
          "Owned the activation and retention roadmap, growing net revenue retention from 104% to 121%.",
          "Led a four-team launch that added $3.4M in new ARR in its first two quarters.",
        ],
      },
      {
        title: "Associate Product Manager",
        company: "Lumen Apps",
        location: "Remote",
        start: "2018",
        end: "2021",
        bullets: [
          "Shipped a billing redesign that cut involuntary churn 19% through smarter dunning.",
        ],
      },
    ],
    education: [
      {
        school: "University of California, Berkeley",
        degree: "B.A.",
        field: "Cognitive Science",
        location: "Berkeley, CA",
        graduation: "2018",
      },
    ],
    skills: [
      { category: "Product", items: "Discovery, Roadmapping, A/B Testing, Analytics" },
      { category: "Tools", items: "Amplitude, Figma, Jira, SQL" },
    ],
  },

  functional: {
    basics: {
      fullName: "Maria Santos",
      headline: "Operations Coordinator",
      email: "maria.santos@email.com",
      phone: "(555) 330-8852",
      location: "Tampa, FL",
      links: [{ label: "LinkedIn", url: "linkedin.com/in/mariasantos" }],
    },
    summary:
      "Detail-driven coordinator transitioning into operations, with transferable strengths in scheduling, vendor communication, and process improvement built across customer-facing roles.",
    highlights: [
      "Transferable strengths in process, scheduling, and stakeholder communication.",
      "Cut a recurring scheduling error rate to near zero with a simple checklist system.",
    ],
    jobTarget: {
      title: "Operations Coordinator",
      employmentType: "Full-time",
      locations: "Tampa, FL · Hybrid",
      salary: "",
      availability: "Available immediately",
    },
    projects: [
      {
        name: "Scheduling Overhaul",
        role: "Initiative Owner",
        link: "",
        start: "2024",
        end: "2024",
        bullets: [
          "Designed a shift-handoff checklist that cut scheduling errors 90% across two teams.",
        ],
      },
    ],
    experience: [
      {
        title: "Customer Service Lead",
        company: "Bayshore Retail",
        location: "Tampa, FL",
        start: "2021",
        end: "Present",
        bullets: [
          "Coordinated schedules and vendor deliveries for a 25-person store, improving on-time stocking 30%.",
        ],
      },
      {
        title: "Front Office Administrator",
        company: "Gulf Coast Clinic",
        location: "Tampa, FL",
        start: "2018",
        end: "2021",
        bullets: [
          "Managed booking, billing, and supplier communication for a busy three-provider clinic.",
        ],
      },
    ],
    education: [
      {
        school: "Hillsborough Community College",
        degree: "A.A.",
        field: "Business Administration",
        location: "Tampa, FL",
        graduation: "2018",
      },
    ],
    skills: [
      {
        category: "Operations",
        items: "Scheduling, Process Improvement, Inventory, Vendor Management",
      },
      { category: "Communication", items: "Customer Service, Conflict Resolution, Documentation" },
      { category: "Tools", items: "Excel, Google Workspace, Slack, QuickBooks" },
    ],
  },

  compact: {
    basics: {
      fullName: "Daniel Reed",
      headline: "Senior Operations Manager",
      email: "daniel.reed@email.com",
      phone: "(555) 901-7763",
      location: "Columbus, OH",
      links: [{ label: "LinkedIn", url: "linkedin.com/in/danielreed" }],
    },
    summary:
      "Operations manager with 12 years scaling distribution and service teams. I turn messy processes into measured systems that cut cost and lift throughput.",
    highlights: [
      "12 years leading operations across distribution and customer service.",
      "Drove a 24% productivity gain while reducing headcount cost 11%.",
    ],
    jobTarget: {
      title: "Director of Operations",
      employmentType: "Full-time",
      locations: "Columbus, OH",
      salary: "$120k–$150k",
      availability: "Open to offers",
    },
    projects: [
      {
        name: "Warehouse Automation Rollout",
        role: "Program Owner",
        link: "",
        start: "2022",
        end: "2023",
        bullets: ["Deployed pick-path automation that lifted throughput 24% and cut errors 38%."],
      },
    ],
    experience: [
      {
        title: "Senior Operations Manager",
        company: "Midwest Distribution Co.",
        location: "Columbus, OH",
        start: "2018",
        end: "Present",
        bullets: [
          "Ran a 180-person, three-shift operation, lifting on-time fulfillment from 91% to 99%.",
          "Cut annual operating cost $1.8M through routing, staffing, and vendor renegotiation.",
        ],
      },
      {
        title: "Operations Manager",
        company: "Lakeside Logistics",
        location: "Cleveland, OH",
        start: "2014",
        end: "2018",
        bullets: ["Standardized warehouse SOPs across four sites, reducing safety incidents 45%."],
      },
      {
        title: "Operations Supervisor",
        company: "Cardinal Freight",
        location: "Columbus, OH",
        start: "2011",
        end: "2014",
        bullets: ["Supervised a 40-person shift and led the move to a new 120k-sq-ft facility."],
      },
    ],
    education: [
      {
        school: "Ohio State University",
        degree: "B.S.",
        field: "Supply Chain Management",
        location: "Columbus, OH",
        graduation: "2011",
      },
    ],
    skills: [
      { category: "Operations", items: "Lean, Six Sigma, S&OP, Forecasting, KPI Design" },
      { category: "Leadership", items: "Team Building, Hiring, Coaching, Change Management" },
      { category: "Systems", items: "SAP, NetSuite, WMS, Tableau, Excel" },
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
