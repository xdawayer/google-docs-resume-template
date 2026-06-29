// Best-effort, English/US-format-first segmentation. Imperfect by design — the editor
// + per-field confidence are the safety net. The caller sanitizes + schema-validates;
// here we just shape the text into a Resume.
import { resumeSchema, type Resume } from "../resume-core";
import type { ExtractedText, FieldConfidence, ParseResult, ResumeParser } from "./types";

const NBSP = String.fromCharCode(0xa0);
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/;
const PHONE_RE = /(\+?\d[\d\s().-]{7,}\d)/;
const URL_RE =
  /((https?:\/\/)?(www\.)?(linkedin\.com|github\.com|[\w-]+\.[a-z]{2,})(\/[\w./#?=-]*)?)/gi;
const DATE_RANGE_RE =
  /([A-Z][a-z]{2,9}\.?\s*\d{4}|\d{4})\s*[–\-—to]+\s*(present|current|[A-Z][a-z]{2,9}\.?\s*\d{4}|\d{4})/i;
const BULLET_RE = /^\s*[•\-*▪◦·]\s+/;
const DEGREE_RE =
  /\b(b\.?s\.?|b\.?a\.?|m\.?s\.?|m\.?a\.?|mba|ph\.?d\.?|bachelor|master|associate)\b/i;

type Section = "summary" | "experience" | "education" | "skills" | "other";

function classifyHeading(line: string): Section | null {
  const l = line.trim().toLowerCase().replace(/[:•]/g, "");
  if (l.length > 28) return null;
  if (/^(summary|profile|objective|about)$/.test(l)) return "summary";
  if (/^(experience|work experience|employment|professional experience)$/.test(l))
    return "experience";
  if (/^(education|academic)$/.test(l)) return "education";
  if (/^(skills|technical skills|core skills)$/.test(l)) return "skills";
  return null;
}

function splitTitleCompany(line: string): { title: string; company: string; location: string } {
  const parts = line
    .split(/\s+[—–|]\s+|\s+at\s+/i)
    .map((s) => s.trim())
    .filter(Boolean);
  const title = parts[0] ?? "";
  let company = "";
  let location = "";
  if (parts[1]) {
    const sub = parts[1].split(",").map((s) => s.trim());
    company = sub[0] ?? "";
    location = sub.slice(1).join(", ");
  }
  return { title, company, location };
}

function labelFor(u: string): string {
  return /linkedin/i.test(u) ? "LinkedIn" : /github/i.test(u) ? "GitHub" : "Website";
}

export class HeuristicParser implements ResumeParser {
  async parse(input: ExtractedText): Promise<ParseResult> {
    const warnings: string[] = [];
    const confidence: FieldConfidence = {};
    const lines = input.text.split(/\r?\n/).map((l) => l.split(NBSP).join(" ").trimEnd());
    const nonEmpty = lines.filter((l) => l.trim());
    const resume: Resume = resumeSchema.parse({});

    // --- contact block: first ~6 non-empty lines ---
    const head = nonEmpty.slice(0, 6).join("  ");
    const email = head.match(EMAIL_RE)?.[0] ?? "";
    const phone = head.match(PHONE_RE)?.[0]?.trim() ?? "";
    if (email) {
      resume.basics.email = email;
      confidence["/basics/email"] = 0.95;
    }
    if (phone) {
      resume.basics.phone = phone;
      confidence["/basics/phone"] = 0.8;
    }
    const urls = Array.from(head.matchAll(URL_RE))
      .map((m) => m[0])
      .filter((u) => !u.includes("@"));
    resume.basics.links = [...new Set(urls)]
      .slice(0, 4)
      .map((u) => ({ label: labelFor(u), url: u }));
    const nameLine = nonEmpty.find(
      (l) => !EMAIL_RE.test(l) && !PHONE_RE.test(l) && !classifyHeading(l),
    );
    if (nameLine) {
      resume.basics.fullName = nameLine.trim();
      confidence["/basics/fullName"] = 0.6;
    }

    // --- section partition ---
    const buckets: Record<Section, string[]> = {
      summary: [],
      experience: [],
      education: [],
      skills: [],
      other: [],
    };
    let cur: Section = "other";
    let headingsSeen = false;
    for (const raw of lines) {
      const h = classifyHeading(raw);
      if (h) {
        cur = h;
        headingsSeen = true;
        continue;
      }
      if (cur !== "other") buckets[cur].push(raw);
    }
    if (!headingsSeen)
      warnings.push("No section headings detected — parsed by position; please review.");

    // --- summary ---
    const summary = buckets.summary.join(" ").trim();
    if (summary) {
      resume.summary = summary;
      confidence["/summary"] = 0.7;
    }

    // --- experience ---
    resume.experience = parseExperience(buckets.experience, confidence, warnings);

    // --- education ---
    const eduLine = buckets.education.find((l) => DEGREE_RE.test(l) || /\b\d{4}\b/.test(l));
    if (eduLine) {
      const { title: degree, company: school, location } = splitTitleCompany(eduLine);
      resume.education = [
        {
          school: school || eduLine.replace(DATE_RANGE_RE, "").trim(),
          degree,
          field: "",
          location,
          graduation: eduLine.match(/\b\d{4}\b/)?.[0] ?? "",
          details: "",
        },
      ];
      confidence["/education/0"] = 0.6;
    }

    // --- skills ---
    const skills = buckets.skills.join(", ").replace(/^[,\s]+|[,\s]+$/g, "");
    if (skills) {
      resume.skills = [{ category: "Skills", items: skills }];
      confidence["/skills/0"] = 0.75;
    }

    return { resume, confidence, warnings };
  }
}

function parseExperience(
  block: string[],
  confidence: FieldConfidence,
  warnings: string[],
): Resume["experience"] {
  const out: Resume["experience"] = [];
  let i = 0;
  while (i < block.length) {
    const line = block[i];
    if (line === undefined) break;
    if (!line.trim() || BULLET_RE.test(line)) {
      i++;
      continue;
    }
    const { title, company, location } = splitTitleCompany(line);
    let start = "";
    let end = "";
    const onLine = line.match(DATE_RANGE_RE);
    const next = block[i + 1];
    if (onLine) {
      start = onLine[1] ?? "";
      end = onLine[2] ?? "";
    } else if (next && DATE_RANGE_RE.test(next)) {
      const m = next.match(DATE_RANGE_RE)!;
      start = m[1] ?? "";
      end = m[2] ?? "";
      i++;
    }
    const bullets: string[] = [];
    let j = i + 1;
    for (; j < block.length; j++) {
      const b = block[j];
      if (b === undefined || !b.trim()) continue;
      if (BULLET_RE.test(b)) bullets.push(b.replace(BULLET_RE, "").trim());
      else break;
    }
    if (title || company || bullets.length) {
      out.push({ title, company, location, start, end, bullets });
      confidence[`/experience/${out.length - 1}`] = title && company ? 0.65 : 0.4;
    }
    i = bullets.length ? j : i + 1;
  }
  if (!out.length) warnings.push("No work experience detected.");
  return out;
}
