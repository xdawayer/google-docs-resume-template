import { describe, it, expect } from "vitest";
import { extractText, ACCEPTED, MAX_BYTES, MAX_TEXT } from "../../src/builder/import/extract";

// Node-safe paths only: paste returns early, guards throw before the dynamic
// mammoth/pdf.js import. Real docx/pdf extraction is validated by the Playwright gate.
describe("extractText (node-safe paths)", () => {
  it("passes through pasted text", async () => {
    expect(await extractText("hello\nworld")).toEqual({ text: "hello\nworld", source: "paste" });
  });

  it("rejects an unsupported type", async () => {
    const f = new File([new Uint8Array([1, 2, 3])], "x.exe", { type: "application/x-msdownload" });
    await expect(extractText(f)).rejects.toThrow(/unsupported/i);
  });

  it("rejects an oversized file", async () => {
    const big = new File([new Uint8Array(MAX_BYTES + 1)], "big.pdf", { type: "application/pdf" });
    await expect(extractText(big)).rejects.toThrow(/too large/i);
  });

  it("exposes the accepted-type allowlist", () => {
    expect(ACCEPTED).toContain("application/pdf");
  });

  it("caps a huge paste to MAX_TEXT", async () => {
    const r = await extractText("x".repeat(MAX_TEXT + 5000));
    expect(r.source).toBe("paste");
    expect(r.text.length).toBe(MAX_TEXT);
  });
});
