/**
 * Offline asset-completeness gate (part of E3). Runs in `prebuild` after
 * validate-content. Confirms every referenced image exists on disk and its real
 * dimensions match the declared width/height (CLS guard, E10). No network.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { imageSize } from "image-size";
import { templateSchema } from "../src/content/schema";
import { loadRawTemplates } from "./_shared";

function checkImage(
  srcPath: string,
  declared: { width: number; height: number } | null,
  relpath: string,
  label: string,
  errors: string[],
): void {
  const abs = resolve(process.cwd(), srcPath);
  if (!existsSync(abs)) {
    errors.push(`${relpath}: ${label} not found on disk: ${srcPath}`);
    return;
  }
  if (declared) {
    const dim = imageSize(readFileSync(abs));
    if (dim.width !== declared.width || dim.height !== declared.height) {
      errors.push(
        `${relpath}: ${label} real dims ${dim.width}x${dim.height} != declared ${declared.width}x${declared.height}`,
      );
    }
  }
}

function main(): void {
  const raws = loadRawTemplates();
  const errors: string[] = [];
  for (const r of raws) {
    const res = templateSchema.safeParse(r.data);
    if (!res.success) continue; // schema errors are reported by validate-content
    const t = res.data;
    checkImage(
      t.thumbnail.src,
      { width: t.thumbnail.width, height: t.thumbnail.height },
      r.relpath,
      "thumbnail",
      errors,
    );
    if (t.seo.ogImage) checkImage(t.seo.ogImage, null, r.relpath, "ogImage", errors);
    for (const pe of t.parseEvidence) {
      if (pe.image) checkImage(pe.image, null, r.relpath, `parseEvidence(${pe.tool})`, errors);
    }
  }
  if (errors.length) {
    console.error(`\n✗ check-assets: ${errors.length} error(s):\n`);
    for (const e of errors) console.error(`  - ${e}`);
    console.error("");
    process.exit(1);
  }
  console.log(`✓ check-assets: all referenced images present and correctly sized`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
