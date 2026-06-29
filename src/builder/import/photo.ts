/**
 * Local photo intake: turn a user-chosen image file into a small, safe data-URL
 * suitable for `basics.photo`. We downscale + re-encode on a canvas so the result
 * is always a bounded raster (well under safePhoto's 2 MB cap), drops EXIF, and
 * never an SVG. The output type matches what resume-core's safePhoto() allows.
 *
 * Browser-only (uses FileReader/Image/canvas); the pure predicate is unit-tested,
 * the full path is covered by the e2e photo-upload test.
 */

export const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export const MAX_FILE_BYTES = 12 * 1024 * 1024; // reject absurd inputs before decoding
export const MAX_DIM = 512; // longest side after downscale — plenty for an avatar
const OUTPUT_TYPE = "image/jpeg";
const QUALITY = 0.85;

export function isAcceptedImageType(type: string): boolean {
  return (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(type);
}

export async function readImageAsDataUrl(file: File): Promise<string> {
  if (!isAcceptedImageType(file.type)) {
    throw new Error("Please choose a PNG, JPEG, or WebP image.");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("That image is too large (max 12 MB).");
  }
  const raw = await readAsDataUrl(file);
  const img = await loadImage(raw);
  return downscale(img);
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("That image could not be loaded."));
    img.src = src;
  });
}

function downscale(img: HTMLImageElement): string {
  const longest = Math.max(img.width, img.height) || 1;
  const scale = Math.min(1, MAX_DIM / longest);
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process the image.");
  // White matte so transparent PNGs don't flatten to black in the JPEG output.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL(OUTPUT_TYPE, QUALITY);
}
