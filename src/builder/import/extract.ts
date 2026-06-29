import type { ExtractedText } from "./types";

export const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
export const ACCEPTED = [DOCX, "application/pdf"];

export async function extractText(input: File | string): Promise<ExtractedText> {
  if (typeof input === "string") return { text: input, source: "paste" };

  const type = input.type || guessByName(input.name);
  if (!ACCEPTED.includes(type)) throw new Error(`Unsupported file type: ${type || "unknown"}`);
  if (input.size > MAX_BYTES) throw new Error("File too large (max 8 MB).");
  const buf = await input.arrayBuffer();

  if (type === DOCX) {
    const mammoth = await import("mammoth/mammoth.browser");
    const { value } = await mammoth.extractRawText({ arrayBuffer: buf });
    return { text: value, source: "docx" };
  }

  // pdf — LOCAL worker only (bundled by Vite, same-origin). Never a CDN. Fixtures embed
  // their font, so pdf.js makes no font fetch; if the network-free gate ever catches a
  // font fetch, bundle pdfjs-dist/standard_fonts and pass a same-origin standardFontDataUrl.
  const pdfjs = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  let text = "";
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    text += content.items.map((it) => ("str" in it ? it.str : "")).join(" ") + "\n";
  }
  return { text, source: "pdf" };
}

function guessByName(name: string): string {
  if (/\.docx$/i.test(name)) return DOCX;
  if (/\.pdf$/i.test(name)) return "application/pdf";
  return "";
}
