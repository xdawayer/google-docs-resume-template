/**
 * scripts/export-qa.ts — PDF/DOCX export QA (the `pnpm qa:export {slug}` command).
 *
 * Exports a template's Google Doc to PDF and DOCX via the Drive API, then checks
 * the exports are clean enough to ship: page count matches the declared
 * pageCount, the PDF has extractable text (so an ATS can read it), the expected
 * section headings survive the export, and the DOCX is a real, non-empty file.
 *
 * Core logic is the pure `evaluateExportQa()` so it is unit-testable without fs
 * or network. `main()` does the Drive export + pdfinfo/pdftotext and feeds it in.
 * Requires GOOGLE_SA_KEY (loaded from .env via scripts/lib/auth.ts) + poppler.
 */
import { execa } from "execa";
import { writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { templateSchema } from "../src/content/schema";
import { loadRawTemplates, TEMPLATES_DIR } from "./_shared";
import { hasCreds, getServiceAuth } from "./lib/auth";
import { driveClient } from "./lib/drive";

export type QaStatus = "pass" | "fail" | "warn";
export interface QaCheck {
  id: string;
  label: string;
  status: QaStatus;
  detail?: string;
}
export interface ExportQaInput {
  slug: string;
  pdfBytes: number;
  pdfPageCount: number | null; // null when pdfinfo could not determine it
  pdfText: string;
  docxBytes: number;
  expectedPageCount: number;
  expectedHeadings?: string[];
}
export interface ExportQaResult {
  slug: string;
  pass: boolean;
  checks: QaCheck[];
}

const MIN_FILE_BYTES = 1000;
const MIN_TEXT_CHARS = 200;

/** Pure QA over already-exported artifacts. `pass` = no failing check. */
export function evaluateExportQa(input: ExportQaInput): ExportQaResult {
  const checks: QaCheck[] = [];

  checks.push({
    id: "pdf-nonempty",
    label: "PDF export is a real file",
    status: input.pdfBytes >= MIN_FILE_BYTES ? "pass" : "fail",
    detail: `${input.pdfBytes} bytes`,
  });

  if (input.pdfPageCount === null) {
    checks.push({
      id: "pdf-pages",
      label: "PDF page count",
      status: "warn",
      detail: "pdfinfo unavailable",
    });
  } else {
    checks.push({
      id: "pdf-pages",
      label: `PDF page count == ${input.expectedPageCount}`,
      status: input.pdfPageCount === input.expectedPageCount ? "pass" : "fail",
      detail: `pages=${input.pdfPageCount}`,
    });
  }

  checks.push({
    id: "pdf-text",
    label: "PDF has extractable text (ATS-readable)",
    status: input.pdfText.trim().length >= MIN_TEXT_CHARS ? "pass" : "fail",
    detail: `${input.pdfText.trim().length} chars`,
  });

  const lower = input.pdfText.toLowerCase();
  const missing = (input.expectedHeadings ?? []).filter((h) => !lower.includes(h.toLowerCase()));
  if ((input.expectedHeadings ?? []).length > 0) {
    checks.push({
      id: "headings",
      label: "expected section headings survive export",
      status: missing.length === 0 ? "pass" : "warn",
      detail: missing.length ? `missing: ${missing.join(", ")}` : "all present",
    });
  }

  checks.push({
    id: "docx-nonempty",
    label: "DOCX export is a real file",
    status: input.docxBytes >= MIN_FILE_BYTES ? "pass" : "fail",
    detail: `${input.docxBytes} bytes`,
  });

  return { slug: input.slug, pass: checks.every((c) => c.status !== "fail"), checks };
}

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const ICON: Record<QaStatus, string> = { pass: "✓", fail: "✗", warn: "○" };

async function pdfInfo(pdfPath: string): Promise<{ pages: number | null; text: string }> {
  let pages: number | null = null;
  try {
    const { stdout } = await execa("pdfinfo", [pdfPath]);
    const m = stdout.match(/^Pages:\s+(\d+)/m);
    if (m) pages = Number(m[1]);
  } catch {
    pages = null;
  }
  let text = "";
  try {
    const { stdout } = await execa("pdftotext", [pdfPath, "-"]);
    text = stdout;
  } catch {
    text = "";
  }
  return { pages, text };
}

async function main(): Promise<void> {
  const only = process.argv.slice(2).find((a) => !a.startsWith("-"));
  if (!hasCreds()) {
    console.warn("⚠ qa:export: GOOGLE_SA_KEY not set — skipping (no-op).");
    return;
  }
  const drive = driveClient(getServiceAuth());
  const raws = loadRawTemplates(TEMPLATES_DIR, { includeDrafts: true });

  let failures = 0;
  for (const r of raws) {
    const res = templateSchema.safeParse(r.data);
    if (!res.success) continue;
    const t = res.data;
    if (only && t.slug !== only) continue;
    if (!t.copyUrl || !t.docId) continue; // builder: no Doc
    if (t.copyUrl.includes("REPLACE_WITH_")) {
      console.warn(`⚠ ${t.slug}: docId is a placeholder — author + fill the real Doc first.`);
      continue;
    }

    const pdf = Buffer.from(
      (
        await drive.files.export(
          { fileId: t.docId, mimeType: "application/pdf" },
          { responseType: "arraybuffer" },
        )
      ).data as ArrayBuffer,
    );
    const docx = Buffer.from(
      (
        await drive.files.export(
          { fileId: t.docId, mimeType: DOCX_MIME },
          { responseType: "arraybuffer" },
        )
      ).data as ArrayBuffer,
    );
    const tmp = join(tmpdir(), `${t.slug}-qa.pdf`);
    writeFileSync(tmp, pdf);
    const { pages, text } = await pdfInfo(tmp);
    rmSync(tmp, { force: true });

    const result = evaluateExportQa({
      slug: t.slug,
      pdfBytes: pdf.byteLength,
      pdfPageCount: pages,
      pdfText: text,
      docxBytes: docx.byteLength,
      expectedPageCount: t.pageCount,
      expectedHeadings: t.sectionGuidance.map((s) => s.section),
    });

    console.log(`\n${result.pass ? "✓" : "✗"} ${result.slug}`);
    for (const c of result.checks)
      console.log(`    ${ICON[c.status]} ${c.label}${c.detail ? `  (${c.detail})` : ""}`);
    if (!result.pass) failures++;
  }

  console.log(
    `\nqa:export — ${failures === 0 ? "all clean" : `${failures} template(s) with failures`}`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
