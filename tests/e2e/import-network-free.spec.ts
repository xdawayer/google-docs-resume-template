import { test, expect } from "@playwright/test";

// Privacy-claim CI gate: importing a resume must fire ZERO third-party requests, and
// pdf.js must use the locally bundled worker (no CDN).
test("import is network-free and populates the builder", async ({ page, baseURL }, testInfo) => {
  test.skip(testInfo.project.name === "chromium-no-js", "builder requires JS (client:load)");
  const origin = new URL(baseURL!).origin;
  const thirdParty: string[] = [];
  await page.route("**/*", (route) => {
    const u = new URL(route.request().url());
    if (u.origin !== origin && !["data:", "blob:"].includes(u.protocol)) thirdParty.push(u.href);
    route.continue();
  });

  await page.goto("/resume-builder/");
  await page.locator("[data-import] summary").click();

  // docx (mammoth)
  await page
    .locator("[data-import-file]")
    .setInputFiles("tests/fixtures/resumes/sample-chronological.docx");
  await expect(page.getByLabel("Full name")).toHaveValue("Dana Lopez", { timeout: 6000 });

  // pdf (pdf.js local worker)
  await page
    .locator("[data-import-file]")
    .setInputFiles("tests/fixtures/resumes/sample-onepage.pdf");
  await page.waitForTimeout(1500); // let pdf.js extract + re-render

  expect(thirdParty, `third-party requests: ${thirdParty.join(", ")}`).toEqual([]);
});
