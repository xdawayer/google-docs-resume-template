import { test, expect } from "@playwright/test";

// E4/D4: with JS disabled the directory must still be present and crawlable.
test("hub renders the grid + all cards as static HTML with JS off", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-no-js", "no-JS project only");
  await page.goto("/google-docs-resume-template/");
  await expect(page.locator("#templateGrid")).toHaveCount(1);
  const cards = page.locator(".template-card");
  const n = await cards.count();
  for (let i = 0; i < n; i++) {
    // every card carries at least one internal detail link even without JS (the
    // thumbnail and the title both link to the detail page — both are crawlable).
    const detailLinks = cards.nth(i).locator('a[href^="/google-docs-resume-template/"]');
    expect(await detailLinks.count()).toBeGreaterThanOrEqual(1);
  }
  // no card links straight to Google Docs
  await expect(page.locator('.template-card a[href*="docs.google.com"]')).toHaveCount(0);
});
