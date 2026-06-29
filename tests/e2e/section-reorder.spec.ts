import { test, expect } from "@playwright/test";

// The left-form module controls must (a) collapse a section's body and (b) reorder
// sections, with the reorder reflected in the rendered preview's DOM order.
test("collapse and reorder drive the form and preview", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "chromium-no-js", "builder requires JS (client:load)");

  await page.goto("/resume-builder/");

  // Reads the rendered section headings in DOM order (ATS Minimal is single-column).
  const headings = () =>
    page.locator("[data-sheet] h2").evaluateAll((els) => els.map((e) => e.textContent?.trim()));

  // Default order: Job Target comes AFTER Highlights.
  let order = await headings();
  expect(order.indexOf("Job Target")).toBeGreaterThan(order.indexOf("Highlights"));

  // Move Job Target up once → it now precedes Highlights in the preview DOM.
  await page.getByRole("button", { name: "Move Job Target up" }).click();
  await expect
    .poll(async () => {
      const o = await headings();
      return o.indexOf("Job Target") < o.indexOf("Highlights");
    })
    .toBe(true);

  // Collapse the Job Target panel → its body (the "Target role" field) leaves the DOM.
  // exact:true so it doesn't also match Personal Info's "Headline / target role".
  await expect(page.getByLabel("Target role", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Job Target", exact: true }).click();
  await expect(page.getByLabel("Target role", { exact: true })).toHaveCount(0);
});
