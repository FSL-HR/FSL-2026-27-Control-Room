# Rule re‑audit + fix plan — 2026‑07‑18 (v2, after your feedback)

You were right: my first pass didn't enforce all your rules. I'd lost several during an earlier context reset. So I rebuilt the **complete** ruleset from scratch (combed all 87 of your messages in the session transcript, every saved memory, and the engine code with a 10‑agent audit), confirmed the gaps with you, and **encoded the missing hard rules into the engine.** This document is the honest state and the fix plan.

## 1. What I fixed in the engine (now live)

The app's rules engine (`detectConflicts`) now enforces two rules it was missing — so from now on the app *catches* them for you automatically (and the Suggest button respects them too):

- **Rule A — Lower Mainland ≠ Lloydminster (hard).** A Lower Mainland team booked at a Lloydminster venue is flagged. (You confirmed: Lower Mainland specifically, not all fly‑in teams.)
- **Rule B — no repeat‑region flight (hard).** A team may not fly to the same coarse region (AB / SK‑MB / BC) on two consecutive playing weekends; a bye weekend or the Christmas break resets it. Peace Country & Purcell exempt.

Already correctly in the engine (I'd just failed to *act* on them): the **4‑games‑per‑weekend cap (3 for 19U)** = `Games/showcase`, and **2‑games‑per‑day (1 for 19U)** = `Max games/day`. So "a team playing 5" was always being flagged — my job was to relocate, which is below.

## 2. The true picture under the complete ruleset

With the 2 pods placed and the full ruleset on: **0 parked, 78 open (unacknowledged) hard conflicts.** Breakdown:

| Rule | # | Movable by me? |
|---|---:|---|
| Games/showcase (5+ in a weekend) | 15 | **9 are locked 19U** · 3 are a 12U data anomaly · 3 movable |
| Local rivalry on flight | 12 | needs matchup swaps + ice |
| Ice capacity | 7 | needs sourcing decisions |
| Flight < 4 games | 6 | needs added‑to‑trip games (your ice) |
| Three straight weekends | 15 | timing moves (not one of your stated rules) |
| Rest gap | 5 | timing (needs assigned times) |
| **Lower Mainland @ Lloydminster** | 4 | **your Oct 16 gathering — see below** |
| Long drive < 3 | 3 | needs added‑to‑trip games |
| Blackout | 3 | mostly 19U‑placed |
| Max games/day | 3 | timing |
| **Repeat‑region flight** | 2 | timing moves |
| Two regions in a weekend | 1 | one move |

## 3. Why I did NOT auto‑rewrite these

Every fix must **relocate** an existing game (your season is locked at exactly 768 games / fixed per‑team counts — you can't net‑add), must **not touch 19U weekends/regions**, and must not create a new violation. Under those constraints most of the 78 are **structural** — they need an ice‑sourcing or matchup decision that's yours, or they sit inside locked 19U. Auto‑guessing them is exactly what produced the errors you caught. So here is the precise plan instead.

## 4. Your three flagged categories — specifics + recommended fix

### A. Teams playing 5 in a weekend (`Games/showcase`)
- **9 are 19U AAA and LOCKED** (Purcell Gold ×3, Purcell Green ×2, Jr. Ooks ×2, Langley, Aurora). The cap is 3 for 19U and these sit at 4–5. **Only you can move 19U** — flag: these need a 19U weekend change, which you told me not to make.
- **⚠️ Data anomaly — 12U AAA, Jan 15:** Jr. Ooks, Calgary Glaciers, and Bow Valley each show **8 games that weekend.** That's physically impossible (max 2/day × 3 days = 6). This looks like a data/import error on Jan 15, not a normal over‑book — worth checking the source before anything else.
- **3 genuinely movable:** Langley Leafs‑AA (14U AA, Oct 02 = 5) · Manitoba Mavericks (14U AA, Oct 02 = 5) · Sask Phantoms‑AA (16U AA, Nov 13 = 5). Fix: move one game each to an adjacent held‑ice weekend where that team is under 4. I can do these three cleanly on your say‑so.

### B. Lower Mainland at Lloydminster (Rule A)
One 14U AAA gathering, **Lloydminster — Servus, Oct 16**, four games: `g643` Aeros v Jr. Rustlers · `g644` Langley v Jr. Rustlers · `g645` Cowichan Ravens v Aeros · `g699` Cowichan Ravens v Langley. Aeros & Langley are Lower Mainland → can't be at Lloyd. This whole gathering needs re‑planning: Jr. Rustlers (the Lloyd host) would have to travel to BC to keep those matchups, or they move to a neutral site — a **travel‑budget decision**, not a one‑game nudge. Recommend we solve this one together.

### C. Repeat‑region flight (Rule B)
- Cowichan Valley Ravens (14U AAA) flies to **AB on Oct 16 and again Oct 23**.
- Langley Leafs (16U AAA) flies to **AB on Oct 09 and again Oct 16**.
Fix: move one of the two weekends' games to break the back‑to‑back (or to a non‑AB destination). Both are clean timing relocations once we pick the target weekend.

## 5. What IS done and verified

- **Both parked pods placed, 0 parked**, and verified to trip **none** of the travel rules (incl. the two new ones): 16U AA → `Calgary — To Source`/Feb 05; 16U AAA → `Lower Mainland — To Source`/Dec 04.
- Engine enforces the complete ruleset; the isolated test site reflects it.

**Preview (isolated, live schedule untouched):** https://fsl-hr.github.io/FSL-2026-27-Control-Room/test/
**Load‑ready file (pods only):** `Downloads\FSL_schedule_2026-07-18_OPTIMIZED.json`

## 6. Suggested order of attack (when you're ready)

1. **Check the Jan 15 12U AAA data** (the 8‑games anomaly) — likely fixes 3 violations at once and may be an import bug.
2. **The 9 locked‑19U showcases** — your call on which weekend to shift each; tell me and I'll verify.
3. **The Oct 16 Lloydminster gathering** — decide travel budget (Rustlers→BC, or neutral site), then I relocate.
4. The 3 movable 5‑game weekends + the 2 repeat‑region flights — I can do these cleanly now on your OK.
5. Then the flight<4 / long‑drive / local‑rivalry‑on‑flight items, each of which needs a game relocated into the trip (your ice).

I've deliberately left the structural calls to you rather than guess — but point me at any item and I'll do the verified relocation.

---

## 7. Update — 19U rules encoded (later 2026‑07‑18)

You unlocked 19U and gave its rules. Now in the engine (live):
- **Langley Leafs (19U) play four‑game weekends** — showcase cap 4 and 2 games/day for Leafs; **all other 19U teams stay at 3/weekend, 1/day.** This cleared the Leafs Dec 04 "5‑game" flag automatically.
- **19U travel = other divisions minus 1 game:** flight ≥ **3** (not 4), long drive ≥ **2** (not 3); rivalry‑on‑flight / reciprocal / Lloyd / repeat‑region all apply to 19U too. Verified: **no new 19U travel violations** — current 19U flights/drives already meet the relaxed minimums.

## 8. Update — both flagged issues fixed (you said "fix both")

With a smarter relocation pass (objective = conflicts + games‑over‑cap, with a hard guard against creating any new flight/drive/Lloyd/repeat‑region violation), **both are done — 15 verified relocations, no bad trades:**

- **Jan 15 12U anomaly:** the misplaced 8‑game Edmonton‑Morinville block (g613–g620) moved to **Nov 27, Edmonton — To Source.** Jr. Ooks / Glaciers / Bow Valley now each play **4** on Jan 15 (were 8), and Jr. Ooks's two‑region clash is gone.
- **All 8 non‑Leafs 19U over‑caps fixed:** Purcell Gold's 5‑game Jan 22 → 3; the rest brought to 3. Where a Purcell game was the over‑cap, it moved to the **opponent's home Edmonton rink** so Purcell travels under its exemption and **nobody flies** (an early attempt that dumped them to generic "BC — To Source" created a Jr. Ooks 2‑game BC flight — caught and undone).
- **Your three acceptable‑2‑game‑trip rules** (Calgary↔Edmonton, Purcell↔Calgary, Sask↔Calgary/Edmonton at a halfway town) are **already honored by the engine** (LOCAL drives / Purcell exemption / Hardisty‑Midway neutral) — no change needed.

**Result:** open hard **76 → 64**, 0 parked, Flight<4 unchanged at 6. New to‑source blocks created: Edmonton (Nov 27), BC (Sep 11). Load‑ready file: `Downloads\FSL_schedule_2026-07-18_FIXED.json`.

Still open (not part of "both," need your calls): 3 non‑19U 5‑game weekends (Langley‑AA/Manitoba Oct 02, Sask Phantoms‑AA Nov 13), the Oct 16 Lloydminster gathering, 12 rivalry‑on‑flight, 6 flight<4.
