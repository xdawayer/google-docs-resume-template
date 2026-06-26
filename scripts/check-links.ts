/**
 * Copy-link health monitor (E1 — "the 2am test"). Cron/CI only, OFF the deploy
 * path (Decision #10). Primary signal = authenticated Drive API (Decision #11):
 * exists + not trashed + is a Doc + shared anyone-reader. A login/consent wall
 * is NOT a failure (we never probe /copy unauthenticated as the primary signal),
 * so we don't raise false "dead" alarms. Writes data/copy_link_health.json and
 * exits 0 so the report commits and the build can ship a degraded CTA.
 */
import { writeFileSync } from "node:fs";
import { templateSchema } from "../src/content/schema";
import { loadRawTemplates } from "./_shared";
import { hasCreds, getServiceAuth } from "./lib/auth";
import { driveClient, getMeta, anyoneCanRead } from "./lib/drive";
import { loadHealthMap, HEALTH_PATH, type HealthMap, type LinkHealth } from "../src/lib/health";

const DOC_MIME = "application/vnd.google-apps.document";

async function main(): Promise<void> {
  if (!hasCreds()) {
    console.warn("⚠ check-links: GOOGLE_SA_KEY not set — skipping (no-op).");
    return;
  }
  const raws = loadRawTemplates();
  const prev = loadHealthMap();
  const next: HealthMap = {};
  const drive = driveClient(getServiceAuth());
  let unhealthy = 0;

  for (const r of raws) {
    const res = templateSchema.safeParse(r.data);
    if (!res.success || res.data.status !== "published") continue;
    const t = res.data;

    let status: LinkHealth = "available";
    let reason: string | undefined;
    try {
      const meta = await getMeta(drive, t.docId);
      if (meta.trashed) {
        status = "unavailable";
        reason = "trashed";
      } else if (meta.mimeType !== DOC_MIME) {
        status = "unavailable";
        reason = `unexpected mime ${meta.mimeType}`;
      } else if (!(await anyoneCanRead(drive, t.docId))) {
        status = "unavailable";
        reason = "not shared anyone-with-link reader";
      }
    } catch (e) {
      status = "unavailable";
      reason = `drive error: ${(e as Error).message}`;
    }

    const prevFails = prev[t.slug]?.consecutiveFailures ?? 0;
    next[t.slug] = {
      status,
      lastCheckedAt: new Date().toISOString(),
      consecutiveFailures: status === "available" ? 0 : prevFails + 1,
      reason,
    };
    if (status !== "available") unhealthy++;
  }

  writeFileSync(HEALTH_PATH, JSON.stringify(next, null, 2) + "\n");
  console.log(
    `✓ check-links: ${Object.keys(next).length} checked, ${unhealthy} unhealthy → ${HEALTH_PATH}`,
  );
  // Intentionally exit 0; alerting (scripts/alert-health) pages on sustained failures.
}

if (import.meta.url === `file://${process.argv[1]}`) main();
