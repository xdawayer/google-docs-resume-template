// Cloudflare Pages Function — owned short-link registration for link attribution tools.
// POST { code, destination_url } -> persists code->destination in KV (binding: LINK_REDIRECTS).
// Mirrors the gengrowth/astrologywiki/aigenerator registration contract; destination is
// locked to googledocsresumetemplate.com. Lives outside src/ — built by Cloudflare, not tsc.

// Minimal structural type so this compiles without @cloudflare/workers-types.
interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

interface Env {
  LINK_REDIRECTS?: KVNamespace;
}

interface FnContext {
  request: Request;
  env: Env;
}

const ALLOWED_CORS_ORIGINS = new Set([
  "null",
  "https://googledocsresumetemplate.com",
  "https://www.googledocsresumetemplate.com",
]);
const OWNED_HOSTS = new Set([
  "googledocsresumetemplate.com",
  "www.googledocsresumetemplate.com",
]);
const CODE_PATTERN = /^[a-z0-9][a-z0-9-]{0,79}$/;
const KEY_PREFIX = "code:";

function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("origin");
  const allowOrigin =
    origin && ALLOWED_CORS_ORIGINS.has(origin)
      ? origin
      : "https://www.googledocsresumetemplate.com";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store",
    Vary: "Origin",
  };
}

function json(request: Request, body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(request) },
  });
}

function errorJson(
  request: Request,
  code: string,
  message: string,
  status: number,
): Response {
  return json(request, { error: { code, message } }, status);
}

function normalizeCode(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const code = raw.trim().toLowerCase();
  return CODE_PATTERN.test(code) ? code : null;
}

function normalizeDestination(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  try {
    const url = new URL(raw.trim());
    if (!OWNED_HOSTS.has(url.hostname.toLowerCase())) return null;
    url.protocol = "https:";
    return url.href;
  } catch {
    return null;
  }
}

export const onRequestOptions = (ctx: FnContext): Response =>
  new Response(null, { status: 204, headers: corsHeaders(ctx.request) });

export const onRequestPost = async (ctx: FnContext): Promise<Response> => {
  const { request, env } = ctx;

  if (!env.LINK_REDIRECTS) {
    return errorJson(
      request,
      "storage_unconfigured",
      "KV binding LINK_REDIRECTS is not configured for this project.",
      500,
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorJson(request, "INVALID_JSON", "Request body must be valid JSON.", 400);
  }

  const input = body as { code?: unknown; destination_url?: unknown };
  const code = normalizeCode(input.code);
  if (!code) {
    return errorJson(
      request,
      "INVALID_CODE",
      "Short-link code must use 1-80 lowercase letters, numbers, or hyphens.",
      400,
    );
  }

  const destinationUrl = normalizeDestination(input.destination_url);
  if (!destinationUrl) {
    return errorJson(
      request,
      "INVALID_DESTINATION",
      "Destination must be on googledocsresumetemplate.com or www.googledocsresumetemplate.com.",
      400,
    );
  }

  const key = `${KEY_PREFIX}${code}`;
  try {
    const existing = await env.LINK_REDIRECTS.get(key);
    if (existing) {
      if (existing === destinationUrl) {
        return json(
          request,
          {
            data: {
              code,
              destination_url: destinationUrl,
              reused: true,
              short_url: `https://www.googledocsresumetemplate.com/${code}`,
            },
          },
          200,
        );
      }
      return errorJson(
        request,
        "code_conflict",
        "This short-link code already points to another destination.",
        409,
      );
    }

    await env.LINK_REDIRECTS.put(key, destinationUrl);
    return json(
      request,
      {
        data: {
          code,
          destination_url: destinationUrl,
          reused: false,
          short_url: `https://www.googledocsresumetemplate.com/${code}`,
        },
      },
      201,
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Short-link registration failed.";
    return errorJson(request, "REGISTRATION_FAILED", message, 500);
  }
};
