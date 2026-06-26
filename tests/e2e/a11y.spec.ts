import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("hub has no axe accessibility violations", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "chromium-no-js", "axe requires JS");
  await page.goto("/google-docs-resume-template/");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test("404 has no axe accessibility violations", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "chromium-no-js", "axe requires JS");
  await page.goto("/this-does-not-exist/", { waitUntil: "domcontentloaded" }).catch(() => {});
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
