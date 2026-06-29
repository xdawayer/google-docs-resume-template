/**
 * Section ORDER model — the order of the reorderable resume modules, shared by the
 * editor's left form (collapsible panels with up/down controls) and the live preview
 * (each template renders the sections it shows in its main flow in this order).
 *
 * Personal Info is the fixed identity header (always first) and Skills is a fixed
 * section (placed by each template — sidebar or end), so neither is reorderable.
 * The orderable set maps to the competing editor's module list (BOSS直聘:
 * 个人优势 → 期望职位 → 工作经历 → 项目经历 → 教育经历), with our Summary leading.
 */

export const ORDERABLE_KEYS = [
  "summary",
  "highlights",
  "jobTarget",
  "experience",
  "projects",
  "education",
] as const;

export type SectionKey = (typeof ORDERABLE_KEYS)[number];

// Default order (BOSS直聘 module sequence, Summary first as the intro). This also
// equals the templates' historical hard-coded order, so the default renders identically.
export const DEFAULT_ORDER: readonly SectionKey[] = [
  "summary",
  "highlights",
  "jobTarget",
  "experience",
  "projects",
  "education",
];

export const SECTION_LABELS: Record<SectionKey, string> = {
  summary: "Summary",
  highlights: "Highlights",
  jobTarget: "Job Target",
  experience: "Experience",
  projects: "Projects",
  education: "Education",
};

function isKey(k: unknown): k is SectionKey {
  return typeof k === "string" && (ORDERABLE_KEYS as readonly string[]).includes(k);
}

/**
 * Coerce any input into a valid permutation of ORDERABLE_KEYS: drop unknown keys,
 * de-duplicate, then append any missing keys in their default position. A corrupt
 * or partial stored order always loads as a complete, usable order.
 */
export function normalizeOrder(input: unknown): SectionKey[] {
  const seen = new Set<SectionKey>();
  const out: SectionKey[] = [];
  if (Array.isArray(input)) {
    for (const k of input) {
      if (isKey(k) && !seen.has(k)) {
        seen.add(k);
        out.push(k);
      }
    }
  }
  for (const k of DEFAULT_ORDER) {
    if (!seen.has(k)) out.push(k);
  }
  return out;
}

export function defaultOrder(): SectionKey[] {
  return [...DEFAULT_ORDER];
}

/** Immutably move `key` one step in `dir` (-1 up, +1 down); out-of-range is a no-op. */
export function moveSection(order: SectionKey[], key: SectionKey, dir: -1 | 1): SectionKey[] {
  const i = order.indexOf(key);
  if (i < 0) return order;
  const j = i + dir;
  if (j < 0 || j >= order.length) return order;
  const next = order.slice();
  const a = next[i]!;
  const b = next[j]!;
  next[i] = b;
  next[j] = a;
  return next;
}

const STORAGE_KEY = "resumedocs.order.v1";

export function loadOrder(): SectionKey[] | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return normalizeOrder(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveOrder(order: SectionKey[]): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeOrder(order)));
  } catch {
    /* quota / private mode — ignore */
  }
}
