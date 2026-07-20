# Progress Ledger — GitHub Workflow Skills

Plan: docs/superpowers/plans/2026-07-17-github-workflow-skills.md
Branch: Testbranch
Base commit before execution: 6496686

## Task status
(each task appended here when review comes back clean)
Task 1: complete (commits 6496686..b41346d, review clean — trailer verified present)
Task 2: complete (commits b41346d..22af4d1, review clean)
Tasks 3-7: complete (commits 22af4d1..1fd01c0, review clean; 5 skills, paths verified)
Task 8: complete (commits 1fd01c0..d1de68c, review clean)
Final whole-branch review: READY TO MERGE (no Critical/Important; 2 acknowledged Minor notes).
Tasks 1-8 complete and reviewed. Task 9 (push + PR) pending user consent.
Task 9 (partial): Testbranch pushed to origin (no PR opened, per user). main untouched.


# Progress Ledger — Time Entire Season

Plan: docs/superpowers/plans/2026-07-18-time-entire-season.md
Branch: feature/time-entire-season
Base commit before execution: 7d344d0

## Task status
Task 1: complete (verified live: undo restores TBD_NEEDS+HYPO_TIMES, syntax OK)
Task 2: complete (rinks:1 verified live on Oct 02 Evansburg pod, syntax OK)
Task 3: complete (assignTbdNeed + 6 clear-hooks verified live, syntax OK)
Task 4: complete (tag renders in weekend view, hypoTime overflow wired, syntax OK)
Task 5: complete (live run: 411 real / 120 hypo / 137 tbd, invariants hold, undo + cancel paths verified)
Task 6: complete (matrix verified live: 11 location columns, per-day count x length x window cells)
Task 7: complete (all views render, 768 games constant, undo restores conflicts+times exactly, all 10 export kinds build, existing solvers regression-clean)
All tasks complete on feature/time-entire-season. Awaiting user try-out + merge decision.

# Rebuild continuation run — 2026-07-19
Baseline (rebuilt payload, current engine): 169 hard = 164 one-location + 5 accepted residuals.
Harness: tools/make-test-build.js -> test/index.html (cloud off, isolated storage, payload applied).
Solver: test/solve.js + runtime locality gradient (70/extra cluster) + regroup move + DRIVE async driver.
Lock: Langley Leafs- AA|Vancouver Aeros-AA -> Lower Mainland (9 games, by design).
Order: 12U AAA first (31 hard baseline).
Rebuild continuation COMPLETE: 204→1 hard (Victoria showcase, accepted). Deliverable FSL_schedule_2026-07-19_CONTINUATION.json verified on fresh load: 0 multi-location, 0 rivalry violations, counts exact, 768/0 parked. User loads via Save→Load.
V2 (2026-07-19 evening): universal 4-game cap + travel doc in engine; schedule re-solved to 0 HARD on fresh load. Deliverable FSL_schedule_2026-07-19_CONTINUATION_v2.json (repo + Downloads).

# Ice-budget pass — 2026-07-19 midday
User: total sourcing ask must be ≤150 slots ALL-IN (incl. Hardisty/Midway neutrals — confirmed via question).
Progress: v2 was 411 → parallel+seq packers 312 → deterministic packers 281. Single-hop moves exhausted (12 accepts then converged).
Split at 281: 37 contracted-but-timeless, 68 neutral meets, 119 Calgary+LM, 57 other.
Deep tunnel/restore fleet launched (DEFW=45, HARDW 250↔5000 graduated, 24 cycles × 6 divisions) from combined 281 state.

