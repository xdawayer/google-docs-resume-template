import { test, expect } from "@playwright/test";

// E9: clicking a copy CTA fires the copy_google_docs_click beacon to /api/collect
// BEFORE navigation. Skips until templates exist.
test("copy CTA fires the intent beacon before navigating", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "chromium-no-js", "beacon needs JS");

  // The beacon goes via navigator.sendBeacon with a Blob body, which the Playwright
  // network layer cannot reliably decode. Wrap sendBeacon to capture URL + Blob text.
  await page.addInitScript(() => {
    const w = window as unknown as { __beacons: { url: string; body: string }[] };
    w.__beacons = [];
    const orig = navigator.sendBeacon?.bind(navigator);
    navigator.sendBeacon = (url: string | URL, data?: BodyInit | null): boolean => {
      if (data instanceof Blob)
        data.text().then((t) => w.__beacons.push({ url: String(url), body: t }));
      else w.__beacons.push({ url: String(url), body: typeof data === "string" ? data : "" });
      return orig ? orig(url, data as BodyInit) : true;
    };
  });

  await page.goto("/google-docs-resume-template/");
  const copy = page.locator(".template-card a[data-copy]").first();
  test.skip((await copy.count()) === 0, "no templates yet");

  // open in same tab is fine for the assertion; the beacon must already be in flight
  await copy.click({ modifiers: [] });

  await expect
    .poll(
      async () => {
        const beacons = await page.evaluate(
          () => (window as unknown as { __beacons: { url: string; body: string }[] }).__beacons,
        );
        return beacons.find((b) => b.url.includes("/api/collect"))?.body ?? "";
      },
      { timeout: 5000 },
    )
    .toContain("copy_google_docs_click");
});
