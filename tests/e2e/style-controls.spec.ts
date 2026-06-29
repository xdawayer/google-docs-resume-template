import { test, expect } from "@playwright/test";

// The top-bar typography/color controls must actually drive the live preview —
// not just toggle their own UI state. We assert COMPUTED styles on the rendered
// sheet so a broken CSS-variable wiring fails here.
test("style controls drive the rendered preview", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "chromium-no-js", "builder requires JS (client:load)");

  await page.goto("/resume-builder/");

  // Default ATS Minimal: the section-heading rule is near-black (#1a1a1a) — i.e.
  // no accent override is applied at the default style.
  const h2 = page.locator("[data-sheet] h2").first();
  await expect(h2).toHaveCSS("border-bottom-color", "rgb(26, 26, 26)");

  // Picking the Teal accent recolors that rule via --rb-accent → the var reaches
  // the template root through the preview wrapper.
  await page.getByRole("button", { name: "Teal", exact: true }).click();
  await expect(h2).toHaveCSS("border-bottom-color", "rgb(15, 118, 110)");

  // Bumping text size scales the sheet (--rb-scale): the name grows.
  const name = page.locator("[data-sheet] .name").first();
  const before = await name.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  await page.getByRole("button", { name: "Increase text size" }).click();
  const after = await name.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(after).toBeGreaterThan(before);
});
