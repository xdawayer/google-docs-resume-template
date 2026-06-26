// Lighthouse CI budget (E10). lhci serves dist itself and asserts the Core Web
// Vitals + category budgets the review pinned (LCP<2s, CLS<0.05, perf>=0.95).
module.exports = {
  ci: {
    collect: {
      staticDistDir: "./dist",
      url: ["http://localhost/google-docs-resume-template/"],
      numberOfRuns: 1,
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.95 }],
        "categories:seo": ["error", { minScore: 1 }],
        "categories:accessibility": ["error", { minScore: 1 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 2000 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.05 }],
        "total-byte-weight": ["warn", { maxNumericValue: 512000 }],
      },
    },
  },
};
