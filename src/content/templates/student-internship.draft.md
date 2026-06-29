---
# DRAFT — content authored; excluded from gates until the external artifacts are real.
# Pending (require the governed Workspace, not fakeable here):
#   docId + copyUrl (real Google Doc), thumbnail screenshot (E6: pnpm shots:gen needs
#   GOOGLE_SA_KEY), parseEvidence (real ATS parse test), linkStatus (E1 health check).
# Promote: fill those, run `pnpm shots:gen` + `pnpm check:links`, set status: published,
# then rename student-internship.draft.md -> student-internship.md and `pnpm validate`.
slug: student-internship
name: Student Internship
status: draft

category: [student, simple]
roles: [student]
experienceLevel: [entry]
pageCount: 1

docId: REPLACE_WITH_DOC_ID # TODO(human): real governed Google Doc id
copyUrl: https://docs.google.com/document/d/REPLACE_WITH_DOC_ID/copy
linkStatus: unverified

thumbnail:
  src: src/assets/templates/student-internship.png # TODO: pnpm shots:gen (needs GOOGLE_SA_KEY)
  width: 1600
  height: 2071
  alt: First page of the Student Internship resume template, leading with an education and projects section

atsProfile: balanced
atsChecklist:
  - id: single-col
    label: Single column layout
    pass: true
  - id: edu-first
    label: Education placed first
    pass: true
    detail: Best when school is your strongest signal
  - id: std-headings
    label: Standard section headings
    pass: true
    detail: Education, Projects, Experience
  - id: no-photo
    label: No photo or personal data
    pass: true
    detail: No date of birth or headshot
  - id: dates-consistent
    label: Consistent month-year dates
    pass: true
parseEvidence: [] # TODO(human): >=1 real parse test with a screenshot
caveats:
  - Designed for under two years of experience; once you have full-time roles, switch to a work-history-first layout.

seo:
  title: Student & Internship Resume Template (Google Docs)
  metaDescription: A free student and internship resume template for Google Docs. An education-first layout with room for projects, coursework, and activities.
  canonical: https://googledocsresumetemplate.com/google-docs-resume-template/student-internship/

faq:
  - q: I have no work experience — can I still use this?
    a: Yes. The layout leads with Education and Projects, so coursework, a capstone, club work, or volunteering can carry the page until you have jobs to list.
  - q: Should I include my GPA?
    a: List it if it is 3.3 or higher, or if the posting asks. Otherwise leave it off and use the space for a project bullet.
  - q: Do class projects count as experience?
    a: They do. Describe a project like a job — what you built, the tools you used, and the result — and recruiters read it as real, applied work.

bulletExamples:
  - Built a 5-page market analysis in a team of four that the professor used as a course exemplar.
  - Tutored 20+ first-year students weekly in calculus, raising the group's average exam score one letter grade.
  - Led a campus club of 30 members and grew event attendance 60% across one semester.

sectionGuidance:
  - section: Education
    guidance: School, degree, expected graduation month and year, and a short line of relevant coursework or honors. Keep it first while you are still studying.
  - section: Projects
    guidance: Two or three projects with a one-line what-and-why plus a measurable result. Name the tools so keyword scans catch them.
  - section: Experience
    guidance: Part-time jobs, internships, and volunteering all count. Lead with the transferable skill, not the job title.
  - section: Skills & Activities
    guidance: Group hard skills and tools, then list leadership or activities that show initiative. Avoid soft-skill clichés like hard-working.

related: [ats-classic-one-page, software-engineer]

created: 2026-06-29
updated: 2026-06-29
---

The Student Internship template is built for the moment when your strongest signal is
your education, not a job history. It leads with Education and Projects, so a capstone,
a class build, club leadership, or volunteering can fill the page convincingly while a
recruiter sees momentum rather than gaps. The structure stays single-column and
machine-readable, but the balanced profile leaves room for a clean Projects block and
an Activities line that show initiative beyond coursework. Treat every project like a
small job: say what you made, name the tools, and end on a number or an outcome.
Reach for this template for internships, co-ops, new-grad postings, and first
part-time roles — anywhere you need to prove capability before you can point to
years on the job.
