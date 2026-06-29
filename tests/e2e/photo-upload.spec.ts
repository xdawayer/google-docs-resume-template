import { test, expect } from "@playwright/test";

// Uploading a local image must populate basics.photo with a downscaled data-URL
// (no server upload) and show it as the avatar on a photo template.
test("local photo upload sets the avatar (client-side, no URL needed)", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === "chromium-no-js", "builder requires JS (client:load)");

  await page.goto("/resume-builder/");

  // A template that renders the avatar.
  await page.locator('select[aria-label="Template"]').selectOption("modern-sidebar");
  // Default sample has no photo → the avatar shows initials, not an <img>.
  await expect(page.locator("[data-sheet] .avatar img")).toHaveCount(0);

  // Pick a local file (the input is hidden behind the "Upload photo" label).
  await page.locator("[data-photo-input]").setInputFiles("tests/fixtures/avatar.png");

  // The form preview thumbnail appears, and the template avatar becomes a JPEG
  // data-URL produced entirely in the browser (canvas downscale).
  await expect(page.locator(".photo-prev")).toBeVisible();
  await expect
    .poll(async () =>
      page.locator("[data-sheet] .avatar img").getAttribute("src").catch(() => null),
    )
    .toMatch(/^data:image\/jpeg/);
});
