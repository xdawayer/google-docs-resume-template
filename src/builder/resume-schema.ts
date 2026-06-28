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

export const TEMPLATE_IDS = ["classic", "modern", "compact"] as const;
export type TemplateId = (typeof TEMPLATE_IDS)[number];
export const TEMPLATE_LABELS: Record<TemplateId, string> = {
  classic: "Classic",
  modern: "Modern",
  compact: "Compact",
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
export function sampleResume(): Resume {
  return resumeSchema.parse({
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
        details: "",
      },
    ],
    skills: [
      { category: "Languages", items: "TypeScript, Go, Python, SQL" },
      { category: "Infrastructure", items: "AWS, Docker, Postgres, Redis" },
    ],
  });
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
