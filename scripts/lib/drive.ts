import { google, type drive_v3 } from "googleapis";
import type { JWT } from "google-auth-library";
import { createHash } from "node:crypto";

export interface DriveMeta {
  exists: boolean;
  trashed: boolean;
  mimeType: string;
  modifiedTime: string;
}

export function driveClient(auth: JWT): drive_v3.Drive {
  return google.drive({ version: "v3", auth });
}

export async function getMeta(drive: drive_v3.Drive, docId: string): Promise<DriveMeta> {
  const res = await drive.files.get({
    fileId: docId,
    fields: "mimeType,trashed,modifiedTime",
    supportsAllDrives: true,
  });
  const d = res.data;
  return {
    exists: true,
    trashed: Boolean(d.trashed),
    mimeType: d.mimeType ?? "",
    modifiedTime: d.modifiedTime ?? "",
  };
}

/** Primary health signal (E1, Decision #11): is the doc shared anyone-with-link reader? */
export async function anyoneCanRead(drive: drive_v3.Drive, docId: string): Promise<boolean> {
  const res = await drive.permissions.list({
    fileId: docId,
    fields: "permissions(type,role)",
    supportsAllDrives: true,
  });
  return (res.data.permissions ?? []).some(
    (p) => p.type === "anyone" && (p.role === "reader" || p.role === "writer"),
  );
}

export async function exportPdf(drive: drive_v3.Drive, docId: string): Promise<Buffer> {
  const res = await drive.files.export(
    { fileId: docId, mimeType: "application/pdf" },
    { responseType: "arraybuffer" },
  );
  return Buffer.from(res.data as ArrayBuffer);
}

export function sha256(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex");
}
