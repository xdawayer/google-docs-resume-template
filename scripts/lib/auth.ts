import { JWT } from "google-auth-library";

/**
 * Service-account auth for Drive (read-only). Key is GOOGLE_SA_KEY (raw JSON,
 * Decision #12). Scripts/cron only — never imported by the page build.
 */
export function hasCreds(): boolean {
  return Boolean(process.env.GOOGLE_SA_KEY);
}

export function getServiceAuth(): JWT {
  return jwtFrom(process.env.GOOGLE_SA_KEY, "GOOGLE_SA_KEY", [
    "https://www.googleapis.com/auth/drive.readonly",
  ]);
}

export function hasGscCreds(): boolean {
  return Boolean(process.env.GSC_SA_KEY);
}

export function getGscAuth(): JWT {
  return jwtFrom(process.env.GSC_SA_KEY, "GSC_SA_KEY", [
    "https://www.googleapis.com/auth/webmasters.readonly",
  ]);
}

function jwtFrom(raw: string | undefined, name: string, scopes: string[]): JWT {
  if (!raw) throw new Error(`${name} is not set (service-account JSON required)`);
  const creds = JSON.parse(raw) as { client_email: string; private_key: string };
  return new JWT({ email: creds.client_email, key: creds.private_key, scopes });
}
