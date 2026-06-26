import { defineConfig } from "vitest/config";

// Plain vitest config. Unit tests import src/ and scripts/ via relative paths
// and parse dist/ HTML with cheerio, so we don't need Astro virtual modules here.
export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**", "scripts/**"],
      // Enforced only when run with --coverage; `pnpm test` (no coverage) skips.
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
});
