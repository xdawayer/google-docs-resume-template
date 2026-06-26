# Measurement & success metrics (T6)

## Honest measurement model (Decision #7 — do not overclaim)

Three signals measure three different things. **None measures a successful copy**
— the "Make a copy" happens entirely on `docs.google.com` and is unmeasurable.

| Signal                   | Source                   | Proves                                   | Does NOT prove                             |
| ------------------------ | ------------------------ | ---------------------------------------- | ------------------------------------------ |
| `copy_google_docs_click` | client `sendBeacon` (E9) | intent (a click)                         | that the link worked or the copy succeeded |
| `copy_dispatch_server`   | `/go` edge function (E2) | the redirect was served + to what target | the copy succeeded                         |
| link health `available`  | `check-links` cron (E1)  | the Doc exists + is shared right         | the user actually copied it                |

So the closest proxy for "served a good copy" is **E1 health**, not the click beacon.
Pair them: a healthy CTR with a low `served-good rate` means links are dying faster
than the dashboard implies.

## Composite KPIs

- **served-good rate** = published templates with `linkStatus: available` / all published (from E1).
- **dead-click rate** = `copy_google_docs_click` against slugs whose health is `unavailable` / all clicks.
- **beacon-delivery ratio** = sanity check that beacons arrive (sampled).

## Reset targets (replaces the PRD's fantasy numbers)

The PRD's "head term top 20 + 2,000 clicks/month by day 90" is not realistic for a
zero-authority domain (dual-voice Ahrefs read: ~800–2,500 organic/mo at **12 months**).

| Horizon  | Target                                                                             |
| -------- | ---------------------------------------------------------------------------------- |
| Day 30   | indexed (hub + the first detail pages), no technical errors, first GSC impressions |
| Day 90   | a few KD 2–3 long-tails in top 20; first copy clicks; first backlinks              |
| Month 6  | role/category long-tails ranking; measurable organic clicks                        |
| Month 12 | head term top 10–20 IF links compounded; ~800–2,500 organic/mo realistic           |

`scripts/gsc-monitor.ts` (weekly) writes `reports/gsc-indexation.json` and fails if
crawled-not-indexed > 20% — the cold-start signal to deepen content before scaling.
