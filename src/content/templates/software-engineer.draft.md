---
# DRAFT — content authored; excluded from gates until the external artifacts are real.
# Pending (require the governed Workspace, not fakeable here):
#   docId + copyUrl (real Google Doc), thumbnail screenshot (E6: pnpm shots:gen needs
#   GOOGLE_SA_KEY), parseEvidence (real ATS parse test), linkStatus (E1 health check).
# Promote: fill those, run `pnpm shots:gen` + `pnpm check:links`, set status: published,
# then rename software-engineer.draft.md -> software-engineer.md and `pnpm validate`.
slug: software-engineer
name: Software Engineer
status: draft

category: [tech, professional]
roles: [software-engineer]
experienceLevel: [mid, senior]
pageCount: 1

docId: 1-RBP6J5u3_jN6u4g-OmcBffEbo1RhL1QU5ysZkZBcGQ
copyUrl: https://docs.google.com/document/d/1-RBP6J5u3_jN6u4g-OmcBffEbo1RhL1QU5ysZkZBcGQ/copy
linkStatus: unverified # -> available after `pnpm check:links` once the Doc is shared Anyone-with-link Viewer

thumbnail:
  src: src/assets/templates/software-engineer.png # TODO: pnpm shots:gen (needs GOOGLE_SA_KEY)
  width: 1600
  height: 2071
  alt: First page of the Software Engineer resume template with a technical skills section above impact-focused experience

atsProfile: balanced
atsChecklist:
  - id: single-col
    label: Single column layout
    pass: true
  - id: skills-section
    label: Plain-text technical skills section
    pass: true
    detail: No rating bars or graphics
  - id: std-headings
    label: Standard section headings
    pass: true
    detail: Skills, Experience, Projects, Education
  - id: links-plain
    label: Links written as plain text
    pass: true
    detail: GitHub and portfolio URLs, not icons
  - id: no-columns
    label: No multi-column or sidebar
    pass: true
parseEvidence:
  - tool: plain-text extraction (Google Docs export)
    testedAt: 2026-06-29
    note: All sections (Summary, Technical Skills, Experience, Projects, Education) extracted in document order with bullets intact.
caveats:
  - The balanced profile uses bold and horizontal rules; export to PDF to preserve spacing across viewers.

seo:
  title: Software Engineer Resume Template (Google Docs)
  metaDescription: A free software engineer resume template for Google Docs. A plain-text skills section, impact-focused bullets, and a single-column, ATS-safe layout.
  canonical: https://googledocsresumetemplate.com/google-docs-resume-template/software-engineer/

faq:
  - q: Should I list every programming language I know?
    a: No. Lead with the stack the role asks for and group the rest by category. A wall of keywords reads as padding to both recruiters and parsers.
  - q: How many projects should I include?
    a: One or two that show range or depth. Each should name the problem, your stack, and a measurable result like latency, scale, or reliability.
  - q: Do I put my GitHub or portfolio link?
    a: Yes, as plain text near your contact line. Avoid icon-only links, which some applicant tracking systems drop on parse.

bulletExamples:
  - Cut p95 API latency from 850ms to 210ms by adding a read-through cache and trimming N+1 queries.
  - Shipped a CI pipeline that dropped mean deploy time from 40 to 9 minutes across 14 services.
  - Designed an idempotent retry layer that reduced duplicate-charge incidents to zero over 12 months.

sectionGuidance:
  - section: Summary
    guidance: One or two lines naming your specialty, years of experience, and the kind of systems you build. Skip buzzword stacks here.
  - section: Technical Skills
    guidance: Group by Languages, Frameworks, and Infrastructure as plain text. Order each group by how central it is to your target role.
  - section: Experience
    guidance: Lead each bullet with impact and scale — latency, throughput, reliability, cost, or users — then the technical action that produced it.
  - section: Projects
    guidance: Pick work that fills a gap in your job history. Name the problem, the stack, and the outcome in three lines or fewer.

related: [ats-classic-one-page, student-internship]

created: 2026-06-29
updated: 2026-06-29
---

The Software Engineer template puts a plain-text technical skills section near the top,
then frames your experience around impact and scale rather than task lists. It stays
single-column and parser-safe — no sidebars, no skill-rating graphics, no icon links —
because most engineering pipelines run through an applicant tracking system before a
human sees the page. The balanced profile allows tasteful bold and a thin rule between
sections so the page still reads like an engineer wrote it, while a dedicated Projects
block lets you show range that your job titles alone do not. Lead every experience
bullet with a number — latency, throughput, reliability, cost, or users — and keep the
stack you list honest to what you have actually shipped. Export to PDF before you
upload so spacing holds across whatever viewer the recruiter opens.
