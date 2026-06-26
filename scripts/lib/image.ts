import sharp from "sharp";

export interface MasterResult {
  width: number;
  height: number;
}

/**
 * Normalize a first-page PNG render into a committed US-Letter master:
 * trim borders, flatten on white, cap to a stable 1600px wide master that the
 * Astro <Image> pipeline (M4) derives 320/480/720/960 variants from at build.
 */
export async function writeMaster(
  pngBuffer: Buffer,
  outPath: string,
  targetWidth = 1600,
): Promise<MasterResult> {
  const img = sharp(pngBuffer)
    .flatten({ background: "#ffffff" })
    .resize({ width: targetWidth, withoutEnlargement: true });
  const out = await img.png({ quality: 90 }).toBuffer();
  await sharp(out).toFile(outPath);
  const meta = await sharp(out).metadata();
  return { width: meta.width ?? targetWidth, height: meta.height ?? 0 };
}
