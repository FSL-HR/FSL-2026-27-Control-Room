# New Scheduling Rules — Capture + Season Audit

**Date:** 2026-07-17
**Branch:** `test-schedule`
**Scope:** Analysis only — **no games moved, no code changed.** Records two new rules you
gave and audits the current season against them.

---

## Rule 1 — Minimum 3 games on long trips (12U–16U)

**Your rule:** for divisions **12U, 14U, 16U**, if a team travels **over 3 hours** to play,
it must get **at least 3 games** on that trip. Applies **all season**.

**Exceptions (do not apply the rule to these):**
1. Trips between **Vancouver Island and the Lower Mainland** (the ferry route — in the data
   this is the Cowichan ↔ Lower Mainland connection).
2. **Peace Country** (Peace Country Northstars) travelling anywhere.
3. **Purcell** teams (Purcell Collegiate and its Gold/Green entries).

### How I mapped "over 3 hours" (needs your confirmation)
The app doesn't store travel in hours — it classifies each trip into buckets:
`HOME` (same city) · `LOCAL` (short drive) · `FERRY` (BC island sailing) ·
`REGIONAL` (longer drive) · `FLY` (flight).

**Assumption used:** over 3 hours = **FLY** or **REGIONAL**; under 3 hours = HOME / LOCAL / FERRY.

⚠️ A couple of the app's own classifications look off and deserve your eye (e.g. Calgary →
Hardisty and → Evansburg are tagged as long trips but may really be drives). The buckets come
from the app's travel logic, not from me.

### Audit result (exceptions applied)
- **143** qualifying long trips (>3h) by 12U–16U teams this season, after removing **5** trips
  covered by the exceptions above.
- **13** of them break the rule (fewer than 3 games on the trip). The exceptions removed **none**
  of the 13 — every violation involves a non-exempt team on a non-exempt route:

| Div | Team | Weekend | Destination | Travel | Games (need ≥3) |
|-----|------|---------|-------------|--------|:---:|
| 14U AAA | Jr. Rustlers | Oct 02 | Evansburg | Regional | 2 |
| 14U AAA | Langley Leafs | Oct 16 | Lloydminster | Fly | 2 |
| 14U AAA | Langley Leafs | Oct 30 | Calgary-area | Fly | 2 |
| 14U AAA | Vancouver Aeros | Oct 16 | Lloydminster | Fly | 2 |
| 14U AAA | Vancouver Aeros | Oct 30 | Calgary-area | Fly | 2 |
| 16U AA | Calgary Phoenix | Feb 05 | Cowichan | Fly | 2 |
| 16U AAA | Bow Valley Nationals | Sep 25 | Lower Mainland | Fly | 2 |
| 16U AAA | Calgary Glaciers | Sep 25 | Lower Mainland | Fly | **1** |
| 16U AAA | Calgary Glaciers | Dec 11 | Hardisty | Fly | 2 |
| 16U AAA | Jr. Ooks | Nov 27 | Hardisty | Fly | 2 |
| 16U AAA | Jr. Rustlers | Nov 27 | Hardisty | Fly | 2 |
| 16U AAA | Sask Phantoms | Dec 11 | Hardisty | Fly | 2 |
| 16U AAA | Vancouver Aeros | Nov 27 | Midway | Fly | 2 |

Worst case: **Calgary Glaciers flying to Lower Mainland on Sep 25 for just 1 game.**

---

## Rule 2 — Lock all placed 19U games

**Your rule:** every currently-placed **19U AAA** game stays on the weekend it's on. Nothing
relocates 19U games.

**Recorded as a hard constraint.** All ~96 placed 19U AAA games are treated as fixed.

**Effect on earlier Oct 23 suggestions:** my verified three-straight table proposed moving
**Bow Valley Nationals (19U AAA)** Oct 30 → Oct 02. That suggestion is now **retracted** — it
would move a locked 19U game. Every other suggestion in the Oct 23 analysis was 12U–16U and is
unaffected.

---

## Decisions

- **Mode:** analysis / documents only. I do **not** change the schedule or the app's code —
  **you make the changes manually.** I audit, flag, and suggest; you decide and act.
