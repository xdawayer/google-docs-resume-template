/**
 * GSC indexation monitor (T6). Cron/CI only, OFF the deploy path. Inspects every
 * indexable route via the URL Inspection API and reports indexed vs
 * crawled-not-indexed. Exits non-zero if crawled-not-indexed > 20% so a
 * thin-content / cold-start problem surfaces. Needs GSC_SA_KEY + SITE_URL.
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { google } from "googleapis";
import { hasGscCreds, getGscAuth } from "./lib/auth";
import { SITE_URL } from "../src/lib/site";

interface RouteEntry {
  path: string;
  indexable: boolean;
}

const MANIFEST = "src/generated/route-manifest.json";
const OUT = "reports/gsc-indexation.json";

async function main(): Promise<void> {
  if (!hasGscCreds()) {
    console.warn("⚠ gsc-monitor: GSC_SA_KEY not set — skipping (no-op).");
    return;
  }
  if (!existsSync(MANIFEST)) {
    console.warn("⚠ gsc-monitor: no route manifest — run gen-seo first.");
    return;
  }
  const routes = (JSON.parse(readFileSync(MANIFEST, "utf8")) as RouteEntry[]).filter(
    (r) => r.indexable,
  );
  const sc = google.searchconsole({ version: "v1", auth: getGscAuth() });

  const indexed: string[] = [];
  const crawledNotIndexed: string[] = [];
  const other: string[] = [];
  for (const r of routes) {
    const url = `${SITE_URL}${r.path}`;
    try {
      const res = await sc.urlInspection.index.inspect({
        requestBody: { inspectionUrl: url, siteUrl: SITE_URL },
      });
      const state = res.data.inspectionResult?.indexStatusResult?.coverageState ?? "unknown";
      if (/indexed/i.test(state) && !/not indexed/i.test(state)) indexed.push(url);
      else if (/not indexed/i.test(state)) crawledNotIndexed.push(url);
      else other.push(`${url} (${state})`);
    } catch (e) {
      other.push(`${url} (error: ${(e as Error).message})`);
    }
  }

  mkdirSync("reports", { recursive: true });
  writeFileSync(
    OUT,
    JSON.stringify(
      { checkedAt: new Date().toISOString(), indexed, crawledNotIndexed, other },
      null,
      2,
    ) + "\n",
  );
  const total = routes.length || 1;
  const cniRate = crawledNotIndexed.length / total;
  console.log(
    `gsc-monitor: ${indexed.length} indexed / ${crawledNotIndexed.length} crawled-not-indexed / ${total} total`,
  );
  if (cniRate > 0.2) {
    console.error(
      `✗ crawled-not-indexed ${Math.round(cniRate * 100)}% > 20% — deepen content before scaling`,
    );
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
