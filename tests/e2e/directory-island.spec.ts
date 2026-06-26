import { test, expect } from "@playwright/test";

// D3: filtering to zero results shows the empty state; reset restores the count.
// Skips until templates exist (pre-M7 the directory is empty).
test("filter-to-zero shows empty state, reset restores", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "chromium-no-js", "filtering is a JS enhancement");
  await page.goto("/google-docs-resume-template/");
  const cards = page.locator(".template-card");
  const total = await cards.count();
  test.skip(total === 0, "no templates yet");

  const search = page.locator("#search");
  await search.fill("zzzznomatchxyz");
  await expect(page.locator("#emptyState")).toBeVisible();
  await expect(page.locator("#resultCount")).toHaveText(/0 templates/);

  await page.locator("#resetFilters").click();
  await expect(page.locator("#emptyState")).toBeHidden();
  await expect(page.locator("#resultCount")).toHaveText(new RegExp(`${total} template`));
});

test("preview modal traps focus and Escape restores it", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "chromium-no-js", "modal is a JS enhancement");
  await page.goto("/google-docs-resume-template/");
  const preview = page.locator("[data-preview]").first();
  test.skip((await preview.count()) === 0, "no templates yet");

  await preview.click();
  await expect(page.locator("#previewModal")).toBeVisible();
  await expect(page.locator("#modalClose")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator("#previewModal")).toBeHidden();
});
