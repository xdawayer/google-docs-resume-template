import { describe, it, expect } from "vitest";
import { evaluateExportQa, type ExportQaInput } from "../../scripts/export-qa";

const good: ExportQaInput = {
  slug: "ats-classic-one-page",
  pdfBytes: 48000,
  pdfPageCount: 1,
  pdfText: "Experience ".repeat(40) + "Education Skills Summary",
  docxBytes: 12000,
  expectedPageCount: 1,
  expectedHeadings: ["Experience", "Skills"],
};

describe("evaluateExportQa", () => {
  it("passes a clean one-page export", () => {
    const r = evaluateExportQa(good);
    expect(r.pass).toBe(true);
    expect(r.checks.every((c) => c.status !== "fail")).toBe(true);
  });

  it("fails when the page count does not match the declared pageCount", () => {
    const r = evaluateExportQa({ ...good, pdfPageCount: 2 });
    expect(r.pass).toBe(false);
    expect(r.checks.find((c) => c.id === "pdf-pages")?.status).toBe("fail");
  });

  it("fails an empty / image-only PDF with no extractable text", () => {
    const r = evaluateExportQa({ ...good, pdfText: "" });
    expect(r.pass).toBe(false);
    expect(r.checks.find((c) => c.id === "pdf-text")?.status).toBe("fail");
  });

  it("fails a zero-byte DOCX export", () => {
    const r = evaluateExportQa({ ...good, docxBytes: 0 });
    expect(r.pass).toBe(false);
    expect(r.checks.find((c) => c.id === "docx-nonempty")?.status).toBe("fail");
  });

  it("warns (not fails) on a missing heading or unknown page count", () => {
    const r = evaluateExportQa({ ...good, pdfPageCount: null, expectedHeadings: ["Nonexistent"] });
    expect(r.pass).toBe(true); // warns do not fail
    expect(r.checks.find((c) => c.id === "pdf-pages")?.status).toBe("warn");
    expect(r.checks.find((c) => c.id === "headings")?.status).toBe("warn");
  });
});
