import { JWT } from "google-auth-library";

/**
 * Service-account auth for Drive (read-only). Key is GOOGLE_SA_KEY (raw JSON,
 * Decision #12). Scripts/cron only — never imported by the page build.
 */
export function hasCreds(): boolean {
  return Boolean(process.env.GOOGLE_SA_KEY);
}

export function getServiceAuth(): JWT {
  const raw = process.env.GOOGLE_SA_KEY;
  if (!raw) throw new Error("GOOGLE_SA_KEY is not set (service-account JSON required)");
  const creds = JSON.parse(raw) as { client_email: string; private_key: string };
  return new JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });
}
