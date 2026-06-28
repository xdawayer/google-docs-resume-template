/**
 * Reproducible Google Doc -> WebP master pipeline (E6). Cron/manual only.
 *   Drive export -> PDF -> pdftoppm first page PNG -> sharp master -> lock file.
 * Stores width/height + content hash + Doc modifiedTime so freshness (E6) and
 * the build asset gate (E3/check-assets) are decoupled from live Google state.
 *
 * Requires GOOGLE_SA_KEY + poppler (pdftoppm). `--slug X` does one template.
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { execa } from "execa";
import { templateSchema } from "../src/content/schema";
import { loadRawTemplates, TEMPLATES_DIR } from "./_shared";
import { hasCreds, getServiceAuth } from "./lib/auth";
import { driveClient, exportPdf, getMeta, sha256 } from "./lib/drive";
import { writeMaster } from "./lib/image";

const LOCK = "src/data/screenshots.lock.json";
const ASSET_DIR = "src/assets/templates";

interface LockEntry {
  width: number;
  height: number;
  hash: string;
  modifiedTime: string;
  generatedAt: string;
}
type Lock = Record<string, LockEntry>;

function loadLock(): Lock {
  if (!existsSync(LOCK)) return {};
  return JSON.parse(readFileSync(LOCK, "utf8")) as Lock;
}

async function main(): Promise<void> {
  const only = process.argv.includes("--slug")
    ? process.argv[process.argv.indexOf("--slug") + 1]
    : null;
  if (!hasCreds()) {
    console.warn("⚠ generate-screenshots: GOOGLE_SA_KEY not set — skipping (no-op).");
    return;
  }
  const drive = driveClient(getServiceAuth());
  // Include drafts: you screenshot a template (real docId) BEFORE promoting it.
  // Drafts whose docId is still a placeholder fail safeParse below and are skipped.
  const raws = loadRawTemplates(TEMPLATES_DIR, { includeDrafts: true });
  const lock = loadLock();
  mkdirSync(ASSET_DIR, { recursive: true });
  mkdirSync(dirname(LOCK), { recursive: true });

  for (const r of raws) {
    const res = templateSchema.safeParse(r.data);
    if (!res.success) continue;
    const t = res.data;
    if (only && t.slug !== only) continue;

    const pdf = await exportPdf(drive, t.docId);
    const meta = await getMeta(drive, t.docId);
    const tmp = join(tmpdir(), `${t.slug}.pdf`);
    writeFileSync(tmp, pdf);
    const prefix = join(tmpdir(), t.slug);
    // first page only, 150dpi PNG -> {prefix}-1.png (or {prefix}.png with -singlefile)
    await execa("pdftoppm", [
      "-png",
      "-singlefile",
      "-r",
      "150",
      "-f",
      "1",
      "-l",
      "1",
      tmp,
      prefix,
    ]);
    const png = readFileSync(`${prefix}.png`);

    const outPath = join(ASSET_DIR, `${t.slug}.png`);
    const { width, height } = await writeMaster(png, outPath);
    lock[t.slug] = {
      width,
      height,
      hash: sha256(pdf),
      modifiedTime: meta.modifiedTime,
      generatedAt: new Date().toISOString(),
    };
    rmSync(tmp, { force: true });
    rmSync(`${prefix}.png`, { force: true });
    console.log(`✓ ${t.slug}: ${width}x${height} master + lock`);
  }
  writeFileSync(LOCK, JSON.stringify(lock, null, 2) + "\n");
  console.log(`✓ generate-screenshots: lock written → ${LOCK}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
