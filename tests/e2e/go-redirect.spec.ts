import { test, expect } from "@playwright/test";

// E2: /go/{slug} redirect correctness. The edge function only runs on Cloudflare,
// not in `astro preview`, so this targets a real deployed origin via BASE_URL.
// Skipped in the default preview run.
const DEPLOYED = process.env.BASE_URL;

test.describe(() => {
  test.skip(!DEPLOYED, "set BASE_URL to a deployed Cloudflare origin to run /go redirect checks");

  test("unknown slug redirects to the hub", async ({ request }) => {
    const res = await request.get(`${DEPLOYED}/go/definitely-not-a-real-slug`, { maxRedirects: 0 });
    expect([301, 302]).toContain(res.status());
    expect(res.headers()["location"]).toContain("/google-docs-resume-template/");
  });

  test("a healthy slug redirects to its real /copy URL", async ({ request }) => {
    // requires at least one published+available template; provide GO_SLUG to test
    const slug = process.env.GO_SLUG;
    test.skip(!slug, "set GO_SLUG to a published template slug");
    const res = await request.get(`${DEPLOYED}/go/${slug}`, { maxRedirects: 0 });
    expect([301, 302]).toContain(res.status());
    expect(res.headers()["location"]).toMatch(/docs\.google\.com\/document\/d\/.+\/copy/);
  });
});
