import { describe, it, expect } from "vitest";
import { isAcceptedImageType, ACCEPTED_IMAGE_TYPES } from "../../src/builder/import/photo";
import { sanitizeResume } from "../../src/builder/resume-core";
import { resumeSchema } from "../../src/builder/resume-schema";

// readImageAsDataUrl is browser-only (FileReader/Image/canvas) and is covered by the
// e2e photo-upload test. Here we lock the type allowlist and confirm the data-URL
// it produces (image/jpeg) survives the sanitizer that gates basics.photo.
describe("isAcceptedImageType", () => {
  it("accepts png/jpeg/webp, rejects svg and others", () => {
    expect(isAcceptedImageType("image/png")).toBe(true);
    expect(isAcceptedImageType("image/jpeg")).toBe(true);
    expect(isAcceptedImageType("image/webp")).toBe(true);
    expect(isAcceptedImageType("image/svg+xml")).toBe(false);
    expect(isAcceptedImageType("image/gif")).toBe(false);
    expect(isAcceptedImageType("text/html")).toBe(false);
    expect(isAcceptedImageType("")).toBe(false);
  });
  it("never includes svg in the allowlist", () => {
    expect(ACCEPTED_IMAGE_TYPES).not.toContain("image/svg+xml");
  });
});

describe("photo data-URL passes the sanitizer", () => {
  const base = resumeSchema.parse({});
  it("keeps a small jpeg data-URL (what the canvas produces)", () => {
    const jpeg = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ=="; // tiny, well-formed
    const out = sanitizeResume({ ...base, basics: { ...base.basics, photo: jpeg } });
    expect(out.basics.photo).toBe(jpeg);
  });
  it("still rejects an svg data-URL even if it reaches photo", () => {
    const svg = "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=";
    const out = sanitizeResume({ ...base, basics: { ...base.basics, photo: svg } });
    expect(out.basics.photo).toBe("");
  });
});
