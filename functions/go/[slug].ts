// Cloudflare Pages Function (E2). Takes precedence over the static /go fallback.
// Health-aware redirect + best-effort server-side dispatch signal (E9 server half).
// Lives outside src/ — built by Cloudflare, not by Astro / tsc.
import goMap from "../_data/go-map.json";

interface Env {
  PLAUSIBLE_API_HOST?: string;
  PLAUSIBLE_DOMAIN?: string;
}

interface GoContext {
  request: Request;
  params: { slug?: string | string[] };
  env: Env;
  waitUntil: (p: Promise<unknown>) => void;
}

interface Entry {
  copyUrl: string;
  status: string;
}

const MAP = goMap as Record<string, Entry>;
const BASE = "/google-docs-resume-template";

export const onRequest = async (ctx: GoContext): Promise<Response> => {
  const slug = String(Array.isArray(ctx.params.slug) ? ctx.params.slug[0] : ctx.params.slug ?? "");
  const entry = MAP[slug];
  const hub = new URL(`${BASE}/`, ctx.request.url).toString();

  // Unknown slug → hub (never a dead page).
  if (!entry) return Response.redirect(hub, 302);

  ctx.waitUntil(reportDispatch(ctx.env, slug, entry.status, ctx.request));

  // Healthy → the real /copy link. Anything else → detail page in "updating" state.
  if (entry.status === "available") return Response.redirect(entry.copyUrl, 302);
  return Response.redirect(new URL(`${BASE}/${slug}/?status=updating`, ctx.request.url).toString(), 302);
};

async function reportDispatch(env: Env, slug: string, status: string, request: Request): Promise<void> {
  if (!env.PLAUSIBLE_DOMAIN) return;
  const host = env.PLAUSIBLE_API_HOST ?? "https://plausible.io";
  try {
    await fetch(`${host}/api/event`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": request.headers.get("user-agent") ?? "",
        "x-forwarded-for": request.headers.get("cf-connecting-ip") ?? "",
      },
      body: JSON.stringify({
        name: "copy_dispatch_server",
        domain: env.PLAUSIBLE_DOMAIN,
        url: request.url,
        props: { slug, status },
      }),
    });
  } catch {
    // best-effort; never block the redirect
  }
};
