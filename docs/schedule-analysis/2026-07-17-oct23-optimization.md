# Oct 23 Weekend — Optimization Analysis

**Date:** 2026-07-17
**Branch:** `test-schedule`
**Scope:** Analysis only — **no games have been moved.** This document lays out what
each fix would require so you can decide which (if any) to apply.
**Source of truth:** the app's own rules engine (`detectConflicts({weekend:'Oct 23'})`),
run against the current live schedule.

> ⚠️ This is a proposal for your review, not an authoritative schedule. Every change
> below has real-world consequences (teams, travel, ice contracts). Nothing is applied
> until you approve specific fixes.

## Snapshot

- Oct 23–25, 2026 weekend: **53 games**, 5 venues.
- **24 rule conflicts** flagged by the engine:

| Count | Severity | Rule |
|------:|----------|------|
| 12 | 🔴 hard | Three straight weekends |
| 11 | 🟡 soft | Slot too short |
| 1 | 🟡 soft | Host present |

A note on counts: the whole-season engine reports 192 raw conflicts; the dashboard shows
67 (it appears to hide acknowledged/accepted ones). Some Oct 23 items below may already be
**knowingly accepted** by the league — please confirm before we "fix" anything.

---

## 1. Three straight weekends (12 hard) — the main issue

**Rule:** no team plays three consecutive calendar weekends.

**Key insight:** Oct 23 itself is rarely the problem. The conflicts come from teams also
playing the weekends on *either side*. Almost every run is `Oct 23→Oct 30→Nov 06` or
`Oct 16→Oct 23→Oct 30`. So the highest-leverage fixes are on **Oct 30 and Nov 06**, or by
moving one weekend's worth of a team's games to a **free, non-adjacent** weekend.

Because every team must hit an exact mandatory game count (32; 19U = 24), games can't be
deleted — they must be **relocated** to another weekend. That's the ripple.

### The 9 teams involved

| Team | Div | 3-in-a-row run(s) | Oct 23 games | Free, non-adjacent weekends (relocation candidates) |
|------|-----|-------------------|:---:|------|
| Langley Leafs | 12U AAA | Oct 23‑30‑Nov 06 | 4 | Sep 25, Oct 02, Oct 16, Nov 13, Nov 20, Nov 27, Dec 04, Dec 11, Jan 02, Jan 22, Feb 05 |
| Vancouver Aeros | 12U AAA | Oct 23‑30‑Nov 06 | 4 | (same as Langley — they move together) |
| Jr. Rustlers | 14U AAA | Oct 16‑23‑30 | 4 | Sep 18, Sep 25, Oct 09, Nov 06, Nov 27, Dec 04, Dec 11, Jan 02, Jan 15, Jan 22, Jan 29, Feb 12, Feb 19 |
| Langley Leafs‑ AA | 16U AA | Oct 23‑30‑Nov 06 | 4 | Sep 18, Oct 02, Oct 16, Nov 13, Nov 20, Nov 27, Dec 11, Jan 02, Jan 29, Feb 12, Feb 19 |
| Victoria Hockey Academy | 16U AA | Oct 23‑30‑Nov 06 | 4 | Sep 18, Sep 25, Oct 02, Oct 16, Nov 13, Nov 20, Nov 27, Dec 11, Jan 02, Jan 15, Jan 29, Feb 12 |
| Angels Pro Hockey | 16U AAA | Oct 16‑23‑30 **and** 23‑30‑Nov 06 (four in a row) | 4 | Sep 25, Oct 09, Nov 20, Nov 27, Dec 11, Jan 02, Jan 08, Jan 29, Feb 05, Feb 19 |
| Aurora Hockey Club | 16U AAA | Oct 16‑23‑30 **and** 23‑30‑Nov 06 (four in a row) | 4 | Sep 25, Oct 09, Nov 20, Nov 27, Dec 11, Jan 02, Jan 15, Jan 29, Feb 19 |
| Tri City Express | 16U AAA | Oct 16‑23‑30 **and** 23‑30‑Nov 06 (four in a row) | 4 | Sep 11, Sep 18, Oct 09, Nov 13, Nov 20, Dec 11, Jan 02, Jan 15, Feb 19 |
| Bow Valley Nationals | 19U AAA | Oct 23‑30‑Nov 06 | 3 | Sep 18, Oct 02, Oct 09, Oct 16, Nov 20, Dec 04, Dec 11, Jan 02, Jan 15, Jan 22, Feb 12 |

