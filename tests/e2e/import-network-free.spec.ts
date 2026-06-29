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

  // docx (mammoth) — name + a parsed experience field prove section parsing, not just text
  await page
    .locator("[data-import-file]")
    .setInputFiles("tests/fixtures/resumes/sample-chronological.docx");
  await expect(page.getByLabel("Full name")).toHaveValue("Dana Lopez", { timeout: 6000 });
  await expect(page.getByLabel("Company").first()).toHaveValue(/Acme/, { timeout: 6000 });

  // Clear, then verify the PDF path INDEPENDENTLY populates — catches the line-collapse
  // bug (a collapsed PDF yields an empty name, not "Dana Lopez").
  await page.getByRole("button", { name: "Clear" }).click();
  await expect(page.getByLabel("Full name")).toHaveValue("");
  await page
    .locator("[data-import-file]")
    .setInputFiles("tests/fixtures/resumes/sample-onepage.pdf");
  await expect(page.getByLabel("Full name")).toHaveValue("Dana Lopez", { timeout: 6000 });

  expect(thirdParty, `third-party requests: ${thirdParty.join(", ")}`).toEqual([]);
});
