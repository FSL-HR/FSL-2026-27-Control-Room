# FSL 2026‑27 — Master Scheduling Rulebook

The complete set of scheduling rules for the FSL 2026‑27 season, as taught by the scheduler and reconstructed from the full working history. **✅ = enforced live by the app's rules engine** (`detectConflicts` in `index.html`); ⚙️ = judgment/workflow guidance the engine can't check. Last updated 2026‑07‑18.

---

## 1. Travel — flights & drives

| Rule | Detail | Engine |
|---|---|---|
| **Flight minimum** | A flight must be **≥4 games**. AAA: hard below 4. AA: 3 allowed only in extenuating cases (soft), hard below 3. **19U: ≥3** (all its minimums are "one less"). | ✅ `Flight <4 games` |
| **Long‑drive minimum** | A 3h+ / "Regional" drive must be **≥3 games** (**19U ≥2**). | ✅ `Long drive <3 games` |
| **Flight cap / team / season** | **≤3 flight‑trips**, except **Manitoba (Winnipeg) = 4**. Peace Country included. | ✅ `Too many flights` |
| **No local rivalry on a flight** | Two same‑home‑cluster teams may not play each other on a fly weekend (all divisions). If truly forced, flag it. | ✅ `Local rivalry on flight` |
| **No repeat‑region flight** | A team may not fly to the **same coarse region (AB / BC / SK‑MB) on two consecutive playing weekends** (≤8 days apart; a bye or the Christmas break resets it). | ✅ `Repeat-region flight` |
| **Reciprocal travel** | Don't visit a cluster 2+× while no one from it visits back (soft, season‑wide). | ✅ `Unbalanced travel` |
| **Overall balance** | Most teams should balance total travel, especially flights, across the season. | ⚙️ |

**Travel classification:** each trip is HOME / LOCAL / FERRY / REGIONAL / FLY. FLY & REGIONAL ≈ "over 3 hours." **Vancouver Island ↔ Lower Mainland is a FERRY, not a flight.** **Local rivalry = two teams sharing a home cluster.**

## 2. Neutral / halfway sites
- **Midway** (BC↔Calgary midpoint): **only Lower Mainland & Purcell (≤2 games each/weekend) and Calgary (≤4, or 3 for 19U)**. No other team. ✅ `Venue restriction`
- **Hardisty** (Saskatoon↔Calgary/Edmonton midpoint): **only Aberdeen (Saskatoon), Calgary and Edmonton** teams. ✅ `Venue restriction`
- Both are **nobody's flight** and not penalized drives.
- **Acceptable 2‑game trips:** Calgary↔Edmonton (local drive), Purcell↔Calgary (local drive), and Sask↔Calgary/Edmonton **only at a halfway town** (direct is a 3‑game‑minimum regional drive).

## 3. Per‑team travel caps & forbidden pairings
- **Cowichan trips: ≤2 per team per season** (Cowichan‑home & Lower Mainland teams exempt). ✅ `Cowichan trip cap`
- **Lower Mainland teams cannot play in Lloydminster** (no airport → bus from Edmonton). ✅ `Lower Mainland at Lloydminster`
- Soft flag: a flying team shouldn't be booked at Lloydminster. ✅ `Flying team @ Lloydminster`

## 4. Game‑count & spacing
| Rule | Detail | Engine |
|---|---|---|
| **Games per weekend** | ≤4 (**19U 3, except Langley Leafs 19U = 4**). | ✅ `Games/showcase` |
| **Games per day** | ≤2 (**19U 1, except Langley Leafs 19U = 2**). | ✅ `Max games/day` |
| **Rest gap** | Two same‑team games the same day ≥3h apart (excludes 19U). | ✅ `Rest gap` |
| **Matchup repeat** | Same pair ≤2× per weekend. | ✅ `Repeat matchup` |
| **Three straight weekends** | No team plays three consecutive calendar weekends (≤8‑day gaps; holiday break resets). | ✅ `Three straight weekends` |
| **One region per weekend** | A team plays in only one region (AB/BC/SK‑MB) per weekend. | ✅ `Two regions in a weekend` |