- **Mapping:** over 3 hours = **FLY** or **REGIONAL**, with the three exceptions above.
- Still worth your eye: a couple of the app's travel tags look like drives, not long trips
  (Jr. Rustlers → Evansburg tagged Regional; the Calgary/Sask → Hardisty trips tagged Fly). If
  any of those are really under 3h for you, tell me and I'll drop them from the list.

## Your dispositions on the 13 violations (2026-07-17)

**✅ Accepted as-is (5)** — trip is fine at 2 games; treat as approved exceptions:
- Jr. Rustlers (14U AAA) — Oct 02 @ Evansburg
- Jr. Ooks (16U AAA) — Nov 27 @ Hardisty
- Jr. Rustlers (16U AAA) — Nov 27 @ Hardisty
- Sask Phantoms (16U AAA) — Dec 11 @ Hardisty
- Vancouver Aeros (16U AAA) — Nov 27 @ Midway *(halfway point between opponents)*

**❌ Not approved — must be resolved (6)** — current 2-game trip is not acceptable; needs a 3rd
game added or the trip cut. Decision on which is still open:
- Langley Leafs (14U AAA) — Oct 16 @ Lloydminster
- Langley Leafs (14U AAA) — Oct 30 @ Calgary
- Vancouver Aeros (14U AAA) — Oct 16 @ Lloydminster
- Vancouver Aeros (14U AAA) — Oct 30 @ Calgary
- Bow Valley Nationals (16U AAA) — Sep 25 @ Lower Mainland
- Calgary Glaciers (16U AAA) — Sep 25 @ Lower Mainland

**🔧 Pull Calgary 16U AA games off the Feb 05 Cowichan weekend** — remove these **6** games
(you asked for *all* Calgary 16U AA, incl. Glaciers‑AA which had 4 there and wasn't itself a
violation):
- `g322` Langley Leafs‑AA vs **Calgary Glaciers‑AA**
- `g684` Langley Leafs‑AA vs **Calgary Glaciers‑AA**
- `g686` Langley Leafs‑AA vs **Calgary Phoenix**
- `779` Victoria Hockey Academy vs **Calgary Glaciers‑AA**
- `780` Victoria Hockey Academy vs **Calgary Glaciers‑AA**
- `782` Victoria Hockey Academy vs **Calgary Phoenix**

Ripple to handle manually: Glaciers‑AA (−4) and Phoenix (−2) lose games toward their targets;
Cowichan hosts (Langley Leafs‑AA, Victoria HA) lose opponents. `g381` (Langley Leafs‑AA vs
Victoria HA) does **not** involve a Calgary team and stays.

**🔧 Glaciers → Hardisty (Dec 11) — add a game: blocked as-is.** Glaciers plays 2 games there,
both vs Sask Phantoms (the only other team at Hardisty that weekend). A 3rd game would be a
3rd Glaciers–Sask matchup, exceeding the max‑2‑matchups‑per‑weekend rule. To make it 3 games you
must **bring a third 16U AAA team to Hardisty on Dec 11**. Awaiting your call on which team.

## Proposed solution for the "not approved" trips (2026-07-17)

**Method:** every team is at exactly 32 games (mandatory count), so we don't *add* games — we
**move an existing same-matchup game into the trip**. The trip reaches 3 games, the team's total
stays 32, and no new long trip is created (respects the travel-count rules; Cowichan cap
untouched). Halfway/neutral 2-game trips (Midway, Hardisty) are already accepted per your rule,
so **Glaciers → Hardisty Dec 11 is resolved** — no action needed.

### ✅ Group A — Langley Leafs + Vancouver Aeros (14U AAA), clean
They travel together and don't yet play each other on these two trips, so one Langley-vs-Aeros
game per weekend gives **both** their 3rd game. They play each other 7× this season, so we pull
from a **home** weekend (Abbotsford — not a trip, so removing it creates no new violation):

- **Oct 16 @ Lloydminster:** move **g649** (Langley vs Aeros, currently Abbotsford Jan 22) here.
  → Langley & Aeros each 2→3. Jan 22 keeps its other Langley-Aeros game (g709). *Ice: Lloydminster
  wasn't in the venue-capacity list — likely sourced; needs one confirmed Lloydminster slot.*
