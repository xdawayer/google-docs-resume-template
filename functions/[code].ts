// Cloudflare Pages Function — root short-link entrypoint (/q1abc123 -> 302 destination).
// Looks up owned codes in KV (binding: LINK_REDIRECTS); for anything that isn't a registered
// digit-bearing short code it calls next() so normal static pages are served untouched.
// Lives outside src/ — built by Cloudflare, not by Astro / tsc.

interface KVNamespace {
  get(key: string): Promise<string | null>;
}

interface Env {
  LINK_REDIRECTS?: KVNamespace;
}

interface FnContext {
  params: { code?: string | string[] };
  env: Env;
  next: () => Promise<Response>;
}

// Bare short codes are 6-80 chars of [a-z0-9-] AND must contain a digit. The
// link-attribution tool always generates codes like `q1<hash>` (digit-bearing),
// so this guard never shadows real word-like pages.
const SHORT_CODE = /^[a-z0-9-]{6,80}$/;
const HAS_DIGIT = /[0-9]/;
const KEY_PREFIX = "code:";

function shortCode(raw: string | string[] | undefined): string | null {
  const value = String(Array.isArray(raw) ? raw[0] : (raw ?? "")).toLowerCase();
  if (!SHORT_CODE.test(value) || !HAS_DIGIT.test(value)) return null;
  return value;
}

export const onRequest = async (ctx: FnContext): Promise<Response> => {
  const code = shortCode(ctx.params.code);
  if (!code || !ctx.env.LINK_REDIRECTS) {
    return ctx.next();
  }

  const destination = await ctx.env.LINK_REDIRECTS.get(`${KEY_PREFIX}${code}`);
  if (!destination) {
    return ctx.next();
  }

  return Response.redirect(destination, 302);
};
