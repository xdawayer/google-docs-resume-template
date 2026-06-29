// Security boundary for imported/AI resume content. resumeSchema.parse() validates
// SHAPE only — NOT URL schemes. sanitizeResume() is the allowlist that neutralizes
// javascript:/data: link sinks and unsafe photo sources before any value reaches a
// template (<a href>, <img src>) or localStorage. Shared by the free import path now
// and the AI path in P2.
import { resumeSchema, type Resume } from "./resume-schema";

// Re-export so import-path modules depend on resume-core (P2 moves the schema here so
// Cloudflare Functions can import it without the large PERSONAS sample blob).
export { resumeSchema } from "./resume-schema";
export type { Resume } from "./resume-schema";

const SAFE_SCHEMES = ["https:", "mailto:", "tel:"];
const PHOTO_DATA_RE = /^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/i;
const PHOTO_MAX_LEN = 2_000_000; // ~2 MB data-URL ceiling

function toCandidate(raw: string): string {
  const s = (raw ?? "").trim();
  if (!s) return "";
  return /^[a-z][a-z0-9+.-]*:/i.test(s) ? s : `https://${s}`;
}

export function isSafeUrl(raw: string): boolean {
  const c = toCandidate(raw);
  // Embedded whitespace/CR/LF is a host/credential-confusion vector
  // (e.g. "https://example.com\n@evil.com" parses to host evil.com).
  if (!c || /\s/.test(c)) return false;
  try {
    return SAFE_SCHEMES.includes(new URL(c).protocol);
  } catch {
    return false;
  }
}

export function normalizeUrl(raw: string): string {
  const c = toCandidate(raw);
  return isSafeUrl(c) ? c : "";
}

function safePhoto(raw: string): string {
  const s = (raw ?? "").trim();
  if (!s) return "";
  if (/^https:\/\//i.test(s)) return s;
  if (s.length <= PHOTO_MAX_LEN && PHOTO_DATA_RE.test(s)) return s;
  return ""; // svg, oversized, javascript:, http:, etc.
}

// Strip C0 + C1 control chars, DEL, line/paragraph separators, and bidi
// embedding/override/isolate marks (U+202E etc. enable visual URL/label spoofing in
// the rendered resume), but KEEP tab (9), newline (10), CR (13) so multi-line fields
// survive a save. A char-code loop avoids fragile control-char regex literals.
const KEEP = new Set([9, 10, 13]);
function isStripped(c: number): boolean {
  if (c === 0x7f) return true; // DEL
  if (c <= 0x1f) return !KEEP.has(c); // C0 (keep tab/LF/CR)
  if (c >= 0x80 && c <= 0x9f) return true; // C1
  if (c === 0x2028 || c === 0x2029) return true; // line / paragraph separator
  if (c >= 0x202a && c <= 0x202e) return true; // bidi embeddings + overrides
  if (c >= 0x2066 && c <= 0x2069) return true; // bidi isolates
  return false;
}
function clean(s: string): string {
  let out = "";
  for (const ch of s ?? "") {
    if (!isStripped(ch.codePointAt(0) ?? 0)) out += ch;
  }
  return out;
}

export function sanitizeResume(input: Resume): Resume {
  const r = resumeSchema.parse(input); // shape + defaults
  return {
    ...r,
    basics: {
      ...r.basics,
      fullName: clean(r.basics.fullName),
      headline: clean(r.basics.headline),
      email: clean(r.basics.email),
      phone: clean(r.basics.phone),
      location: clean(r.basics.location),
      photo: safePhoto(r.basics.photo),
      links: r.basics.links.map((l) => ({ label: clean(l.label), url: normalizeUrl(l.url) })),
    },
    summary: clean(r.summary),
    highlights: r.highlights.map(clean),
    jobTarget: {
      title: clean(r.jobTarget.title),
      employmentType: clean(r.jobTarget.employmentType),
      locations: clean(r.jobTarget.locations),
      salary: clean(r.jobTarget.salary),
      availability: clean(r.jobTarget.availability),
    },
    experience: r.experience.map((e) => ({
      ...e,
      title: clean(e.title),
      company: clean(e.company),
      location: clean(e.location),
      start: clean(e.start),
      end: clean(e.end),
      bullets: e.bullets.map(clean),
    })),
    projects: r.projects.map((p) => ({
      ...p,
      name: clean(p.name),
      role: clean(p.role),
      link: normalizeUrl(p.link),
      start: clean(p.start),
      end: clean(p.end),
      bullets: p.bullets.map(clean),
    })),
    education: r.education.map((ed) => ({
      ...ed,
      school: clean(ed.school),
      degree: clean(ed.degree),
      field: clean(ed.field),
      location: clean(ed.location),
      graduation: clean(ed.graduation),
      details: clean(ed.details),
    })),
    skills: r.skills.map((s) => ({ category: clean(s.category), items: clean(s.items) })),
  };
}
