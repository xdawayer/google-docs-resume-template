/**
 * Client analytics contract (E9). One place defines the event names + payload so
 * the island and any future caller agree. Beacons go first-party to /api/collect
 * (a Cloudflare function proxies to Plausible) via sendBeacon, which survives the
 * page navigating away — so an outbound copy click is never dropped.
 *
 * HONEST MEASUREMENT (Decision #7): `copy_google_docs_click` is INTENT only — it
 * fires on click, before the Google destination resolves. It does NOT prove a
 * successful copy (that happens on docs.google.com and is unmeasurable). The
 * server-side `copy_dispatch_server` (from /go) + the E1 link-health status are
 * the real proxies for "served a good link".
 */
export const ANALYTICS_ENDPOINT = "/api/collect";

export type AnalyticsEvent =
  | "copy_google_docs_click"
  | "template_preview_open"
  | "template_filter_click"
  | "download_word_click"
  | "faq_expand";

export type EventProps = Record<string, string>;

export function sendEvent(name: AnalyticsEvent, props: EventProps = {}): void {
  try {
    const payload = JSON.stringify({ name, domain: location.hostname, url: location.href, props });
    navigator.sendBeacon?.(ANALYTICS_ENDPOINT, new Blob([payload], { type: "text/plain" }));
  } catch {
    /* analytics never errors the user */
  }
}