## 5. Season structure & balance
- **768 games total; 32 per team (19U = 24).** No team over/under its count. ⚙️ (matchup totals may be redesigned, but each team's total stays exact).
- **Pre/post‑Christmas balance:** aim ~**60–70% of each team's games before Christmas** (through Dec 11), rest after (Jan 02+). Balance before/after‑Christmas travel too. **Purcell is front‑loaded** (blacked out Dec 16–Jan 15). ⚙️
- **Season window:** no games Dec 17–20 (Alpine Cup) or after ~Feb 21. ⚙️
- **Slot length:** 16U & 19U games need 2.25h — don't seat them on a 2h slot; venue cutoff ~22:45. ✅ `Slot too short`
- **Home/away target:** roughly 12 home / 20 away out of 32. ⚙️

## 6. Blackouts & venue restrictions
- **Jan 02** — league‑wide. ✅
- **Nov 20 & Dec 11** — 16U AAA, 16U AA, 19U AAA. ✅
- **Purcell** — Nov 06, Jan 08, Jan 15 (and effectively unavailable Dec 16–Jan 15). ✅
- **Winnipeg ice** — available ONLY Sep 25 / Oct 09 / Nov 06 / Jan 08. ✅
- **WEM Ice Palace & Archie Miller** — 12U AAA only. ✅
- **Grande Prairie** — only specific allow‑listed AB clubs. ✅
- **Ice capacity** (games/day ≤ slots) and **Sheet clash** (concurrent ≤ sheets). ✅

## 7. Ice / sourcing
- **Bible is truth:** ice counts as *held* only if it's in the ICE ALLOCATION BIBLE (live SharePoint sheet). Everything else is **to‑source**. ⚙️
- **To‑source placements:** when you don't hold the ice, don't pick an arena — use a **`[Region] — To Source`** placeholder (region + weekend) so it lands on the need‑to‑source list. ⚙️
- **Prefer held ice**, but it's fine to source (e.g., a post‑Christmas slot) when it helps balance/travel. ⚙️
- **Kimberley:** bunch **≥2 games/weekend** (never a lone Kimberley/Purcell game); small rivalry ice is sourceable there, but **no big showcase ice**. ⚙️

## 8. Exemption teams
- **Purcell:** **buses everywhere (never flies)**; exempt from flight‑min, drive‑min, rivalry‑on‑flight, repeat‑region and reciprocal. ✅
- **Peace Country:** subject to everything (flight cap, flight/drive minimums, rivalry‑on‑flight, repeat‑region) **except reciprocal travel**, which stays waived. ✅
- Reciprocal is also waived on the **Lloydminster ↔ Edmonton** corridor. ✅

## 9. Local‑rivalry strategy ⚙️
Same‑cluster games are **flexible tools** — use them to fill held ice, close gaps, and nudge Christmas balance. Keep them **in region**, **never on a flight**, and don't send rivals out of region just to play each other. They don't need to be in a pod.

## 10. Weekend layout & broadcast ⚙️
- **2‑game travel weekends:** stagger visitors to cut hotel nights — Team A Fri PM + Sat AM (home after), Team B Sat PM + Sun AM.
- **Furthest teams** already at a neutral/host site should also play each other (extra value from the trip).
- **Aberdeen & Cowichan** weekends: times are fully flexible when the ice is **held**; constrained when it's a **must‑source** weekend.
- **Broadcast rates:** 19U AAA 100% · 16U AAA ~90% · 16U AA ~80% · 14U AA/AAA 50%+ · 12U AAA 0%. When otherwise equal, co‑locate broadcast games on the same rink (last‑priority tiebreaker).

## 11. Standing placement checks ⚙️
For every placement, don't stop at "no new hard conflict" — also judge: **(1) divisional/team layout, (2) pre‑vs‑post‑Christmas balance, (3) reciprocal travel.**

## 12. Team‑specific directives ⚙️
- **Victoria (16U AA)** hosts its rivalry **vs Langley Leafs‑AA at home (Cowichan), ≤2/weekend**. ✅ `Venue restriction`
- **Langley Leafs (19U):** 3 flight‑trips **+ 1 Midway trip**.
- **Peace Country** hosts **Jr. Ooks, Bow Valley Nationals, Calgary Glaciers (14U AAA)** on **Jan 29**.
- **Sask Phantoms (19U):** vary opponents / rebalance the league matrix (too many repeats).

## 13. Working constraints ⚙️
- The **live schedule is a Firebase/Firestore document** — edit it through the app (Save → edit → Load), never by patching baked‑in `DATA`.
- Optimization/redesign is validated in an **isolated test build** (Firebase off) before anything touches live.

---
*This document, the app's rules engine, and the assistant's persistent memory are kept in sync. If a rule changes, update all three.*
