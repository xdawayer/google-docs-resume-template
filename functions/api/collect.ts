// First-party analytics proxy (E9). The client beacons to /api/collect; this
// forwards to Plausible so the request is same-origin (no consent banner / CLS,
// not blocked by ad-blockers as a third-party). Cloudflare Pages Function.
interface Env {
  PLAUSIBLE_API_HOST?: string;
}

interface CollectContext {
  request: Request;
  env: Env;
}

export const onRequestPost = async (ctx: CollectContext): Promise<Response> => {
  const host = ctx.env.PLAUSIBLE_API_HOST ?? "https://plausible.io";
  const body = await ctx.request.text();
  try {
    const res = await fetch(`${host}/api/event`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": ctx.request.headers.get("user-agent") ?? "",
        "x-forwarded-for": ctx.request.headers.get("cf-connecting-ip") ?? "",
      },
      body,
    });
    return new Response(null, { status: res.status });
  } catch {
    return new Response(null, { status: 202 }); // swallow; analytics never errors the user
  }
};
