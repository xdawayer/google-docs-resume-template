import { describe, it, expect } from "vitest";
import { HeuristicParser } from "../../src/builder/import/heuristic-parser";
import { resumeSchema } from "../../src/builder/resume-schema";

const parser = new HeuristicParser();
const parse = (text: string) => parser.parse({ text, source: "paste" });

const CHRONO = `Dana Lopez
San Francisco, CA | dana.lopez@example.com | (555) 234-9981 | linkedin.com/in/danalopez

Summary
Operations lead with 8 years scaling support teams.

Experience
Operations Manager — Acme Co, San Francisco, CA
Jan 2021 – Present
- Cut monthly close time 30% across four teams.
- Onboarded 12 hires, lifting retention from 78% to 91%.

Support Lead — Globex, Remote
Jun 2017 – Dec 2020
- Built a triage process that halved first-response time.

Education
B.S. in Business — UC Berkeley, Berkeley, CA — 2017

Skills
Excel, SQL, Zendesk, forecasting`;

describe("HeuristicParser", () => {
  it("extracts the contact block", async () => {
    const { resume } = await parse(CHRONO);
    expect(resume.basics.fullName).toBe("Dana Lopez");
    expect(resume.basics.email).toBe("dana.lopez@example.com");
    expect(resume.basics.phone).toContain("555");
    expect(resume.basics.links.some((l) => l.url.includes("linkedin.com"))).toBe(true);
  });

  it("splits experience entries with bullets", async () => {
    const { resume } = await parse(CHRONO);
    expect(resume.experience.length).toBe(2);
    expect(resume.experience[0]!.title).toMatch(/Operations Manager/);
    expect(resume.experience[0]!.company).toMatch(/Acme/);
    expect(resume.experience[0]!.bullets.length).toBe(2);
    expect(resume.experience[0]!.end).toMatch(/Present/i);
  });

  it("extracts education + skills + summary", async () => {
    const { resume } = await parse(CHRONO);
    expect(resume.summary).toMatch(/Operations lead/);
    expect(resume.education[0]!.school).toMatch(/Berkeley/);
    expect(resume.skills[0]!.items).toMatch(/SQL/);
  });

  it("always returns schema-valid output, even on garbage", async () => {
    for (const t of [CHRONO, "", "just a name\nand some lines", "•••\n---"]) {
      const { resume, confidence } = await parse(t);
      expect(() => resumeSchema.parse(resume)).not.toThrow();
      expect(typeof confidence).toBe("object");
    }
  });

  it("does not turn the email into junk Website links", async () => {
    const { resume } = await parse(CHRONO);
    expect(resume.basics.links.map((l) => l.url)).not.toContain("https://example.com");
    expect(resume.basics.links.every((l) => !/dana\.lopez$/.test(l.url))).toBe(true);
    expect(resume.basics.links.some((l) => l.url.includes("linkedin.com"))).toBe(true);
  });

  it("splits an ASCII-hyphen title/company header", async () => {
    const { resume } = await parse(
      "Experience\nOperations Manager - Acme Co, Remote\nJan 2021 – Present\n- did x",
    );
    expect(resume.experience[0]!.title).toBe("Operations Manager");
    expect(resume.experience[0]!.company).toBe("Acme Co");
  });

  it("handles a date range on the header line without leaking into company", async () => {
    const { resume } = await parse("Experience\nPM — Acme Jan 2021 – Present\n- shipped");
    expect(resume.experience[0]!.company).toMatch(/Acme/);
    expect(resume.experience[0]!.company).not.toMatch(/2021|Present/);
    expect(resume.experience[0]!.end).toMatch(/Present/i);
  });

  it("warns when no section headings are detected", async () => {
    const { warnings } = await parse("Jane Roe\njane@x.com\nDid some things here.");
    expect(warnings.join(" ")).toMatch(/no section headings/i);
  });
});