**Three teams play FOUR straight weekends** (Angels, Aurora, Tri City — all 16U AAA,
Oct 16‑23‑30‑Nov 06). Each shows up as 2 conflicts. Removing their **Oct 30** games
breaks both runs at once — one move fixes two conflicts per team.

### How to fix, and the ripple

Two ways to break each run:

- **Option A — keep Oct 23, move a neighbour.** Relocate the team's **Oct 30** (or Oct 16 /
  Nov 06) games to a free non-adjacent weekend. Oct 23 stays exactly as-is. Best if Oct 23 is
  the weekend you care about.
- **Option B — move Oct 23.** Relocate the team's **Oct 23** games instead. Empties part of
  Oct 23.

Ripple in both cases:
- The destination weekend gains games → must have **ice capacity** there, or it creates a new
  "ice capacity" hard conflict.
- Many of these are **pod / showcase gatherings** (whole groups travel together), so moving
  one team often means moving its opponents too.
- The move must not create a *new* three-straight run at the destination — this has to be
  re-checked with the engine after each change.

**Recommendation:** target the three 16U AAA "four-in-a-row" teams first (Angels, Aurora,
Tri City) by moving their **Oct 30** gathering — highest payoff (fixes 6 of the 12 conflicts)
with Oct 23 untouched.

---

## 2. Slot too short (11 soft)

**Rule:** 16U games need a 2.25h slot; these are in 2.0h slots (mostly Aberdeen Rec Center,
some Edmonton Silent Ice).

**Why:** games on the same sheet are spaced 2.0h apart, but 16U needs 2.25h.

**Fix (likely doable *within* Oct 23):** spread the affected 16U games out so each has 2.25h
before the next game on that sheet — i.e. re-time them within the Fri 08:00–22:45 day window.
Where a day/sheet is too full to add 15 min per game, one game moves to a less-full sheet or
day that weekend. No cross-weekend move needed unless a venue-day is genuinely full.

Affected games (all Oct 23): 16U AA and 16U AAA matchups at Aberdeen Rec Center (Fri/Sat/Sun)
and Edmonton Silent Ice (Fri/Sat/Sun) — 11 in total.

**Note:** these are **soft** — the league may already accept 2.0h slots at these venues. Worth
confirming whether this is a real problem or an accepted reality before re-timing games.

---

## 3. Host present (1 soft)

**Rule:** a gathering should include a host club from the venue's region.

**Flagged:** "No host club from Calgary-area in 14U AA at Calgary — GPRC (Oct 23)."

**Fix:** include a Calgary-area 14U AA club in that gathering (the 14U AA Calgary pod is
Bow Valley Nationals / Calgary Glaciers), or relocate the gathering to a venue whose region
already has a host present. Soft — may be acceptable as-is.

---

## Decision checklist (for you)

Please tell me which of these to pursue; I'll then design the exact game moves and verify
with the engine that conflicts drop and none are created:

1. **Three straight weekends (hard):**
   - [ ] Fix all 12 · [ ] Fix only the three 16U AAA four-in-a-row teams (6 conflicts) · [ ] Leave as-is
   - Preference: **Option A** (keep Oct 23, move neighbours) or **Option B** (move Oct 23 games)?
2. **Slot too short (soft):** [ ] Re-time within Oct 23 · [ ] Leave as-is (accepted)
3. **Host present (soft):** [ ] Add a Calgary-area host · [ ] Leave as-is (accepted)
4. **Accepted conflicts:** are any of the above already knowingly accepted by the league? If so,
   name them and I'll exclude them.

## What I will NOT do without your say-so

- Move, add, or delete any game.
- Change any team's mandatory game count.
- Touch weekends other than as needed for a fix you approve.

## Verification method (when we implement)

For every change: re-run `detectConflicts()` scoped to each affected weekend **and** season-wide,
confirm the targeted conflicts are gone and **zero new** conflicts appear, before committing.
