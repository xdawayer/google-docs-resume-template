# Account Governance (E8 — P1)

The catalog's only mechanism is Google Docs `/copy` links. **A single personal
Google account owning every template Doc is a catalog-wide single point of
failure** (account suspension / a sharing-policy change kills every template at
once). Same severity class as a dead link (E1). This runbook removes that SPOF.

## Rules

1. **Org-owned Shared Drive, not a personal account.** Create the templates in a
   Google Workspace **Shared Drive** owned by the org, not "My Drive" of one
   person. Membership survives any single person leaving.
2. **2FA enforced** on every account with Manager/Content-Manager access.
3. **Sharing setting per Doc:** "Anyone with the link → Viewer". Never Editor.
   The `/copy` link works for any logged-in Google user from a Viewer share.
4. **Service account = Viewer only.** The screenshot pipeline (E6) and the
   link-health monitor (E1) authenticate as a dedicated service account added to
   the Shared Drive as **Viewer**. Its key is `GOOGLE_SA_KEY` (secret, scripts
   only — never in the page build). Read-only scope `drive.readonly`.
5. **Recovery contact** documented here: <fill in 2 named admins>. If the
   primary admin is unavailable, the second can restore ACLs.

## SPOF mitigations wired into code

- The **link-health cron** (E1, `scripts/check-links.ts`) audits each Doc's ACL
  (`permissions.list` → anyone-reader present) on every run, so a silent
  permission drift is caught within 6h and the CTA degrades, not 404s.
- Every template SHOULD carry a `wordUrl` (DOCX fallback) so a dead Doc degrades
  to a download instead of a broken Google page (D2).
- Local `.docx`/exported-PDF backups of every template are kept in the repo's
  `backups/` (git-LFS or object storage), so a template can be re-published to a
  new Doc without re-authoring.

## Checklist before launch

- [ ] Shared Drive created, org-owned, 2 admins named above.
- [ ] 2FA enforced on all admin accounts.
- [ ] Service account created, added as Viewer, `GOOGLE_SA_KEY` stored as a CI secret.
- [ ] Every published Doc: "Anyone with link → Viewer".
- [ ] Local backup of every template Doc committed/archived.
