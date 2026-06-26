import type { ImageMetadata } from "astro";

/**
 * Build-time map of template thumbnail masters for astro:assets. The screenshot
 * pipeline (M2) writes masters to src/assets/templates/{slug}.png; the schema's
 * thumbnail.src is the same path string. Components resolve the string to an
 * ImageMetadata here so <Image> can emit responsive AVIF/WebP variants (E10).
 */
const MAP = import.meta.glob<{ default: ImageMetadata }>(
  "/src/assets/templates/*.{png,webp,jpg,jpeg,avif}",
  { eager: true },
);

export function resolveThumb(src: string): ImageMetadata | undefined {
  const key = src.startsWith("/") ? src : `/${src}`;
  return MAP[key]?.default;
}