- **Oct 30 @ Cochrane:** move **g138** (Langley vs Aeros, currently Abbotsford Jan 08) here.
  → both 2→3. *Ice: Cochrane is real ice with open Sat/Sun capacity — fits.*

### ⚠️ Group B — Bow Valley + Glaciers → Lower Mainland (16U AAA, Sep 25, Abbotsford)
Bow Valley needs +1 (2→3); Glaciers needs +2 (1→3). Abbotsford is real ice with room. The tricky
part is *where to pull the games from* without creating a new violation:
- **Glaciers' extra game:** move **g37** (Glaciers vs Vancouver Aeros, currently Calgary Jan 08)
  → Abbotsford Sep 25. Vancouver is already a Sep 25 Abbotsford host, so no new trip. *Check
  needed: confirm Vancouver still has ≥3 at Calgary Jan 08 after this (or pick g38's weekend
  differently).*
- **Bow Valley's + Glaciers' shared game:** their only mutual games are Kimberley Feb 05 (g731,
  g732) — but Kimberley is itself a trip, so pulling one risks a new Feb 05 violation. **This one
  needs a smarter source pick** (a Bow Valley or Glaciers game from a weekend with surplus). Flagged
  for me to finalize with engine verification.

### Verification status
- Group A: counts stay exact; sources are home games (no travel-min-3 impact); ice fits at Cochrane
  (Lloydminster slot to confirm). Solid.
- Group B: approach is sound but two source picks need an engine re-check so we don't create a new
  violation on the source weekend. **Not yet fully verified.**

## Rule 3 — Flights: 4 games, no local rivalries (added 2026-07-17)

**Your rule:** if a **flight** is involved, the team must play **at least 4 games** on that trip,
and **no local-rivalry matchups** may be played there.
**Caveat:** **16U AA** and **14U AA** are treated differently because each has an odd number of
teams (exact relaxation to be confirmed).

Notes / interpretation (pending your confirmation):
- "Flight" = a genuine long-haul air trip (BC coast/island ↔ prairies, etc.), **not** the app's
  imperfect `FLY` tag. Halfway/neutral drive-to-midpoint venues you've already accepted —
  **Hardisty, Midway** — are not treated as flights.
- "Local rivalry" assumed = two teams from the **same home cluster** (e.g. two Lower Mainland
  teams, or two Calgary-area teams). Confirm if you mean same region instead.

### Impact — supersedes the Group A / Group B solution above
The relocate-in fixes proposed earlier are now **invalid**:
- Group A used **Langley Leafs vs Vancouver Aeros** (both Lower Mainland) — a local rivalry on a
  flight. Not allowed.
- Group B used **Bow Valley vs Glaciers** (both Calgary-area) — local rivalry on a flight. Not
  allowed.
- All 6 "not approved" trips are flights, so each now needs **4 games**, built only from
  **non-local** opponents present that weekend (respecting the max-2-per-matchup cap).

The current games on those trips are already non-local (e.g. Langley plays Cowichan + Jr.
Rustlers at Lloydminster), so they stay — the work is getting each from 2 → 4 games using
non-local opponents, then re-verifying counts/ice/other rules. **To be re-solved after the two
clarifications below.**

### Clarifications received
- **Local rivalry = same home cluster** (e.g. two Lower Mainland teams; two Calgary-area teams).
- **16U AA / 14U AA:** the **4-game minimum is relaxed** (odd team counts). The **no-local-rivalry**
  rule still applies to them.

### Rule 3 season audit
99 flight trips in scope (12U–16U, excluding Peace Country, Purcell, and the neutral drive points
Hardisty/Midway). Two problem categories:

**A) Flights under 4 games — 9 (AAA only):**
- 14U AAA — Langley Leafs @ Lloydminster (Oct 16): 2 · @ Calgary (Oct 30): 2
- 14U AAA — Vancouver Aeros @ Lloydminster (Oct 16): 2 · @ Calgary (Oct 30): 2
- 16U AAA — Bow Valley Nationals @ Lower Mainland (Sep 25): 2
- 16U AAA — Calgary Glaciers @ Lower Mainland (Sep 25): 1
- 16U AAA — Langley Leafs @ Calgary (Oct 02): 3 *(new)*
- 16U AAA — Vancouver Aeros @ Calgary (Oct 02): 3 *(new)*
- 16U AAA — Tri City Express @ Calgary (Oct 02): 2 *(new)*

