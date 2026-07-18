# Overnight schedule optimization — 2026‑07‑18

**Scope you gave me:** build the most optimal schedule I can *on the test site only*, place all parked games per all rules, use held ice as well as possible, **don't touch 19U** (game‑slot/time changes OK, but keep 19U on the same weekend + region). Run the checks, take my time.

---

## TL;DR

- **Both parked pods placed** → the schedule is now **0 parked / 768‑768 placed**, every team on its exact mandatory count.
- The schedule got **measurably cleaner**, not messier: open **hard** conflicts **75 → 72**, total **237 → 229**.
- Everything was built and verified in a **fully isolated test copy** — Firebase turned off, embedded schedule, **your live schedule was never touched.**
- Preview it here (live ~1 min after this was written): **https://fsl-hr.github.io/FSL-2026-27-Control-Room/test/**
- The rest of the open conflicts are **structural** (they need your ice‑sourcing / matchup calls, and some would force 19U changes). I did **not** guess at those — they're listed below as a precise, prioritized worklist.

---

## What "isolated test site" means (safety)

Your live schedule lives in a shared Firestore doc (`schedules/fsl-shared`) that **both branches sync to** — there is no data‑isolated test environment in the app. So I built one: `/test/index.html` is a self‑contained copy with **Firebase disabled** (no listen, no push — verified `window.__cloud` is undefined) and the optimized schedule **embedded in the page**. It reads/writes nothing in the cloud. Your live site and the shared doc are byte‑for‑byte untouched.

---

## The two placements

### 1. 16U AA — 7‑game pod → **Calgary — To Source, Feb 05**
Teams: Langley‑AA + Victoria (BC) vs Glaciers‑AA + **Phoenix** (Calgary). Phoenix plays only **2** games, so anywhere Phoenix flies it breaks the 4‑game flight rule → the pod must sit in **Alberta**, where the BC teams fly in for their 4 (valid) and both Calgary teams are home. You chose **Calgary** (home weekend for two teams) over Edmonton (held ice but neutral). No held Calgary ice on Feb 05, so it's **region + weekend to‑source** (7 slots). Engine verdict: **clears every scheduling rule — 0 new conflicts.**

### 2. 16U AAA — 9‑game showcase → **Lower Mainland — To Source, Dec 04**
Teams: Glaciers + Bow Valley (Calgary) · Aeros (3g) · Langley (4g) · Tri City (2g) · Purcell (1g, exempt) — all BC except the two Calgary clubs.
- **Flight rule forces Lower Mainland:** the two Calgary teams fly in for exactly 4 (valid AAA flights); the low‑game‑count teams (Aeros/Tri City/Purcell) are BC‑home or exempt. Placing it in AB would put Aeros (3) and Tri City (2) into hard flight violations.
- **Ice reality:** pre‑Christmas Lower Mainland held ice exists only on Sep 18/25 (those teams are already booked elsewhere → showcase‑cap + two‑region conflicts) and Oct 02 (Delta is **already 11 games on 8 slots** — over capacity, incl. 19U I can't move). So there is **no usable held LM ice**; this pod must be sourced regardless.
- **Weekend choice:** among flight‑legal LM weekends, **Dec 04 adds only +1 conflict** vs **+7 on its old Oct 02 slot** (Oct 02 puts these teams on three straight weekends). Same ~9 slots sourced either way. So Dec 04 wins on rules, and moving the showcase **off** the congested Oct 02 is what dropped the schedule's total conflicts.
- Per your "no ice → don't pick an arena" rule, it's parked as **`Lower Mainland — To Source` / Dec 04** (source 9 slots). Both to‑source blocks appear on the Ice Allocation need‑to‑source list.

> If you'd rather keep this showcase on **Oct 02**, that's one drag in the app — but it re‑adds ~7 "three straight weekends" flags and still sources the ice. Dec 04 is the cleaner call.

---

## Before / after (verified in the sandbox with the live engine)

| Metric | Live now | Optimized test | Δ |
|---|---:|---:|---:|
| Games placed | 752 / 768 | **768 / 768** | +16 |
| Parked | 16 | **0** | −16 |
| Total conflicts | 237 | **229** | −8 |
| Open (unacknowledged) | 198 | **193** | −5 |
| Open **hard** | 75 | **72** | −3 |

---

## What I deliberately did NOT auto‑change (and why)

The remaining **72 open hard conflicts** are mostly either (a) engine‑spacing rules you never listed as priorities (e.g. "three straight weekends" ×15, "games/showcase" ×15 — inherent to a dense season + your 4‑per‑showcase caps), or (b) **structural violations of your real rules** that each need an added game, a sourced sheet, or a home/away swap — decisions that are yours to make and that often ripple into 19U (which you told me not to touch). Auto‑guessing them risks making the schedule *worse*. So here they are as a worklist instead.

### Worklist — violations of *your* rules (highest value)

**A. Local rivalry on a flight (6 matchups)** — rivals flying to play *each other*:
| Weekend | Division | Rivals | On a flight to |
|---|---|---|---|
| Oct 16 | 16U AAA | Aeros × Langley | Edmonton |
| Feb 19 | 14U AAA | Glaciers × Bow Valley | Cowichan |
| Oct 09 | 14U AA | Glaciers‑AA × Bow Valley‑AA | Winnipeg |
| Jan 08 | 14U AA | Aeros‑AA × Langley‑AA | Winnipeg |
| Oct 02 | 14U AA | Langley‑AA × Aeros‑AA | Aberdeen |
| Nov 06 | 12U AAA | Glaciers × Bow Valley | Cowichan |
*Fix pattern:* pull the rival‑vs‑rival game **off** the fly weekend and drop it in‑region on a held‑ice gap weekend (your local‑rivalry‑as‑filler strategy), and back‑fill the fly weekend with a **non‑rival** matchup so the traveling team still hits 4 games.

**B. Flight for < 4 games (3 situations):**
- Oct 30 — Langley **and** Aeros (14U AAA) fly to Calgary‑area for **2** each.
- Oct 16 — Aeros **and** Langley (14U AAA) fly to Lloydminster for **2** each.
- Sep 25 — Bow Valley (2) + Glaciers (1) (16U AAA) fly to Lower Mainland.
*Fix pattern:* bundle 2 more games into that destination/weekend, or move the trip to a weekend where they already play 4.

**C. Long drive (3h+) for < 3 games (3):**
- Nov 13 — Bow Valley + Glaciers (14U AAA) drive to Lloydminster for **2**.
- Oct 02 — Jr. Rustlers (14U AAA) drives to Evansburg for **2**.
*Fix pattern:* add a 3rd game at the destination, or relocate.

**D. Reciprocal travel (soft, season‑wide):** Edmonton clubs keep visiting Calgary‑area with no return trip —
- Angels (×8), Aurora (×8), Jr. Ooks (×6) all visit Calgary‑area but no Calgary‑area team visits Edmonton (16U AAA).
- Bow Valley (14U AAA) visits Edmonton ×4 with no return; Jr. Rustlers visits LM/Calgary ×4 each with no return to Lloydminster.
*Fix pattern:* flip a handful of home/away designations so Calgary‑area hosts some of those Edmonton visits back.

---

## How to promote this to the live schedule (only if you approve)

Nothing here has touched live. If you like it: in the **live** app, **Load schedule** →
`Downloads\FSL_schedule_2026-07-18_OPTIMIZED.json`. That applies both pod placements + the two to‑source blocks and syncs to the shared doc. (Or just re‑place the two pods by hand — they're the only schedule changes in this file.)

*Separately, the Suggest‑button rules upgrade shipped earlier today is already live app code — no Load needed for that.*