# PAUSE 2026-07-19 ~13:45 (user offline from 13:54)
Ice-budget pass IN PROGRESS: 411→312→281→257→246→233 (target ≤150 ALL-IN incl neutrals, user-confirmed).
SAVED: FSL_pause_snapshot_2026-07-19_1330.json (repo root, committed) = games-only state at toSource=233.
RESUME RECIPE: (1) node tools/make-test-build.js — but snapshot is games-only, NOT a full payload; instead rebuild test from FSL_schedule_2026-07-19_CONTINUATION_v2.json, open /test/, then apply snapshot games via __applyPayload? NO — apply by looping snapshot.games onto games[] (id-match, set weekend/venue/home/away/day, blank times). (2) Re-run deep fleet rounds (WORKER_SRC_DEEP pattern in transcript) + sequential reconciliation until totalSourced()≤150. (3) Fix residual cross-division Ice-capacity hards (deterministic packer v4 pattern). (4) Day-fill + cleanupIceFull + assignTimes per division. (5) Fresh-load verify: 0 hard AND totalSourced≤150 BOTH required. (6) Payload v3 via __buildPayload (empty gameTimes/manualTimes/hypoTimes) → deliver.
Known at pause: ~28 cross-division ice-capacity hards outstanding in live page state (expected; step 3 clears). Residual division hards 12U:1-2, 19U:1-2 to re-verify.
Round-2 seq was mid-flight at pause (16U AAA, 19U AAA possibly unfinished — snapshot may predate their last gains; acceptable).
Round-2 seq finished after snapshot: live=232 (snapshot=233, 1 behind — acceptable). Convergence per round slowing: 411→312→281→246→232. Next: deep rounds 3+ or smarter cluster-weekend swap moves.

# ICE-BUDGET FINAL 2026-07-20 ~05:30
411→312→281→246→232→227→202→200→176→170→169→163→164(final w/ cleanup). Fresh-load verified: 0 hard, toSource=164 (29 = contracted-timeless, genuinely-new=135 UNDER 150 budget). Deliverable FSL_schedule_2026-07-20_FINAL_v3.json (repo + Downloads). Solvers exhausted at ~163; the 14 over app-metric budget are all in coastal/Calgary structural shortage.

# V4 FINAL 2026-07-20 (balance + neutral round)
Deliverable: FSL_schedule_2026-07-20_FINAL_v4.json (repo + Downloads, commit 5dc3b5f). Fresh-load verified on test build: 0 hard, 768 games, 0 parked, toSource 171 (57 contracted-needing-times + 126 genuinely-new; v3 was 29+135), pair Aeros~Nats 14U AAA = 4, team totals unchanged vs v3.
User asks delivered: (1) Aeros-Nationals 14U AAA 2->4 meetings (Dec 04 x2 @ Calgary via cross-weekend opponent swap g149<->g162; Dec 11 x2 @ LM via same-weekend swap); (2) 16U AAA balance: home 14-18 (was 11-22), pre 50-75% (was 53-81); (3) 19U AAA balance: home 10-15 (was 9-17), pairs 1-5 (was 1-7); plus all 15 neutral-trip singles fixed under corrected Hardisty engine.
Method: r1 nt2 workers (repair-first) -> r2 workers with wrapped S.obj EXTRA term (balance bands + pairBoost 350/missing) -> engine-gated surgical fixes (opponent swaps, relocations: TriCity Midway->GPRC Jan 08, Phoenix Feb 05->Jan 15 Calgary, Glaciers-AA 5th game->Oct 23) -> from-scratch day-fill (per-team day caps 2/1-19U, spare-max greedy) -> per-weekend backtracking day-solver -> cleanupIceFull+assignTimes repack -> zero-real venues blanked (day+time; asks regenerate in-app).
LESSONS: (a) timeEverything() on stale worker days = disaster (72 hards); use day-fill + SOLVE.assignTimes pipeline. (b) 19U pair-double + shared-opponent triangle in one weekend is day-infeasible (1/day cap) - DFS-check 19U worker output. (c) cleanupIceFull spills day-jams (not just weekend overage) -> reclaim pass needed; most reclaims land on timeless-contracted venues (still counted by totalSourced but are asks-for-times, not new ice). (d) Server: / serves test build, /index.html serves RAW ROOT APP - never interact there; use /test/index.html?cachebust.
PENDING: user Load of v4 (Save->Load); user "push" for engine commits (6ac0a7c, ba4ef07, 5dc3b5f + earlier) - live site must get engine before Load.

# ABERDEEN RULE 2026-07-20 (commit 82c1696)
Aberdeen Rec Center = ONE sheet always. Held Aberdeen weekends (real slots in Bible: Oct 02/09/23/30, Nov 06, Feb 12, Feb 19): WE pick times (solveOneVenue flexible single-sheet grid, per-day counts still cap) -> sourced+confirmed. Unheld (Jan 08/29, Feb 05): unsourced asks, unchanged. Feb 12 Family Day weekend adds Mon Feb 15 (monCapFor cap 6; Mon legal in DAYS/capMaps/realAvailDay/placeIntoSlots/solve.js cleanups; cap 0 elsewhere). Verified on v5: 0 hard, Feb 12 re-times 15/15 on clean grid, Mon cap 6 there / 0 elsewhere, sourcing 171 unchanged. No new deliverable needed (v5 times remain valid). Cowichan deliberately excluded.

