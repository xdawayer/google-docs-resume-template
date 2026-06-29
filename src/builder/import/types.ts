import type { Resume } from "../resume-core";

export interface ExtractedText {
  text: string;
  source: "docx" | "pdf" | "paste";
}

// JSON Pointer (RFC 6901) -> 0..1. v1 scores at section/entry granularity
// (e.g. "/basics/email", "/experience/0"). ImportPanel flags keys < 0.6.
export type FieldConfidence = Record<string, number>;

export interface ParseResult {
  resume: Resume;
  confidence: FieldConfidence;
  warnings: string[];
}

export interface ResumeParser {
  parse(input: ExtractedText): Promise<ParseResult>;
}
