import { test, expect } from "@playwright/test";

// E9: clicking a copy CTA fires the copy_google_docs_click beacon to /api/collect
// BEFORE navigation. Skips until templates exist.
test("copy CTA fires the intent beacon before navigating", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "chromium-no-js", "beacon needs JS");
  await page.goto("/google-docs-resume-template/");
  const copy = page.locator(".template-card a[data-copy]").first();
  test.skip((await copy.count()) === 0, "no templates yet");

  const beacon = page.waitForRequest(
    (req) => req.url().includes("/api/collect") && req.method() === "POST",
    { timeout: 5000 },
  );
  // open in same tab is fine for the assertion; the beacon must already be in flight
  await copy.click({ modifiers: [] });
  const req = await beacon;
  expect(req.postData() ?? "").toContain("copy_google_docs_click");
});
