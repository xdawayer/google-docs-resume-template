import { describe, it, expect } from "vitest";
import { canonicalHostRedirect } from "../../functions/_middleware";

// Path B 任务 G ①: www.googledocsresumetemplate.com must 301 to the bare apex.
// Before this guard, www pages returned 200 (reachable under two hosts).
describe("canonicalHostRedirect (www → apex 301)", () => {
  it("redirects the www root to the bare apex root", () => {
    expect(canonicalHostRedirect("https://www.googledocsresumetemplate.com/")).toBe(
      "https://googledocsresumetemplate.com/",
    );
  });

  it("preserves the full path and query string", () => {
    expect(
      canonicalHostRedirect(
        "https://www.googledocsresumetemplate.com/google-docs-resume-template/?ref=hn",
      ),
    ).toBe("https://googledocsresumetemplate.com/google-docs-resume-template/?ref=hn");
  });

  it("leaves the apex host untouched (no redirect loop)", () => {
    expect(
      canonicalHostRedirect("https://googledocsresumetemplate.com/google-docs-resume-template/"),
    ).toBeNull();
  });

  it("leaves *.pages.dev preview deploys untouched", () => {
    expect(canonicalHostRedirect("https://abc123.gdrt.pages.dev/")).toBeNull();
  });

  it("leaves localhost dev untouched", () => {
    expect(canonicalHostRedirect("http://localhost:4321/google-docs-resume-template/")).toBeNull();
  });

  it("does not match an unrelated host that merely contains the apex string", () => {
    expect(canonicalHostRedirect("https://www.googledocsresumetemplate.com.evil.test/")).toBeNull();
  });
});
