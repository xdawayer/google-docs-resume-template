import { test, expect } from "@playwright/test";

// Print: the resume sheet must sit in normal flow so it establishes the printed
// page height. A prior position:absolute approach left it out of flow, so the
// short app height produced a BLANK PDF. Assert the sheet sizes the page.
test("print view puts the resume sheet in flow (non-blank PDF)", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "chromium-no-js", "builder requires JS");
  await page.goto("/resume-builder/");
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

// Import: a file/paste with no readable text (e.g. a scanned image-only PDF) must
// surface a clear error, NOT silently wipe the builder with a blank parse.
test("import surfaces a clear error for text-less input", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "chromium-no-js", "builder requires JS");
  await page.goto("/resume-builder/");
  await page.getByLabel("Full name").fill("KEEP ME");
  await page.locator("[data-import] summary").click();
  await page.getByPlaceholder(/paste resume text/i).fill("hello"); // <20 chars after trim
  await page.getByRole("button", { name: "Parse pasted text" }).click();
  await expect(page.locator("[data-import-error]")).toBeVisible();
  // The builder content was NOT wiped by an empty parse.
  await expect(page.getByLabel("Full name")).toHaveValue("KEEP ME");
});
