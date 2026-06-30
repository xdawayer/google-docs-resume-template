/**
 * Generates the static brand assets that the head references but that no build
 * step otherwise produces:
 *   - public/og/default.png        1200x630 social card (og:image / twitter:image)
 *   - public/icon-512.png          512x512 brand mark (Organization logo)
 *   - public/apple-touch-icon.png  180x180 home-screen icon
 *
 * Rendered offline via Playwright setContent (no dev server needed). The brand
 * woff2 files in public/fonts are inlined as base64 so the card uses the real
 * Space Grotesk / DM Sans, not a system fallback.
 *
 * Re-run after changing the brand palette, wordmark, or copy:
 *   pnpm tsx scripts/gen-og-image.ts
 */
import { chromium } from "@playwright/test";
import { mkdirSync, readFileSync } from "node:fs";

function b64(path: string): string {
  return readFileSync(path).toString("base64");
}

const display = b64("public/fonts/space-grotesk-700.woff2");
const body = b64("public/fonts/dm-sans-500.woff2");

const fontFaces = `
  @font-face { font-family: "Space Grotesk"; font-weight: 700; font-display: block;
    src: url(data:font/woff2;base64,${display}) format("woff2"); }
  @font-face { font-family: "DM Sans"; font-weight: 500; font-display: block;
    src: url(data:font/woff2;base64,${body}) format("woff2"); }
`;

// The product mark, reused by the social card and the PNG icons.
const MARK = `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <rect width="64" height="64" rx="14" fill="#4f46e5"/>
  <rect x="18" y="13" width="28" height="38" rx="3" fill="#ffffff"/>
  <rect x="23" y="20" width="12" height="3" rx="1.5" fill="#4f46e5"/>
  <rect x="23" y="28" width="18" height="2.4" rx="1.2" fill="#c7c9f7"/>
  <rect x="23" y="34" width="18" height="2.4" rx="1.2" fill="#c7c9f7"/>
  <rect x="23" y="40" width="12" height="2.4" rx="1.2" fill="#c7c9f7"/>
</svg>`;

const ogHtml = `<!doctype html><html><head><meta charset="utf-8"><style>
  ${fontFaces}
  * { box-sizing: border-box; margin: 0; }
  body { width: 1200px; height: 630px; font-family: "DM Sans", sans-serif;
    background: #fafafb; color: #0e0e14; overflow: hidden; position: relative; }
  .glow { position: absolute; top: -260px; right: -160px; width: 700px; height: 700px;
    background: radial-gradient(circle, rgba(99,102,241,0.30), transparent 62%); }
  .pad { position: relative; padding: 64px 72px; height: 100%; display: flex; flex-direction: column; }
  .brand { display: flex; align-items: center; gap: 16px; }
  .brand svg { width: 56px; height: 56px; }
  .brand b { font-family: "Space Grotesk", sans-serif; font-weight: 700; font-size: 30px; letter-spacing: -0.02em; }
  .row { display: flex; align-items: center; gap: 48px; flex: 1; }
  .copy { max-width: 660px; }
  h1 { font-family: "Space Grotesk", sans-serif; font-weight: 700; font-size: 66px;
    line-height: 1.04; letter-spacing: -0.03em; margin-top: 40px; }
  h1 .g { background: linear-gradient(90deg,#4f46e5,#6366f1); -webkit-background-clip: text;
    background-clip: text; color: transparent; }
  p { font-size: 27px; line-height: 1.4; color: #5a5a6b; margin-top: 24px; }
  .chips { display: flex; gap: 12px; margin-top: 34px; }
  .chip { font-size: 20px; font-weight: 600; color: #4338ca; background: #eef2ff;
    border: 1px solid #d7d7e0; border-radius: 999px; padding: 9px 18px; }
  .sheet { width: 300px; height: 400px; background: #fff; border: 1px solid #e8e8ee;
    border-radius: 12px; box-shadow: 0 20px 50px rgba(13,13,25,0.14); padding: 30px 26px; flex: none; }
  .sheet .nm { font-family: "Space Grotesk", sans-serif; font-weight: 700; font-size: 22px; letter-spacing: 0.04em; }
  .sheet .rl { color: #4f46e5; font-weight: 600; font-size: 15px; margin-top: 6px; }
  .sheet .hr { height: 2px; background: #4f46e5; margin: 16px 0; }
  .sheet .h { font-weight: 700; font-size: 14px; margin: 14px 0 8px; }
  .sheet .ln { height: 8px; border-radius: 4px; background: #ececf3; margin: 7px 0; }
  .domain { font-size: 22px; font-weight: 600; color: #0e0e14; }
</style></head><body>
  <div class="glow"></div>
  <div class="pad">
    <div class="brand">${MARK}<b>ResumeDocs</b></div>
    <div class="row">
      <div class="copy">
        <h1>Free <span class="g">Google&nbsp;Docs</span> resume templates</h1>
        <p>Copy a template, edit it, and download a clean, ATS-ready PDF. No signup.</p>
        <div class="chips"><span class="chip">ATS-friendly</span><span class="chip">Free</span><span class="chip">No signup</span></div>
      </div>
      <div class="sheet">
        <div class="nm">ALEX MORGAN</div>
        <div class="rl">Software Engineer</div>
        <div class="hr"></div>
        <div class="h">Professional Summary</div>
        <div class="ln" style="width:96%"></div><div class="ln" style="width:78%"></div>
        <div class="h">Experience</div>
        <div class="ln" style="width:60%"></div><div class="ln" style="width:92%"></div><div class="ln" style="width:74%"></div>
      </div>
    </div>
    <div class="domain">googledocsresumetemplate.com</div>
  </div>
</body></html>`;

function iconHtml(size: number): string {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    *{margin:0} body{width:${size}px;height:${size}px;overflow:hidden}
    svg{width:${size}px;height:${size}px;display:block}
  </style></head><body>${MARK}</body></html>`;
}

async function main(): Promise<void> {
  mkdirSync("public/og", { recursive: true });
  const browser = await chromium.launch();

  // OG card — exact 1200x630 so og:image:width/height stay truthful.
  const og = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  await og.setContent(ogHtml, { waitUntil: "load" });
  await og.evaluate(() => document.fonts.ready);
  await og.screenshot({ path: "public/og/default.png" });
  console.log("wrote public/og/default.png (1200x630)");

  for (const size of [512, 180]) {
    const out = size === 512 ? "public/icon-512.png" : "public/apple-touch-icon.png";
    const p = await browser.newPage({
      viewport: { width: size, height: size },
      deviceScaleFactor: 1,
    });
    await p.setContent(iconHtml(size), { waitUntil: "load" });
    await p.screenshot({ path: out, omitBackground: true });
    console.log(`wrote ${out} (${size}x${size})`);
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