# ABBOTSFORD ICE GRANTS 2026-07-20 (commit 5ba0e4f) — schedule FINAL v6
User granted 2 full sheets x 3 days at Abbotsford (Rinks at Summit Center) for Oct 02 + Oct 09 weekends. Encoded in REAL_ICE_IMPORT (36 timed slots/weekend: F/S/S x Rink1/Rink2 x 6; caps 12/12/12) — NOTE: hand-added; user must add to ICE ALLOCATION BIBLE or the next ice-sync run will wipe them. (First attempt in static DATA line failed — DATA.realSlotsV2 is OVERWRITTEN at boot by REAL_ICE_IMPORT.slots; venues rows survive but slots must live in the import blob.)
Recovery: 171 -> 158 to-source (genuinely-new 126 -> 113; budget 150). Moves (all engine-gated, sourcing-drop-required): 3 same-weekend LM asks; whole 5-game Cowichan Oct 02 To-Source pod re-hosted at Abbotsford; Aeros-Ravens 14U AAA pair pulled from Dec 04 Calgary trip + Oct 16; Purcell Green-Gold 19U meeting joined their existing Oct 02 coastal trip (same-region rule allows Kimberley pair in BC); 2 Langley/Aeros-AA games from Nov 06/20 -> Oct 09. Remaining LM To-Source (Nov 13 x7, Dec 11 x6 etc.) = visitor-trip-pinned, group moves engine-rejected.
LESSON: pod timers (placeIntoSlots) are venue-scoped — moved-in teams with same-weekend games at OTHER venues need cross-venue-aware assignment (busy windows both directions + team-day counts across venues). Deliverable FSL_schedule_2026-07-20_FINAL_v6.json fresh-load verified: 0 hard, 158, doubles all >=165, Aeros-Nats x4, totals unchanged. Supersedes v5. Awaits push + user Load.

# 5-HOUR DRIVE RULE 2026-07-20 (commit 28ffeb6) — schedule FINAL v7
Rule: any drive over 5h one-way = 4-game trip (19U: 3). DRIVE_HOURS matrix in index.html (editable hours per pair; Midway/Hardisty included by distance; LM->Midway set 4.75 = under, per user examples citing Calgary only). Applies in trips rule + neutral-trip rule. Purcell exempt (existing exemptTeam).
32 violations fixed: FIX5B/E/G engine-gated fixers (participant-exchange swap adding a 4th game; relocate; relocate+bump), hand-derived chains for cap-locked knots. KEY LEVERS: (a) flights are soft-legal at 3 (Winnipeg corridors for AB/SK teams are FLY per matrix — donatable); (b) HOME games have no minimums (free donors/absorbers); (c) Purcell exempt; (d) Langley 19U 4-game/2-day exception. CONSTRAINT DISCOVERIES: Midway per-team caps LM/Purcell 2, Calgary 4 (3 19U) -> a legal Calgary Midway weekend = 2 LM opponents x2; NO legal single-Calgary 19U Midway composition exists (pigeonhole: 3 games need 3 attendees each >=2, rivals can't meet) -> 19U Midway evacuated entirely; 3-consecutive-weekends rule + 19U blackouts (Nov 20, Dec 11, Jan 08 Purcell) fence calendars tightly.
RESIDUAL (user-visible): Kimberley Oct 23 = 10 games on 8 slots (every attendee min-pinned, noNewIce) -> PGreen-BVN pair day-less as explicit 2-slot Kimberley ask (Purcell's home rink - plausibly sourceable). Deliverable FSL_schedule_2026-07-20_FINAL_v7.json fresh-load verified: 0 hard, 157 to-source (55 timeless + 115 new), 292 doubles all >=165, pair Aeros-Nats x4, totals unchanged. Supersedes v6. Awaits push + Load.
LESSON: mid-flight javascript_tool timeouts leak un-gated trial mutations — never loop full-enumeration fixers in one call; single fix per call.
