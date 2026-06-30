import { test, expect } from "@playwright/test";

// Print: the resume sheet must sit in normal flow so it establishes the printed
// page height. A prior position:absolute approach left it out of flow, so the
// short app height produced a BLANK PDF. Assert the sheet sizes the page.
test("print view puts the resume sheet in flow (non-blank PDF)", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "chromium-no-js", "builder requires JS");
  await page.goto("/resume-builder/");
  // The builder is a client:only island — the sheet renders after hydration, so
  // wait for it before measuring (it is not in the server HTML).
  await page.locator("[data-sheet]").first().waitFor({ state: "attached" });
  await page.emulateMedia({ media: "print" });
  const r = await page.evaluate(() => {
    const el = document.querySelector("[data-sheet]") as HTMLElement;
    const rect = el.getBoundingClientRect();
    return {
      pos: getComputedStyle(el).position,
      h: Math.round(rect.height),
      bodyH: document.body.scrollHeight,
    };
  });
  expect(r.h).toBeGreaterThan(1000); // ~A4 height in CSS px
  // Sheet is in flow (not lifted out by absolute positioning) → it sizes the page.
  expect(r.bodyH).toBeGreaterThanOrEqual(r.h);
});
