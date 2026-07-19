# Time Entire Season — design

*2026-07-18 · approved approach: one global engine reusing the existing solvers (Approach 1)*

## Goal

One button that times every game in the season the way "⚙ Time this pod" and
"⏱ Hypothetical times" do today, pod by pod — and turns everything that can't
fit on held ice into a precise sourcing ask (day + slot length + time of day),
surfaced through the redesigned "Ice to source" export.

## 1. The button

- New sidebar button (below **Import times**): **"⏱ Time entire season"**,
  subtitle "Real slots + 1-rink hypo". Always visible.
- Confirm dialog before running: re-times every unlocked game; locked
  weekends, locked venues and manually-locked times are untouched.
- The whole run is **one undo step** (`pushUndo` once before the loop).

## 2. Engine — every weekend × venue pod

Skips: locked weekends (`isLocked`), locked venues (`isVenueLocked`),
manually-locked game times (`isTimeLocked`), parked games (`venue===''`).

- **Sourced pods** (`realSlotListFor` returns slots): existing
  `solveOneVenue` placement into the real slots. Unchanged behavior.
- **Unsourced pods** (`isUnsourcedPod`): existing `hypoTimePod` —
  **always one rink**. The `MAX_RINKS=2` fallback is removed from
  `hypoTimePod` itself (league-wide rule: never assume more than one sheet),
  so the single-pod "⏱ Hypothetical times" button obeys it too.
- Per-weekend `SOLVE_REPORT` entries are written as today so each weekend
  page shows its normal auto-solve report card afterward.

## 3. Overflow → day + window (the sourcing ask)

Games that don't fit (no free real slot on a sourced pod, or beyond one
hypothetical sheet on an unsourced pod):

- **Stay on their weekend + venue.** Never moved, never parked.
- Get a **day** — preference Sat → Sun → Fri — where both teams still fit
  under the rules: ≤2 games/team/day (19U: 1), 165-min rest against their
  already-timed games that day, Sunday out before 3 PM.
- Get a **window**: `Morning` (start 8:00–11:59) / `Afternoon` (12:00–16:59)
  / `Evening` (17:00+) / `Any`, computed from when both teams are actually
  free that day. Whole day free → `Any`. Sunday only offers Morning or Any.
- Day is written as the game's real `day`; time stays blank so the pod card
  and exports show e.g. **"Sat · TBD (evening)"**.
- Window tags live in a new persisted map `TBD_NEEDS`
  (`localStorage: fsl_tbd_needs_v1`), keyed by game id → `{day, win}`.
- A tag auto-clears when the game gets a real time, is moved (venue,
  weekend, park), or its matchup is swapped — same lifecycle points where
  hypothetical times are already dropped.
- The single-pod "⏱ Hypothetical times" button gives its own one-sheet
  overflow the same day+window treatment (consistency).

## 4. Results → redesigned "Ice to source" export

The existing export kind `sourced` ("🔴 Ice to source") changes from a flat
row list to a **matrix on one sheet**:

- **Columns:** `Weekend`, `Date`, then one column per **location cluster**.
- **Rows:** one per weekend that needs ice.
- **Cell:** the ask for that location that weekend, per day —
  `count × length × window`, e.g.
  `Sat: 2×2h evening` / `Sun: 1×1.5h morning` (multi-line).
  If two cities in one cluster need ice the same weekend, the cell breaks
  out by city: `Calgary — Sat: 2×2h eve · Banff — Sun: 1×1h AM`.

**Sources of the numbers:**
- Fully unsourced pods → every game's hypothetical slot is an ask
  (hypo time → window; division → length via `CFG.slotHours`).
- Over-capacity sourced pods → only the overflow games, via their
  `TBD_NEEDS` day+window.
- Games not yet run through the engine → fallback: bare slot count for that
  venue-weekend (today's `sourcedFor` math), no day/window.

**Location cluster → cities map** (new constant; unknown cities become their
own column automatically):

| Column | Cities |
|---|---|
| Lower Mainland | Abbotsford, Delta, Langley, Vancouver, Surrey |
| Calgary area | Calgary, Banff, Canmore, Cochrane |
| Lloydminster | Lloydminster, Lashburn |
| Edmonton area | Edmonton, Morinville |
| Evansburg | Evansburg |
| Aberdeen | Aberdeen |
| Cowichan | Cowichan |
| Winnipeg | Winnipeg |
| Kimberley | Kimberley |
| Grand Prairie | Grand Prairie |
| Hardisty (neutral) | Hardisty |
| Midway (neutral) | Midway |

Evansburg and every neutral site stand alone.

## 5. Invariants

- No game changes venue or weekend. No new venues are invented.
- Real ice always overrides hypothetical on every view/export, as today.
- Season stays exactly 768 games; this feature only assigns days/times/tags.

## Out of scope

- Cross-weekend re-optimization (games stay where they are).
- Auto-sourcing ice or editing the ICE ALLOCATION BIBLE.
- Changes to the "Unused ice" export or the in-app "Ice to Find" page.
