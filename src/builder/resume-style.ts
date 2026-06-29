import { z } from "zod";

/**
 * The resume STYLE model — typography and color knobs that sit in the editor's
 * top toolbar (font, size, line spacing, accent), decoupled from the CONTENT
 * model (resume-schema.ts). Style is applied to the live preview as a small set
 * of CSS custom properties; every template reads them with a fallback to its own
 * native value, so a fully-default style changes nothing (zero visual regression).
 *
 * Trust boundary: these values are user-controlled and flow into a `style="…"`
 * attribute. They are NEVER free text in CSS — font comes from a fixed allowlist,
 * accent is validated to `#rrggbb`, and the scales are clamped numbers. A corrupt
 * localStorage value can only ever degrade to a default, never inject CSS.
 */

export interface FontOption {
  readonly id: string;
  readonly label: string;
  /** A system-only stack (no web-font fetch — keeps the builder network-free). */
  readonly stack: string;
}

// "auto" carries an empty stack: it means "let each template keep its own font".
export const FONT_OPTIONS: readonly FontOption[] = [
  { id: "auto", label: "Template font", stack: "" },
  {
    id: "sans",
    label: "Sans",
    stack: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  {
    id: "humanist",
    label: "Humanist",
    stack: '"Segoe UI", Candara, "Helvetica Neue", Arial, sans-serif',
  },
  { id: "serif", label: "Serif", stack: 'Georgia, "Times New Roman", Times, serif' },
  { id: "slab", label: "Slab", stack: '"Rockwell", "Roboto Slab", Georgia, serif' },
  {
    id: "mono",
    label: "Mono",
    stack: 'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace',
  },
] as const;

const FONT_IDS = ["auto", "sans", "humanist", "serif", "slab", "mono"] as const;

export interface AccentPreset {
  readonly id: string;
  readonly label: string;
  /** "" = template's own brand color. Otherwise a `#rrggbb` value. */
  readonly value: string;
}
export const ACCENT_PRESETS: readonly AccentPreset[] = [
  { id: "auto", label: "Template color", value: "" },
  { id: "navy", label: "Navy", value: "#1f3a5f" },
  { id: "blue", label: "Blue", value: "#1a4fa0" },
  { id: "teal", label: "Teal", value: "#0f766e" },
  { id: "green", label: "Green", value: "#3fae5a" },
  { id: "plum", label: "Plum", value: "#7c3aed" },
  { id: "crimson", label: "Crimson", value: "#b3122e" },
  { id: "mono", label: "Black", value: "#1a1a1a" },
] as const;

export const SCALE_MIN = 0.85;
export const SCALE_MAX = 1.2;
export const SCALE_STEP = 0.05;
export const LINE_MIN = 0.85;
export const LINE_MAX = 1.35;
export const LINE_STEP = 0.05;

const HEX = /^#[0-9a-fA-F]{6}$/;

function clamp(n: number, lo: number, hi: number): number {
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : lo;
}
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
function normalizeAccent(a: string): string {
  return HEX.test(a) ? a.toLowerCase() : "";
}

// `.catch()` on every field means a bad value degrades to a default instead of
// throwing — a corrupt localStorage blob still loads as a usable (default) style.
export const styleSchema = z.object({
  font: z.enum(FONT_IDS).catch("auto"),
  scale: z.coerce
    .number()
    .catch(1)
    .transform((n) => clamp(round2(n), SCALE_MIN, SCALE_MAX)),
  lineScale: z.coerce
    .number()
    .catch(1)
    .transform((n) => clamp(round2(n), LINE_MIN, LINE_MAX)),
  accent: z.string().catch("").transform(normalizeAccent),
});

export type ResumeStyle = z.infer<typeof styleSchema>;

export function defaultStyle(): ResumeStyle {
  return styleSchema.parse({});
}

/** Re-validate any input into a safe ResumeStyle; never throws. */
export function sanitizeStyle(input: unknown): ResumeStyle {
  const r = styleSchema.safeParse(input ?? {});
  return r.success ? r.data : defaultStyle();
}

export function fontStack(id: string): string {
  return FONT_OPTIONS.find((f) => f.id === id)?.stack ?? "";
}

/**
 * Serialize only the NON-default knobs into a CSS-custom-property string for the
 * preview wrapper's `style` attribute. At full default this returns "" so no
 * inline style is emitted and every template renders exactly as it does today.
 */
export function styleVarString(s: ResumeStyle): string {
  const parts: string[] = [];
  // fontStack returns "" for any id outside the allowlist; accent is re-checked
  // against the hex pattern here too (defense in depth) so nothing but a known
  // stack and a `#rrggbb` value can ever reach the inline `style` attribute.
  const stack = fontStack(s.font);
  if (stack) parts.push(`--rb-font:${stack}`);
  if (Number.isFinite(s.scale) && s.scale !== 1) parts.push(`--rb-scale:${s.scale}`);
  if (Number.isFinite(s.lineScale) && s.lineScale !== 1)
    parts.push(`--rb-line-scale:${s.lineScale}`);
  if (HEX.test(s.accent)) parts.push(`--rb-accent:${s.accent}`);
  return parts.join(";");
}

const STORAGE_KEY = "resumedocs.style.v1";

export function loadStyle(): ResumeStyle | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return sanitizeStyle(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveStyle(style: ResumeStyle): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizeStyle(style)));
  } catch {
    /* quota / private mode — ignore, preview still works in-memory */
  }
}
