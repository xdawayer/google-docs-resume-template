/**
 * Reproducible thumbnail capture for the builder-backed templates (the 6 entries
 * with kind: builder). Unlike generate-screenshots.ts — which exports Google Docs
 * via the Drive API — these templates have no Google Doc, so we render the actual
 * builder preview and screenshot ONLY the [data-sheet] element.
 *
 * Capturing the element (not a fixed clip rect) is what keeps editor chrome — the
 * toolbar, the form panel, the photo "remove" control — out of the frame, and
 * guarantees the A4 page is never clipped on an edge.
 *
 * Usage: have a server on $BASE_URL (default http://localhost:4321), then
 *   pnpm tsx scripts/capture-builder-thumbs.ts
 */
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

// builderTemplate id (the ?t= param) -> content slug (the asset filename).
const TEMPLATES: { id: string; slug: string }[] = [
  { id: "ats-minimal", slug: "modern-ats" },
  { id: "executive", slug: "executive-elegant" },
  { id: "modern-sidebar", slug: "modern-sidebar" },
  { id: "creative", slug: "creative-portfolio" },
  { id: "fresh-graduate", slug: "fresh-graduate" },
  { id: "bold", slug: "bold-two-column" },
  { id: "technical", slug: "technical-compact" },
  { id: "header-band", slug: "header-band" },
  { id: "clinical", slug: "clinical-clean" },
  { id: "academic", slug: "academic-classic" },
  { id: "corporate", slug: "corporate-formal" },
  { id: "timeline", slug: "timeline-modern" },
];

const BASE = process.env.BASE_URL ?? "http://localhost:4321";
const OUT = "src/assets/templates";

async function main(): Promise<void> {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  // deviceScaleFactor 2 → crisp 2x master. The viewport must be WIDE enough that
  // the preview pane comfortably exceeds the 210mm (794px) sheet — otherwise the
  // sheet overflows its centered, scrollable container and the editor panel ends
  // up underlapping its left edge, which leaks form chrome into the element shot.
  const ctx = await browser.newContext({
    deviceScaleFactor: 2,
    viewport: { width: 2000, height: 1500 },
  });
  const page = await ctx.newPage();

  for (const t of TEMPLATES) {
    const url = `${BASE}/resume-builder/?t=${t.id}`;
    // First load establishes same-origin so we can clear any persisted resume,
    // then reload so the template's own sample persona (sampleFor) renders fresh.
    await page.goto(url, { waitUntil: "load" });
    await page.evaluate(() => localStorage.clear());
    await page.goto(url, { waitUntil: "networkidle" });

    const sheet = page.locator("[data-sheet]");
    await sheet.waitFor({ state: "visible", timeout: 15000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(250); // let layout/web fonts settle before the shot

    await sheet.screenshot({ path: `${OUT}/${t.slug}.png` });
    const box = await sheet.boundingBox();
    console.log(
      `captured ${t.slug.padEnd(20)} ${box ? `${Math.round(box.width)}x${Math.round(box.height)} css px` : ""}`,
    );
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
