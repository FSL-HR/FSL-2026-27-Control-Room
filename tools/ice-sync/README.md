# FSL Ice Sync

Reads the master **ICE ALLOCATION BIBLE** (a live Excel sheet in the Silent Ice SharePoint
document library) and writes `ice-allocation.json` at the repo root. The Control Room app reads
that file so the Ice Allocation tab and weekend views reflect the ice you hold — no manual upload.

## What it does
- Parses every ice slot from the Bible: `Date · City · Arena · Ice Surface · Start · End`.
- Handles the Bible's mixed data: real Excel dates **and** `M/D/YYYY` text; real times **and** `TBD`.
- Maps each `City / Arena` to the app's canonical venue name (`City — Arena`).
- Buckets each slot into its FSL weekend (Fri/Sat/Sun) and records the start times.
- Diffs against the previous run to flag **newly-synced** ice (`newThisSync`).
- **Silently drops** ice outside the FSL season (the Alpine Cup Dec 17–20 and anything after
  Feb 21) — only a count is kept (`outOfSeasonSkipped`). Genuinely unparseable rows are surfaced
  in `badRows` as a safety net.

## Run it
```bash
cd tools/ice-sync
npm install                     # one time — installs the xlsx reader
node sync-ice.js "<path to ICE ALLOCATION BIBLE.xlsx>" "../../ice-allocation.json" "<ISO timestamp>"
```
The Bible path (SharePoint-synced) is:
`C:\Users\hrunnalls\Silent Ice Inc. - Female Super League\Silent Ice Inc. - Female Super League - Documents\1. 2026-27 Season\Ice Scheduling\ICE ALLOCATION BIBLE.xlsx`

The timestamp is passed in (not read from the clock) so scheduled and manual runs are reproducible.

## Automation (Phase 3)
- `sync-and-push.ps1` — wrapper that runs the sync and **commits + pushes only when the ice
  content actually changed** (it reads the `CONTENT_CHANGED=yes/no` line the sync prints). Logs to
  `sync.log`. Safe to run repeatedly.
- `setup-automation.ps1` — one-time setup (no admin needed): registers the **"FSL Ice Sync"**
  scheduled task at **12:00 PM & 8:00 PM daily** and creates a **"Sync Ice Now"** desktop shortcut.
  Run it once: `powershell -ExecutionPolicy Bypass -File setup-automation.ps1`. Removal commands are
  printed at the end.

Both are local (they read your SharePoint-synced Bible and push with your `gh` login), so the
scheduled runs only fire when your PC is on. The push currently targets the checked-out branch;
once this work merges to `main`, GitHub Pages redeploys and your live Ice Allocation updates
automatically.

## Notes / assumptions
- Both `SISE HATCH CO` and `SISE HESCO` map to `Edmonton — Silent Ice Center (Hatch+Hesco)`.
- All Morinville variants map to `Edmonton — Morinville Silent Ice Gardens`.
- "To source" is **not** computed here — the app already computes `games − ice held` per
  venue-weekend from this file. This tool only supplies the ice you hold.
