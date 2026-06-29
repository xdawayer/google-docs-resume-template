// scripts/_make-import-fixtures.mjs — one-off; produces deterministic resume fixtures
// for the import unit/e2e tests. Run: `node scripts/_make-import-fixtures.mjs`.
import { writeFileSync, mkdirSync } from "node:fs";
import { Document, Packer, Paragraph } from "docx";
import PDFDocument from "pdfkit";

const LINES = [
  "Dana Lopez",
  "San Francisco, CA | dana.lopez@example.com | (555) 234-9981 | linkedin.com/in/danalopez",
  "",
  "Summary",
  "Operations lead with 8 years scaling support teams.",
  "",
  "Experience",
  "Operations Manager — Acme Co, San Francisco, CA",
  "Jan 2021 – Present",
  "- Cut monthly close time 30% across four teams.",
  "- Onboarded 12 hires, lifting retention from 78% to 91%.",
  "",
  "Support Lead — Globex, Remote",
  "Jun 2017 – Dec 2020",
  "- Built a triage process that halved first-response time.",
  "",
  "Education",
  "B.S. in Business — UC Berkeley, Berkeley, CA — 2017",
  "",
  "Skills",
  "Excel, SQL, Zendesk, forecasting",
];

mkdirSync("tests/fixtures/resumes", { recursive: true });

// docx
const doc = new Document({ sections: [{ children: LINES.map((t) => new Paragraph(t)) }] });
Packer.toBuffer(doc).then((buf) =>
  writeFileSync("tests/fixtures/resumes/sample-chronological.docx", buf),
);

// pdf — embed a full TTF so pdf.js never needs to fetch standard fonts (keeps the
// network-free gate green). Point FIXTURE_TTF at any local .ttf.
const FONT = process.env.FIXTURE_TTF || "/System/Library/Fonts/Supplemental/Arial.ttf";
const pdf = new PDFDocument({ size: "A4", margin: 50 });
const chunks = [];
pdf.on("data", (c) => chunks.push(c));
pdf.on("end", () =>
  writeFileSync("tests/fixtures/resumes/sample-onepage.pdf", Buffer.concat(chunks)),
);
pdf.registerFont("body", FONT);
pdf.font("body").fontSize(11);
for (const t of LINES) pdf.text(t || " ");
pdf.end();
