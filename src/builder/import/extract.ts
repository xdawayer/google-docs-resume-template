import type { ExtractedText } from "./types";

export const MAX_BYTES = 8 * 1024 * 1024; // 8 MB compressed-file cap
export const MAX_TEXT = 256 * 1024; // bound parser/render work on huge inputs
const MAX_PDF_PAGES = 30; // a resume is a few pages; cap a many-page bomb
const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
export const ACCEPTED = [DOCX, "application/pdf"];

export async function extractText(input: File | string): Promise<ExtractedText> {
  // Paste also gets a length cap — the 8 MB file guard doesn't apply to it.
  if (typeof input === "string") return { text: input.slice(0, MAX_TEXT), source: "paste" };

  const type = input.type || guessByName(input.name);
  if (!ACCEPTED.includes(type)) throw new Error(`Unsupported file type: ${type || "unknown"}`);
  if (input.size > MAX_BYTES) throw new Error("File too large (max 8 MB).");
  const buf = await input.arrayBuffer();

  if (type === DOCX) {
    const mammoth = await import("mammoth/mammoth.browser");
    const { value } = await mammoth.extractRawText({ arrayBuffer: buf });
    return { text: value.slice(0, MAX_TEXT), source: "docx" };
  }

  // pdf — LOCAL worker only (bundled by Vite, same-origin). Never a CDN. Fixtures embed
  // their font, so pdf.js makes no font fetch; if the network-free gate ever catches a
  // font fetch, bundle pdfjs-dist/standard_fonts and pass a same-origin standardFontDataUrl.
  const pdfjs = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  const pages = Math.min(doc.numPages, MAX_PDF_PAGES);
  let text = "";
  for (let p = 1; p <= pages && text.length < MAX_TEXT; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    // Preserve line breaks (item.hasEOL) so the line-based parser can find headings;
    // joining with only spaces collapses a page to one line and defeats parsing.
    text += content.items
      .map((it) => ("str" in it ? it.str + (it.hasEOL ? "\n" : " ") : ""))
      .join("");
    text += "\n";
  }
  return { text: text.slice(0, MAX_TEXT), source: "pdf" };
}

function guessByName(name: string): string {
  if (/\.docx$/i.test(name)) return DOCX;
  if (/\.pdf$/i.test(name)) return "application/pdf";
  return "";
}