**B) Local-rivalry matchups on a flight — 6 unique (all divisions):**
- 12U AAA — Bow Valley vs Calgary Glaciers @ Cowichan (Nov 06)
- 14U AAA — Bow Valley vs Calgary Glaciers @ Cowichan (Feb 19)
- 16U AAA — Langley Leafs vs Vancouver Aeros @ Edmonton (Oct 16)
- 14U AA — Langley Leafs‑AA vs Vancouver Aeros‑AA @ Aberdeen (Oct 02)
- 14U AA — Langley Leafs‑AA vs Vancouver Aeros‑AA @ Winnipeg (Jan 08)
- 14U AA — Bow Valley‑AA vs Calgary Glaciers‑AA @ Winnipeg (Oct 09)

**= 15 distinct issues to resolve.** Fixing "under 4 games" means adding non-local opponents
(matchup cap ≤2) via game relocation to keep counts exact; fixing "local rivalry" means swapping
that matchup for a non-local one at the same venue/weekend. Awaiting your direction on how to
proceed (disposition each, or have me attempt a full re-solve).

## Solve: the 9 under-4 flights → build each to 4 games (non-local opponents only)

Per your direction, this covers only the under-4 flights (the 6 local-rivalry matchups are left
for your separate review). Method as before: **relocate a same-matchup game in** from another
weekend (teams are capped at 32), so totals stay exact. Every added matchup below is **non-local**
(different home cluster), satisfying the no-rivalry half of Rule 3. All need an ice slot at the
destination venue.

### ✅ Cleaner trips (plenty of non-local opponents)
**Calgary Oct 02 (16U AAA)** — real ice available:
- Langley Leafs (3→4): + vs Calgary Glaciers
- Vancouver Aeros (3→4): + vs Bow Valley Nationals
- Tri City Express (2→4): + vs Calgary Glaciers, + vs Bow Valley Nationals

**Calgary/Cochrane Oct 30 (14U AAA)** — Cochrane real ice, capacity open:
- Langley Leafs (2→4): + vs Bow Valley Nationals, + vs Calgary Glaciers
- Vancouver Aeros (2→4): + vs Bow Valley Nationals, + vs Calgary Glaciers

**Abbotsford Sep 25 (16U AAA)** — real ice, room available:
- Bow Valley Nationals (2→4): + vs Langley Leafs, + vs Vancouver Aeros
- Calgary Glaciers (1→4): + vs Langley Leafs, + vs Vancouver Aeros, + vs Tri City Express
  *(Glaciers needs +3 — the heaviest single fix)*

### ⚠️ Tight trip — Lloydminster Oct 16 (14U AAA)
Only **two** non-local teams are there (Jr. Rustlers, Cowichan Valley Ravens), so bringing both
Langley and Aeros to 4 games maxes those opponents out:
- Langley Leafs (2→4): + vs Jr. Rustlers, + vs Cowichan Valley Ravens
- Vancouver Aeros (2→4): + vs Jr. Rustlers, + vs Cowichan Valley Ravens
This pushes Jr. Rustlers and Cowichan to 4 games each entirely against the two BC teams, and needs
**4 new Lloydminster ice slots** (Lloydminster wasn't in the venue-capacity list — likely sourced).
Worth considering whether this trip should instead **merge with another weekend** rather than pad.

### Reality check
- ~**17 added matchups** total → ~17 relocations needed to keep every team's count at exactly 32.
- Each relocation's **source weekend** must be re-checked so it doesn't drop below 4 on another
  flight or break three-straight/region rules.
- Ice must exist at each destination (confirmed at Cochrane/Abbotsford/Calgary; **Lloydminster
  needs sourcing**).
- This is effectively a partial re-plan of these gathering weekends. Recommend finalizing with
  engine verification (simulate all moves, re-run the full audit) before you action it.

## Not done
- No games moved. No engine code changed. This branch holds analysis documents only.
  You are making all schedule changes manually. Group A/B fixes above are superseded by Rule 3.
