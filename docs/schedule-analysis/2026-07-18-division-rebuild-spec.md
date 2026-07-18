# FSL division rebuild — spec for a dedicated session

**Goal:** rebuild the affected divisions' schedules from scratch so they satisfy the FULL ruleset (now all encoded in `detectConflicts`). This is a constraint‑satisfaction build; it must be done **whole‑division** (clear the slate + re‑place all games) — partial reassignment collides with games left in place and makes conflicts *worse* (proven 3×).

## Start state (known‑good)
- **Baseline schedule:** `Downloads\FSL_schedule_2026-07-18_FIXED.json` (768 games, 0 parked; parked pods placed, Jan 15 12U data bug fixed, all 19U over‑caps fixed). ~79 open hard conflicts under the full ruleset — those are the structural travel/matrix problems this rebuild targets.
- **Engine:** every rule is in `index.html` `detectConflicts(scope)`. Do NOT re‑derive rules — trust the engine as the objective function.
- **Isolated sandbox (never touches live):** `tools/test-sandbox/build_test.js <payload.json>` writes `repo/test/index.html` (Firebase OFF, payload embedded, exposes `window.__applyPayload`/`__buildPayload`). Serve with `tools/test-sandbox/serve.js` (localhost:8765/test/index.html) and drive via the browser JS tool: `detectConflicts()`, `games`, `clusterName`, `travelTypeFor`, `CLUSTER_REGION`, `perShow`, `DATA.teams`, `DATA.realIce`. **Live schedule is a Firestore doc — never written by any of this.**

## The complete ruleset (all engine‑encoded; rule names as emitted)
- **Flight cap** (`Too many flights`): distinct fly‑weekends ≤ **3 per team**, **Manitoba (Winnipeg) 4**. Peace Country included. Purcell buses (never flies).
- **Flight minimum** (`Flight <4 games`): a flight must be ≥4 games (AAA hard; AA soft at 3, hard <3; **19U ≥3**). Purcell exempt.
- **Long drive** (`Long drive <3 games`): 3h+/REGIONAL trip ≥3 games (**19U ≥2**). Purcell exempt; Island↔LM ferry & Hardisty/Midway neutrals excluded.
- **No local rivalry on a flight** (`Local rivalry on flight`); **no repeat‑region flight two weekends running** (`Repeat-region flight`, AB/BC/SK‑MB, ≤8‑day gap; break resets). Purcell exempt.
- **Reciprocal travel** (`Unbalanced travel`, soft): don't visit a cluster 2+× with no return. Waived: Purcell, **Peace Country**, Lloyd↔Edmonton; Hardisty/Midway don't count.
- **Games/weekend** (`Games/showcase`): ≤4 (**19U 3**, except **Langley Leafs 19U = 4**). **Games/day** (`Max games/day`): ≤2 (**19U 1**, Langley Leafs 19U 2). Rest gap 3h (not 19U).
- **Matchup repeat** (`Repeat matchup`, soft): ≤2 same pair/weekend.
- **One region/weekend** (`Two regions in a weekend`); **three straight weekends** hard (≤8‑day gaps; holiday resets).
- **Neutral sites** (`Venue restriction`): **Midway** = only Lower Mainland & Purcell (≤2 games) and Calgary (≤4, 3 for 19U). **Hardisty** = only Aberdeen(Saskatoon)/Calgary/Edmonton. Both are nobody's flight.
- **LM ≠ Lloydminster** (`Lower Mainland at Lloydminster`); **Victoria (16U AA)** hosts its rivalry vs **Langley‑AA** at home (Cowichan), ≤2/weekend (`Venue restriction`).
- **Blackouts** (`Blackout`): Jan 02 league‑wide; Nov 20 & Dec 11 for 16U AAA/AA & 19U AAA; Purcell Nov 06/Jan 08/Jan 15 (+ effectively Dec 16–Jan 15, front‑load Purcell); **Winnipeg ice only Sep 25/Oct 09/Nov 06/Jan 08**; WEM & Archie Miller 12U‑only; Grande Prairie allowlist.
- **Ice**: only ICE ALLOCATION BIBLE ice is "held"; else `Region — To Source` (region+weekend placeholder, on the sourcing list). Prefer held ice, but source when balance/travel needs it.
- **Balance**: ~60–70% of each team's games pre‑Christmas (through Dec 11), rest after; Purcell front‑loaded. Home/away target ~12/20 (24 games for 19U). Broadcast (19U 100%→12U 0%): co‑locate broadcast games same rink (last‑priority tiebreaker).
- **Fixed counts**: 768 games total; 32 games/team (19U 24). Matchup totals MAY be changed in this rebuild (user authorized) — but keep each team's total exact.

