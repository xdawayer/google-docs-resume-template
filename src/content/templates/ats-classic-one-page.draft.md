---
# DRAFT — content authored; excluded from gates until the external artifacts are real.
# Pending (require the governed Workspace, not fakeable here):
#   docId + copyUrl (real Google Doc), thumbnail screenshot (E6: pnpm shots:gen needs
#   GOOGLE_SA_KEY), parseEvidence (real ATS parse test), linkStatus (E1 health check).
# Promote: fill those, run `pnpm shots:gen` + `pnpm check:links`, set status: published,
# then rename ats-classic-one-page.draft.md -> ats-classic-one-page.md and `pnpm validate`.
slug: ats-classic-one-page
name: ATS Classic One Page
status: draft

category: [ats, simple, professional]
roles: [general]
experienceLevel: [entry, mid, senior]
pageCount: 1

docId: REPLACE_WITH_DOC_ID # TODO(human): real governed Google Doc id
copyUrl: https://docs.google.com/document/d/REPLACE_WITH_DOC_ID/copy
linkStatus: unverified

thumbnail:
  src: src/assets/templates/ats-classic-one-page.png # TODO: pnpm shots:gen (needs GOOGLE_SA_KEY)
  width: 1600
  height: 2071
  alt: First page of the ATS Classic One Page resume template, a single-column layout with bold section headings

atsProfile: scanner-first
atsChecklist:
  - id: single-col
    label: Single column layout
    pass: true
    detail: One reading order top to bottom
  - id: std-headings
    label: Standard section headings
    pass: true
    detail: Experience, Education, Skills
  - id: no-tables
    label: No tables or text boxes
    pass: true
  - id: body-contact
    label: Contact details live in the body
    pass: true
    detail: Not in the header or footer
  - id: system-font
    label: Common system font
    pass: true
    detail: Arial 10-11pt
parseEvidence: [] # TODO(human): >=1 real parse test (e.g. Workday upload) with a screenshot
caveats:
  - One page suits roughly ten years of experience or less; use a two-page layout beyond that.

seo:
  title: ATS Classic One-Page Resume Template (Google Docs)
  metaDescription: A free single-column ATS resume template for Google Docs. Standard headings, no tables or text boxes, and one clean page parsers read in order.
  canonical: https://resumedocs.example/google-docs-resume-template/ats-classic-one-page/

faq:
  - q: Is this template really free?
    a: Yes. Open the link, choose Make a copy, and it lands in your own Google Drive with nothing to sign up for.
  - q: Will it pass an applicant tracking system?
    a: It is built scanner-first — one column, standard headings, and no tables or text boxes — so parsers read every line in order. Always tailor the wording to the job description.
  - q: How do I keep it to one page?
    a: Trim older roles to two or three bullets, drop the objective line, and use the Skills section for keywords instead of long sentences.

bulletExamples:
  - Cut monthly close time 30% by standardizing three reporting templates across four teams.
  - Onboarded 12 new hires in six months, lifting first-quarter retention from 78% to 91%.
  - Renegotiated two vendor contracts to save $48K annually with no change in service levels.

sectionGuidance:
  - section: Contact
    guidance: Name, city and state, one phone, one professional email, and a LinkedIn URL — all as plain text in the body, never in the page header.
  - section: Summary
    guidance: Two lines that name your target role and your strongest, most quantified result. Skip generic objective statements.
  - section: Experience
    guidance: Lead every bullet with a measurable outcome, then the action. Use past tense for prior roles and present tense for the current one.
  - section: Skills
    guidance: A short comma-separated list of tools and competencies that mirror the job posting's keywords. No skill-rating bars.

related: [student-internship, software-engineer]

created: 2026-06-29
updated: 2026-06-29
---

The ATS Classic One Page template is the safe default when you do not know which
applicant tracking system a company runs. Everything sits in a single column with
plain, bold section headings, so a parser reads your experience in the order you
intend and a recruiter can skim it in ten seconds. There are no tables, text boxes,
columns, or header-bar contact details — the four things that most often scramble a
machine-read resume. It is deliberately plain on purpose: the layout gets out of the
way so your results carry the page. Use it for corporate job boards, large employers,
and any posting that asks you to upload rather than apply through a designer portal.
Keep it to one tight page, mirror the posting's language in your Skills line, and let
each bullet open with a number.
