/**
 * Screenshot freshness check (E6). Cron/CI only — NOT in prebuild (Decision #10),
 * because a live Drive call would make the build non-deterministic and couple
 * every deploy to mutable Google state. Fails (exit 1) if a Doc's modifiedTime
 * has drifted from the committed screenshots.lock.json without a regenerated
 * screenshot, so a stale "the page lies about the template" state is caught.
 */
import { existsSync, readFileSync } from "node:fs";
import { templateSchema } from "../src/content/schema";
import { loadRawTemplates } from "./_shared";
import { hasCreds, getServiceAuth } from "./lib/auth";
import { driveClient, getMeta } from "./lib/drive";

const LOCK = "src/data/screenshots.lock.json";

interface LockEntry {
  modifiedTime: string;
}

async function main(): Promise<void> {
  if (!hasCreds()) {
    console.warn("⚠ check-freshness: GOOGLE_SA_KEY not set — skipping (no-op).");
    return;
  }
  const lock: Record<string, LockEntry> = existsSync(LOCK)
    ? (JSON.parse(readFileSync(LOCK, "utf8")) as Record<string, LockEntry>)
    : {};
  const drive = driveClient(getServiceAuth());
  const raws = loadRawTemplates();
  const drift: string[] = [];

  for (const r of raws) {
    const res = templateSchema.safeParse(r.data);
    if (!res.success || res.data.status !== "published") continue;
    const t = res.data;
    const entry = lock[t.slug];
    if (!entry) {
      drift.push(`${t.slug}: no screenshot lock entry (run shots:gen)`);
      continue;
    }
    const meta = await getMeta(drive, t.docId);
    if (meta.modifiedTime !== entry.modifiedTime) {
      drift.push(
        `${t.slug}: Doc modified ${meta.modifiedTime} != screenshot ${entry.modifiedTime} (regenerate)`,
      );
    }
  }

  if (drift.length) {
    console.error(`\n✗ check-freshness: ${drift.length} stale screenshot(s):\n`);
    for (const d of drift) console.error(`  - ${d}`);
    process.exit(1);
  }
  console.log("✓ check-freshness: all screenshots match live Doc revisions");
}

if (import.meta.url === `file://${process.argv[1]}`) main();
