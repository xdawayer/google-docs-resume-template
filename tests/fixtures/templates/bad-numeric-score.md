---
slug: bad-numeric-score
name: Fake ATS Score
status: draft
category: [ats]
roles: [general]
experienceLevel: [any]
pageCount: 1
docId: 2BcDeFgHiJkLmNoPqRsTuVwXyZ123456
copyUrl: https://docs.google.com/document/d/2BcDeFgHiJkLmNoPqRsTuVwXyZ123456/copy
linkStatus: unverified
atsScore: 95
thumbnail:
  src: src/assets/templates/bad-numeric-score.png
  width: 1600
  height: 2071
  alt: placeholder
atsProfile: scanner-first
atsChecklist:
  - { id: single-col, label: Single column, pass: true }
seo:
  title: Fake ATS Score Resume Template for Google Docs
  metaDescription: This fixture carries a forbidden numeric atsScore field so the strict schema rejects it; trust must be a checklist, never an invented number.
  canonical: https://googledocsresumetemplate.com/google-docs-resume-template/bad-numeric-score/
created: 2026-06-20
updated: 2026-06-27
---

Intentionally invalid: a numeric `atsScore` must be rejected by `.strict()` (T2).
