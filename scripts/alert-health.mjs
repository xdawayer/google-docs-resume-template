// Pages on SUSTAINED copy-link failures (>= 2 consecutive checks) so a transient
// blip doesn't spam. Reads data/copy_link_health.json (written by check-links).
// Best-effort: Slack webhook if configured, else logs. Never throws.
import { readFileSync, existsSync } from "node:fs";

const HEALTH = "data/copy_link_health.json";
const THRESHOLD = 2;

function main() {
  if (!existsSync(HEALTH)) return;
  let map = {};
  try {
    map = JSON.parse(readFileSync(HEALTH, "utf8"));
  } catch {
    return;
  }
  const bad = Object.entries(map).filter(
    ([, r]) => r.status !== "available" && (r.consecutiveFailures ?? 0) >= THRESHOLD,
  );
  if (bad.length === 0) {
    console.log("alert-health: all copy links healthy");
    return;
  }
  const lines = bad.map(([slug, r]) => `• ${slug}: ${r.status} (${r.consecutiveFailures}x) — ${r.reason ?? ""}`);
  const text = `⚠ ${bad.length} resume template copy link(s) unhealthy:\n${lines.join("\n")}`;
  console.error(text);
  const hook = process.env.SLACK_WEBHOOK_URL;
  if (hook) {
    fetch(hook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text }),
    }).catch(() => {});
  }
}

main();
