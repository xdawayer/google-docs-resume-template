import { defineConfig, devices } from "@playwright/test";

// Builds + previews the static site, then runs two projects: normal Chromium and
// a JS-disabled project (the no-JS crawl gate E4/D4). Specs that need template
// content skip gracefully when the directory is empty (pre-M7).
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  webServer: {
    command: "pnpm build && pnpm preview --port 4321 --host",
    url: "http://localhost:4321/google-docs-resume-template/",
    reuseExistingServer: !process.env.CI,
    timeout: 180000,
  },
  use: { baseURL: "http://localhost:4321" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "chromium-no-js", use: { ...devices["Desktop Chrome"], javaScriptEnabled: false } },
  ],
});