## Affected divisions & specific issues
- **14U AA** (worst): BC teams (Langley‑AA, Aeros‑AA) each 23 cross‑region games vs 3‑flight cap; Sask 7/25 & Manitoba 8/24 away‑heavy; 5‑game weekends (Langley‑AA/Manitoba); BC‑Calgary crammed. **Binding math:** route the 16 BC↔Calgary via Midway + Calgary‑to‑BC; each BC team gets 3 flight‑trips (Edm/Wpg/Abd) as *combined* 4‑game gatherings; leftovers hosted in BC. Matchup counts (Sask 5, Manitoba 6, Glac‑Man 5) are odd → **rebalance the matrix to even multiples first** so gatherings bundle to 3–4.
- **16U AA**: Langley‑AA 5 home/27 away + 6 flights; Victoria 8/24 + 5 flights (host Langley‑AA rivalry at home); Sask‑AA 7/25 + 5‑game weekend; Angels‑AA 4 flights (cap 3).
- **14U AAA**: BC‑Calgary crammed Sep 18–25; Cowichan 4 flights; LM@Lloydminster (Aeros/Langley Oct 16) — the Lloyd gathering must be dissolved.
- **12U AAA**: Cowichan 4 flights; Cowichan pairs bunched.
- **19U AAA**: 3 pairs play all 3 meetings in ONE weekend (Glaciers‑Langley Jan 29, Bow Valley‑Sask Sep 25, Glaciers‑Sask Oct 09) → spread; Sask Phantoms repeat‑matchup ×4 → change opponents/matrix; Langley 19U = **3 flight‑trips + 1 Midway trip**.

## Solver approach (per division)
1. **Rebalance matrix** so cross‑fly matchups bundle into clean 3–4‑game gatherings; keep each team's total. Same‑region (drive) pairs: any count.
2. **Design gatherings** (venue/host + game set): fly‑boundary games → combined trips giving each traveler ≥3–4 games; use Midway/Hardisty neutrals; respect flight caps.
3. **Assign gatherings to weekends** — clear the whole division first, then place gatherings so no team exceeds per‑weekend/day caps, no 3‑straight, spread series, respect blackouts + Winnipeg windows. Greedy + backtracking, or local search.
4. **Verify** with `detectConflicts()` (scoped + full); **local‑search refine** (swap gatherings between weekends) until hard‑conflict count is minimal.
5. **Assign venues** (held ice from `DATA.realIce`/Bible where it fits; else `Region — To Source`).
6. **Show the user** the finished division (metrics + residuals) BEFORE applying; apply via Save→edit→Load (never direct Firestore write).

## Hard‑won gotchas
- Partial reassignment ALWAYS clashes with unchanged games — clear the whole division.
- Odd matchup counts create orphan sub‑3‑game flights — rebalance the matrix first.
- Flight count is per‑*weekend*; you only save a flight by clearing a team's entire travel weekend.
- `travelTypeFor(team,'Midway')` returns FLY (Midway not in CLUSTER_REGION) — the engine excludes Midway/Hardisty via its HALFWAY set, so trust the engine's `Too many flights`, not a hand `travelTypeFor` check.
- Live schedule = Firestore `schedules/fsl-shared`; only the app writes it. Do all work in the isolated `/test/` build.

## Memories to load
`flight-caps-and-neutral-sites`, `lloyd-and-repeat-flight-rules`, `fsl-travel-exceptions-and-blackouts`, `scheduling-placement-checks`, `local-rivalry-strategy`, `bible-is-ice-truth`, `schedule-lives-in-firestore`, `overnight-optimization-and-test-site`.
