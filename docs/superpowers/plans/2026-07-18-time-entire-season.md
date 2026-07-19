# Time Entire Season Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One sidebar button that times every unlocked game in the season (real slots for sourced pods, one-rink hypothetical for unsourced pods), gives overflow games a day + morning/afternoon/evening/any window, and redesigns the "Ice to source" export into a weekend × location matrix of sourcing asks.

**Architecture:** Everything lives in the single-file app `index.html` (~5,300 lines, inline JS). We reuse the existing solvers (`solveOneVenue`, `placeIntoSlots`, `hypoTimePod`) untouched except a one-line rink-cap change, add a small persisted store `TBD_NEEDS`, one orchestrator function `timeEverything()`, and rewrite only the `kind==='sourced'` branch of the export `spec()`.

**Tech Stack:** Vanilla JS in one HTML file. No build step, no test framework. Verification = Node syntax gate + live assertions in the app via the browser preview's JavaScript console.

**Spec:** `docs/superpowers/specs/2026-07-18-time-entire-season-design.md`

## Global Constraints

- Work on branch `feature/time-entire-season` (cut from `main`). Never push.
- No game ever changes venue or weekend. Season stays exactly 768 games.
- Skip: locked weekends (`isLocked(wk)`), locked venues (`isVenueLocked(wk,venue)`), manually-locked times (`isTimeLocked(g)`), parked games (`g.venue===''`).
- Hypothetical timing assumes **exactly one rink**, league-wide (2-rink fallback removed).
- Real ice always overrides hypothetical (existing `hypoFor` behavior — do not touch).
- Line numbers below are anchors from commit `5b933ba`; re-locate with the given grep if they've drifted.

## Verification harness (used by every task)

**Syntax gate** (run after every edit to index.html; from repo root):

```bash
node -e "
const s=require('fs').readFileSync('index.html','utf8');
const vm=require('vm');
let n=0;
for(const m of s.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)){
  if(!m[1].trim())continue;
  new vm.Script(m[1]);   // throws with line info on any syntax error
  n++;
}
console.log('syntax OK ('+n+' script block(s))');
"
```

Expected: `syntax OK (N script block(s))`. Any thrown error = fix before proceeding.

**Live app** (browser preview): open `index.html` directly via the Browser pane at
`file:///C:/Users/hrunnalls/OneDrive%20-%20Silent%20Ice%20Inc.%20-%20Female%20Super%20League/Laptop/Desktop/Hammie_Test/FSL-2026-27-Control-Room/index.html`
then run the per-task assertion snippets with the browser `javascript_tool`. Reload the page after each file edit.

---

### Task 0: Branch

- [ ] **Step 1: Cut the feature branch**

```bash
cd "/c/Users/hrunnalls/OneDrive - Silent Ice Inc. - Female Super League/Laptop/Desktop/Hammie_Test/FSL-2026-27-Control-Room"
git checkout -b feature/time-entire-season
```

Expected: `Switched to a new branch 'feature/time-entire-season'`. All later commits happen here.

---

### Task 1: `TBD_NEEDS` store + undo coverage for planning layers

The undo snapshot (`pushUndo`, index.html:4649) currently does NOT include `HYPO_TIMES`, so undoing a hypothetical-times run doesn't restore them — a real gap that would break "one undo reverts the whole season run". Fix it while adding the new store.

**Files:**
- Modify: `index.html` — near the HYPO_TIMES block (`grep -n "HYPO_TIMES: hypothetical" index.html`, ~line 3241) and `pushUndo`/`undo` (`grep -n "function pushUndo" index.html`, ~line 4649)

**Interfaces:**
- Produces: global `TBD_NEEDS` (object: gameId → `{day:'Fri'|'Sat'|'Sun', win:'AM'|'PM'|'EVE'|'ANY'}`), `saveTbdNeeds()`, `clearTbdNeed(id)` (returns true if an entry was removed), `TBD_WIN_LABEL` (`{AM:'morning',PM:'afternoon',EVE:'evening',ANY:'any'}`). Undo snapshots now carry `hypo` and `tbd`.

- [ ] **Step 1: Verify current gap (live)**

In the browser preview console:

```js
JSON.parse(localStorage.getItem('fsl_hypo_times_v1')||'{}') && (typeof TBD_NEEDS)
```

Expected: `"undefined"` (store doesn't exist yet).

- [ ] **Step 2: Add the store**

Directly below the `saveHypoTimes` function (~line 3246), add:

```js
/* ===== TBD_NEEDS: overflow games that need sourced ice — day + time-of-day window ask.
   Keyed by game id -> {day:'Fri'|'Sat'|'Sun', win:'AM'|'PM'|'EVE'|'ANY'}. Planning data only:
   cleared when the game gets a real time, moves, is parked, or its matchup changes. */
var TBD_NEEDS={};
try{ TBD_NEEDS=JSON.parse(localStorage.getItem('fsl_tbd_needs_v1')||'{}')||{}; }catch(e){ TBD_NEEDS={}; }
function saveTbdNeeds(){try{localStorage.setItem('fsl_tbd_needs_v1',JSON.stringify(TBD_NEEDS));}catch(e){}}
function clearTbdNeed(id){ if(TBD_NEEDS[String(id)]){ delete TBD_NEEDS[String(id)]; saveTbdNeeds(); return true; } return false; }
const TBD_WIN_LABEL={AM:'morning',PM:'afternoon',EVE:'evening',ANY:'any'};
```

- [ ] **Step 3: Fold both planning layers into undo**

In `pushUndo` (~4649), extend the snapshot object with `hypo` and `tbd`:

```js
function pushUndo(label){try{UNDO_STACK.push(JSON.stringify({games:games,gid:gid,ice:ICE_DECISIONS,times:GAME_TIMES,parking:PARKING,locked:LOCKED,removed:REMOVED_GAMES,hypo:HYPO_TIMES,tbd:TBD_NEEDS,label:label||''}));if(UNDO_STACK.length>40)UNDO_STACK.shift();}catch(e){}}
```

In `undo()` (~4650), after the `REMOVED_GAMES` line add:

```js
  if(s.hypo){Object.keys(HYPO_TIMES).forEach(k=>delete HYPO_TIMES[k]);Object.assign(HYPO_TIMES,s.hypo);saveHypoTimes();}
  if(s.tbd){TBD_NEEDS=s.tbd;saveTbdNeeds();}
```

(Note: `HYPO_TIMES` is repopulated in place, not reassigned — other code may hold the reference. Match however `HYPO_TIMES` is declared; if it's `var`/`let`, in-place is still safest.)

- [ ] **Step 4: Syntax gate** (command above). Expected: `syntax OK`.

- [ ] **Step 5: Verify live**

Reload preview, then:

```js
(function(){
  TBD_NEEDS['999999']={day:'Sat',win:'EVE'};
  pushUndo('test');
  TBD_NEEDS['999999']={day:'Fri',win:'AM'};
  undo();
  const ok = TBD_NEEDS['999999'] && TBD_NEEDS['999999'].day==='Sat' && TBD_WIN_LABEL.EVE==='evening';
  clearTbdNeed('999999');
  return ok ? 'PASS' : 'FAIL';
})()
```

Expected: `"PASS"` (an "Undone: test" toast appearing is fine).

- [ ] **Step 6: Commit**

```bash
git add index.html && git commit -m "feat: TBD_NEEDS store; undo now restores hypothetical + TBD planning layers"
```

---

### Task 2: One-rink rule for hypothetical timing

**Files:**
- Modify: `index.html` — `hypoTimePod` (`grep -n "function hypoTimePod" index.html`, ~3302; `MAX_RINKS` ~3324) and the `hypoTime` action toast (~4698)

**Interfaces:**
- Consumes: nothing new. Produces: `hypoTimePod(wk,venue)` unchanged signature `{count,unplaced,rinks}` but `rinks` is always 1.

- [ ] **Step 1: Change the cap**

At ~3321-3324 replace:

```js
  // Try to fit everyone: prefer fewest rinks (max 2 arenas), and Saturday starting 10:00
  // (fall back to 8:00 for room). We never assume more than 2 rinks — everything must be
  // packed into at most two arenas across Sat, then Sun, then Fri.
  const MAX_RINKS=2;
```

with:

```js
  // ONE RINK ALWAYS (league rule): never assume a second sheet exists. Saturday starting
  // 10:00 (fall back to 8:00 for room), then Sunday, then Friday. Games that don't fit on
  // the single sheet are returned in `remaining` and become day+window sourcing asks.
  const MAX_RINKS=1;
```

- [ ] **Step 2: Update the hypoTime toast copy**

At ~4698 the toast says `(rk>1?(' across '+rk+' rinks'):' on one rink')`. Since `rk` is now always 1, simplify that expression to the literal `' on one rink'` (leave the rest of the toast intact).

- [ ] **Step 3: Syntax gate.** Expected: `syntax OK`.

- [ ] **Step 4: Verify live**

Reload preview. Find an unsourced pod and time it:

```js
(function(){
  for(const wk of WK){ if(isLocked(wk))continue;
    for(const v of [...new Set(gamesFor(wk).filter(g=>g.venue).map(g=>g.venue))]){
      if(isUnsourcedPod(wk,v) && !isVenueLocked(wk,v)){
        const r=hypoTimePod(wk,v);
        const sheets=new Set(Object.values(HYPO_TIMES).map(h=>h.sheet||''));
        clearHypoPod(wk,v);
        return JSON.stringify({wk,v,r,sheets:[...sheets]});
      }}}
  return 'no unsourced pod found — OK, skip';
})()
```

Expected: `rinks:1` and `sheets` containing only `""` (no "Rink 2").

- [ ] **Step 5: Commit**

```bash
git add index.html && git commit -m "feat: hypothetical timing always assumes exactly one rink"
```

---

### Task 3: Day + window assignment for overflow games

**Files:**
- Modify: `index.html` — new functions directly below `clearHypoPod` (~3351); clear-hooks in `setManualTime` (~3227), the matchup-swap hypo drop (~4746), and the two bulk hypo clears (~4998, ~5139; `grep -n "Object.keys(HYPO_TIMES).forEach" index.html`)

**Interfaces:**
- Consumes: `TBD_NEEDS`/`saveTbdNeeds`/`clearTbdNeed` (Task 1), `_SLV.block`, `hypoFor`, `HYPO_TIMES`, `games`.
- Produces: `assignTbdNeed(g)` → `{day,win}` (also writes `g.day`, clears `g.time/endTime/sheet`, stores in `TBD_NEEDS`, saves); `tbdNeedFor(g)` → `{day,win}`|null (only while the game still has no real time).

- [ ] **Step 1: Write the functions**

Insert below `clearHypoPod`/`podHasHypo` (~3352):

```js
/* ===== Overflow → day + window ("what to ask the rinks for") =============================
   A game that fits on NO held slot stays on its weekend+venue and gets: a day (Sat→Sun→Fri
   preference) where both teams still fit under the rules, and a time-of-day window computed
   from when both teams are actually free that day. Windows: AM = start 8:00–11:59,
   PM = 12:00–16:59, EVE = 17:00+ (Fri/Sat end by 8:30 PM; Sun out before 3 PM → no EVE).
   Whole day free → ANY. Stored in TBD_NEEDS; day is written as the game's real day, time
   stays blank so every view shows "Sat · TBD (evening)". */
function tbdNeedFor(g){
  if(!g||g.time) return null;                 // real time wins
  return TBD_NEEDS[String(g.id)]||null;
}
function assignTbdNeed(g){
  const wk=g.weekend, block=_SLV.block(g.division), REST=165;
  const is19=String(g.division).indexOf('19U')===0;
  const capDay=d=> d==='Sun' ? 1 : (is19?1:2);
  const DAY_END={Fri:20*60+30,Sat:20*60+30,Sun:15*60};
  // Effective busy intervals + day-counts for one team on one day (real, hypo, or TBD day)
  const busy=(team,day)=>{
    const iv=[]; let cnt=0;
    games.forEach(o=>{
      if(o.weekend!==wk||String(o.id)===String(g.id))return;
      if(o.home!==team&&o.away!==team)return;
      const h=(!o.time&&HYPO_TIMES[String(o.id)])?HYPO_TIMES[String(o.id)]:null;
      const t=TBD_NEEDS[String(o.id)];
      const d=o.time?o.day:(h?h.day:(t?t.day:o.day||''));
      if(d!==day)return;
      cnt++;
      const hm=s=>{const m=/^(\d{1,2}):(\d{2})$/.exec(String(s||''));return m?(+m[1])*60+(+m[2]):null;};
      const st=o.time?hm(o.time):(h?hm(h.time):null);
      if(st!=null){ const en=(o.time&&o.endTime?hm(o.endTime):null); iv.push({start:st,end:en!=null?en:st+_SLV.block(o.division)}); }
    });
    return {iv,cnt};
  };
  const winsFor=(day)=>{
    const bh=busy(g.home,day), ba=busy(g.away,day);
    if(bh.cnt>=capDay(day)||ba.cnt>=capDay(day)) return null;          // day cap hit
    const iv=bh.iv.concat(ba.iv);
    const lastStart=DAY_END[day]-block; if(lastStart<8*60) return null;
    const free=t=>{ const en=t+block;
      for(const x of iv){ if(t<x.end&&en>x.start) return false;
        const gap=t>=x.end?t-x.end:x.start-en; if(gap<REST) return false; }
      return true; };
    const ranges={AM:[8*60,12*60],PM:[12*60,17*60],EVE:[17*60,24*60]};
    const ok=[];
    ['AM','PM','EVE'].forEach(w=>{
      if(day==='Sun'&&w==='EVE')return;
      const lo=ranges[w][0], hi=Math.min(ranges[w][1]-1,lastStart);
      for(let t=lo;t<=hi;t+=15){ if(free(t)){ ok.push(w); break; } }
    });
    return ok.length?ok:null;
  };
  let pick=null;
  for(const day of ['Sat','Sun','Fri']){
    const ok=winsFor(day);
    if(ok){ pick={day:day, win: ok.length>=2 ? 'ANY' : ok[0]}; break; }
  }
  if(!pick){
    // nothing fits cleanly — least-loaded day, window ANY (flagged in the export)
    let best='Sat',bestN=1e9;
    ['Sat','Sun','Fri'].forEach(d=>{const n=busy(g.home,d).cnt+busy(g.away,d).cnt;if(n<bestN){bestN=n;best=d;}});
    pick={day:best,win:'ANY'};
  }
  g.day=pick.day; g.time=''; g.endTime=''; g.sheet='';
  delete GAME_TIMES[String(g.id)];
  TBD_NEEDS[String(g.id)]=pick; saveTbdNeeds();
  return pick;
}
```

- [ ] **Step 2: Clear-hooks — a TBD tag dies wherever a hypo time dies**

1. `setManualTime` (~3227): at the top of the function body add `clearTbdNeed(id);` (a manually-set real time supersedes the ask).
2. Matchup-swap hypo drop (~4746, the `try{ if(typeof HYPO_TIMES!=='undefined' ...` line): add on the next line `try{ clearTbdNeed(x.id); }catch(e){}`.
3. Both bulk clears (~4998 and ~5139, `Object.keys(HYPO_TIMES).forEach(k=>delete HYPO_TIMES[k]);`): add after each `TBD_NEEDS={};saveTbdNeeds();`.
4. In `solveOneVenue` (~2119-2124): the placed-games loop writes real times — add `clearTbdNeed(gg.id);` inside the placed loop (after `GAME_TIMES[...]=...`). Do the same in `solveWeekend`'s placed loop (~2002).

- [ ] **Step 3: Syntax gate.** Expected: `syntax OK`.

- [ ] **Step 4: Verify live**

Reload. Pick any real game and force-assign:

```js
(function(){
  const g=games.find(x=>x.venue&&!isTimeLocked(x));
  const before={day:g.day,time:g.time};
  pushUndo('tbd test');
  const p=assignTbdNeed(g);
  const shown=tbdNeedFor(g);
  const okAssign = p && ['Fri','Sat','Sun'].includes(p.day) && ['AM','PM','EVE','ANY'].includes(p.win)
    && g.day===p.day && g.time==='' && shown && shown.win===p.win;
  setManualTime(g.id,{day:p.day,time:'10:00',end:'12:00',sheet:''});
  const okClear = !TBD_NEEDS[String(g.id)];
  undo();
  return (okAssign&&okClear)?'PASS':'FAIL '+JSON.stringify({p,okAssign,okClear});
})()
```

Expected: `"PASS"`.

- [ ] **Step 5: Commit**

```bash
git add index.html && git commit -m "feat: overflow games get day + time-of-day window (TBD_NEEDS) with auto-clear hooks"
```

---

### Task 4: Single-pod consistency + visible tag

**Files:**
- Modify: `index.html` — `hypoTime` action handler (~4695-4698), `gameLine` time display (~2574-2576)

**Interfaces:**
- Consumes: `assignTbdNeed`, `tbdNeedFor`, `TBD_WIN_LABEL`, `hypoTimePod`.

- [ ] **Step 1: hypoTime button overflow → day+window**

In the `hypoTime` action (~4697), after `const r=hypoTimePod(d.wk,d.venue);` insert:

```js
    if(r&&r.unplaced){ games.filter(g=>g.weekend===d.wk&&g.venue===d.venue&&!g.time&&!HYPO_TIMES[String(g.id)]&&!isTimeLocked(g)).forEach(g=>assignTbdNeed(g)); }
```

and extend the toast's `(un?(' — '+un+" couldn't fit"):'')` portion to `(un?(' — '+un+" couldn't fit on one sheet — given a day + window to source"):'')` (keep the existing unicode escapes style: `—` for the em dash, `’` for the apostrophe).

- [ ] **Step 2: Show the tag in the pod card**

In `gameLine` (~2574-2576) the time fallback chain ends with `:'TBD'`. Replace that final `'TBD'` with:

```js
(function(){const t=tbdNeedFor(g);return t?`<span style="color:#a15c00;font-weight:700" title="Needs sourced ice — ask this venue's rinks for a ${TBD_WIN_LABEL[t.win]} slot on ${t.day}. Set automatically by season/pod timing.">TBD (${TBD_WIN_LABEL[t.win]})</span>`:'TBD';})()
```

(The day itself already shows — the game's real `day` field is set, so it sorts into the day group.)

- [ ] **Step 3: Syntax gate.** Expected: `syntax OK`.

- [ ] **Step 4: Verify live**

Reload, then:

```js
(function(){
  const g=games.find(x=>x.venue&&!isTimeLocked(x)&&!x.time) || games.find(x=>x.venue&&!isTimeLocked(x));
  pushUndo('tag test');
  assignTbdNeed(g);
  view={type:'weekend',wk:g.weekend}; render();
  const html=document.getElementById('app').innerHTML;
  const ok=html.indexOf('TBD (')>-1;
  undo();
  return ok?'PASS':'FAIL';
})()
```

Expected: `"PASS"`.

- [ ] **Step 5: Commit**

```bash
git add index.html && git commit -m "feat: pod hypothetical button day+windows its overflow; TBD window tag visible on pod cards"
```

---

### Task 5: `timeEverything()` + sidebar button

**Files:**
- Modify: `index.html` — new function below `solveOneVenue` (~2135); sidebar (~1230, below the Import times button); `MUTATING` set (~4648); `ACTIONS` map (~4694, next to `podTime`); undo label map (~5340, `grep -n "ran auto weekend solve" index.html`)

**Interfaces:**
- Consumes: everything above. Produces: `timeEverything()` → `{timedReal,timedHypo,tbd,podsReal,podsHypo,skippedPods,skippedWks}` and ACTION `timeAll`.

- [ ] **Step 1: The orchestrator**

Insert below `solveOneVenue`'s closing brace (~2135):

```js
/* ===== TIME ENTIRE SEASON: every weekend × venue pod in one pass. Sourced pods → real
   slots (solveOneVenue). Unsourced pods → one-rink hypothetical (hypoTimePod). Anything
   that fits nowhere stays put and becomes a day+window sourcing ask (assignTbdNeed).
   Skips locked weekends/venues, manual time locks, parked games. One undo step. */
function timeEverything(){
  let timedReal=0,timedHypo=0,tbd=0,podsReal=0,podsHypo=0,skippedPods=0,skippedWks=0;
  WK.forEach(wk=>{
    if(isLocked(wk)){skippedWks++;return;}
    const names=[...new Set(gamesFor(wk).filter(g=>g.venue&&String(g.venue).trim()).map(g=>g.venue))];
    names.forEach(venue=>{
      if(isVenueLocked(wk,venue)){skippedPods++;return;}
      const pod=()=>games.filter(g=>g.weekend===wk&&g.venue===venue);
      if(isUnsourcedPod(wk,venue)){
        const r=hypoTimePod(wk,venue); podsHypo++; timedHypo+=(r.count||0);
        pod().filter(g=>!g.time&&!HYPO_TIMES[String(g.id)]&&!isTimeLocked(g)).forEach(g=>{assignTbdNeed(g);tbd++;});
      } else {
        solveOneVenue(wk,venue); podsReal++;
        pod().forEach(g=>{ if(isTimeLocked(g))return;
          if(g.time){timedReal++;}
          else {assignTbdNeed(g);tbd++;}
        });
      }
    });
  });
  return {timedReal,timedHypo,tbd,podsReal,podsHypo,skippedPods,skippedWks};
}
```

- [ ] **Step 2: Sidebar button**

In `sidebar()` (~1230), directly after the Import times `</button>`, add:

```html
    <button class="ice-btn" data-act="timeAll" style="margin-top:8px" title="Time every unlocked game in the season: real contracted slots where you have them, a one-rink hypothetical plan where you don't, and a day + time-of-day sourcing ask for anything that fits nowhere. One click of Undo reverts the whole run.">
      <span class="big">⏱</span>
      <span><span class="l1">Time entire season</span><br><span class="l2">Real slots + 1-rink hypo</span></span>
    </button>
```

- [ ] **Step 3: Wire the action**

1. Add `'timeAll'` to the `MUTATING` set (~4648) so `pushUndo` fires automatically before it runs.
2. In `ACTIONS` next to `podTime` (~4694) add:

```js
  timeAll:()=>{ if(!confirm('Time the ENTIRE season?\n\nEvery unlocked game gets re-timed: real contracted slots where they exist, a one-rink hypothetical plan on unsourced ice, and a day + time-of-day sourcing ask for anything that fits nowhere.\n\nLocked weekends, locked venues and manually-locked times are untouched. One click of Undo reverts everything.')){UNDO_STACK.pop();return;}
    const r=timeEverything(); render();
    showToast('⏱ Season timed — '+r.timedReal+' on real ice · '+r.timedHypo+' hypothetical (1 rink) · '+r.tbd+' need sourcing (day + window — see the Ice to source export)'+((r.skippedWks||r.skippedPods)?(' · skipped '+(r.skippedWks?r.skippedWks+' locked weekend'+(r.skippedWks===1?'':'s'):'')+(r.skippedWks&&r.skippedPods?' + ':'')+(r.skippedPods?r.skippedPods+' locked venue'+(r.skippedPods===1?'':'s'):'')):''),'good'); },
```

(Note the `UNDO_STACK.pop()` on cancel — `MUTATING` pushed a snapshot before the confirm; popping it keeps the undo stack honest.)

3. In the undo label map (~5340) add `timeAll:'timed the entire season',`.

- [ ] **Step 4: Syntax gate.** Expected: `syntax OK`.

- [ ] **Step 5: Verify live (the big one)**

Reload. In the console:

```js
(function(){
  const nGames=games.length, sig=JSON.stringify(games.map(g=>[g.id,g.weekend,g.venue]).sort());
  pushUndo('season test');
  const r=timeEverything(); render();
  const sig2=JSON.stringify(games.map(g=>[g.id,g.weekend,g.venue]).sort());
  const placedNoAssign=games.filter(g=>g.venue&&!isTimeLocked(g)&&!g.time&&!HYPO_TIMES[String(g.id)]&&!TBD_NEEDS[String(g.id)]&&!isLocked(g.weekend)&&!isVenueLocked(g.weekend,g.venue)).length;
  const out={r, sameCount:games.length===nGames, samePlaces:sig===sig2, everyPlacedGameHandled:placedNoAssign===0};
  undo();
  return JSON.stringify(out);
})()
```

Expected: `sameCount:true`, `samePlaces:true`, `everyPlacedGameHandled:true`, and plausible counts in `r`.

Then click the actual sidebar button once (accept the confirm), eyeball a few weekends, click Undo, and confirm the previous state returns.

- [ ] **Step 6: Commit**

```bash
git add index.html && git commit -m "feat: Time entire season button — real slots + 1-rink hypo + day/window sourcing asks"
```

---

### Task 6: "Ice to source" export → weekend × location matrix

**Files:**
- Modify: `index.html` — export `spec()` `kind==='sourced'` branch (~3871-3878), `renderTable` (~3939-3944), `xlsHtml` (~3946-3955), the `sourced` entry in `typeOpts` (~4038) and `itemsFor` (~3843) can stay as-is.

**Interfaces:**
- Consumes: `clusterName(venue)` (index.html:994 — already groups Calgary/Banff/Canmore/Cochrane, Lloyd/Lashburn, Abbotsford/Delta→Lower Mainland, Morinville→Edmonton; unknown cities like Evansburg/Hardisty/Midway fall through as their own name, which is exactly the approved mapping), `sourceNeededRows()`, `HYPO_TIMES`, `TBD_NEEDS`, `TBD_WIN_LABEL`, `_SLV.block`, `hypoFor`, `isTimeLocked`, `WKDATE`, `cityOf`.

- [ ] **Step 1: Multi-line cell support (shared table writers)**

In `renderTable` (~3942) change the body cell `${esc(x)}` to `${esc(x).replace(/\n/g,'<br>')}` and `white-space:nowrap` to `white-space:${sp.kind==='sourced'?'normal':'nowrap'};vertical-align:top`.
In `xlsHtml` (~3953) change the row cell `${esc(x)}` to `${esc(x).replace(/\n/g,'<br style=\"mso-data-placement:same-cell\">')}`.
(No other export produces `\n` in cells, so this is inert elsewhere.)

- [ ] **Step 2: Replace the `sourced` spec branch**

Replace the whole `} else if(kind==='sourced'){ ... }` block (~3871-3878) with:

```js
    } else if(kind==='sourced'){
      // Weekend × location matrix of sourcing asks. Each cell: per-day count × length × window.
      // Sources: unsourced pods (every hypothetical slot is an ask; window from its planned time),
      // TBD_NEEDS day+window overflow tags, and a bare-count fallback for anything not yet run
      // through "Time entire season".
      const winOf=t=>{const m=/^(\d{1,2}):(\d{2})$/.exec(String(t||''));if(!m)return 'ANY';const mm=(+m[1])*60+(+m[2]);return mm<720?'AM':(mm<1020?'PM':'EVE');};
      const lenOf=d=>{const h=(((CFG.slotHours||{})[d])||2);return (h%1===0?h:h.toFixed(1)).toString().replace(/\.0$/,'')+'h';};
      const DOW={Fri:0,Sat:1,Sun:2};
      // asks[wk][cluster][city] = { 'Sat|2h|EVE': count, ... , '__extra': n }
      const asks={}; let totalAsks=0;
      const bump=(wk,venue,key)=>{const cl=clusterName(venue),ct=cityOf(venue);
        ((((asks[wk]=asks[wk]||{})[cl]=asks[wk][cl]||{})[ct]=asks[wk][cl][ct]||{})[key]=(asks[wk][cl][ct][key]||0)+1);totalAsks++;};
      sourceNeededRows().forEach(r=>{
        const pod=games.filter(g=>g.weekend===r.wk&&g.venue===r.venue);
        let counted=0;
        pod.forEach(g=>{
          if(g.time&&isTimeLocked(g))return;                       // locked real time: not an ask
          const h=(!g.time&&HYPO_TIMES[String(g.id)]&&isUnsourcedPod(r.wk,r.venue))?HYPO_TIMES[String(g.id)]:null;
          const t=(!g.time)?TBD_NEEDS[String(g.id)]:null;
          if(h){bump(r.wk,r.venue,h.day+'|'+lenOf(g.division)+'|'+winOf(h.time));counted++;}
          else if(t){bump(r.wk,r.venue,t.day+'|'+lenOf(g.division)+'|'+t.win);counted++;}
          else if(!g.time&&isUnsourcedPod(r.wk,r.venue)){bump(r.wk,r.venue,'?|'+lenOf(g.division)+'|ANY');counted++;}
        });
        const rest=r.need-counted;
        for(let i=0;i<rest;i++){bump(r.wk,r.venue,'?|?|ANY');}
      });
      const clusters=[...new Set([].concat(...Object.values(asks).map(o=>Object.keys(o))))]
        .sort((a,b)=>a.localeCompare(b));
      title='FSL — Ice To Source — what to ask each location for';
      cols=['Weekend','Date'].concat(clusters);
      const cellFor=(wk,cl)=>{
        const byCity=(asks[wk]||{})[cl]; if(!byCity)return '';
        const cities=Object.keys(byCity).sort();
        return cities.map(ct=>{
          const parts=Object.keys(byCity[ct])
            .sort((a,b)=>{const A=a.split('|'),B=b.split('|');return (DOW[A[0]]??9)-(DOW[B[0]]??9)||a.localeCompare(b);})
            .map(k=>{const[q,len,win]=k.split('|'),n=byCity[ct][k];
              return (q==='?'?'? day':q)+': '+n+'×'+(len==='?'?'slot'+(n>1?'s':''):len)+' '+(TBD_WIN_LABEL[win]||'any');});
          return (cities.length>1?ct+' — ':'')+parts.join('\n'+(cities.length>1?'      ':''));
        }).join('\n');
      };
      rows=WK.filter(wk=>asks[wk]).map(wk=>({c:[wk,(WKDATE[wk]||'')].concat(clusters.map(cl=>cellFor(wk,cl))),k:'src'}));
      color=()=> '#ffffff';
      legend=totalAsks?(totalAsks+' slot'+(totalAsks===1?'':'s')+' to source · each cell = the ask for that location that weekend (day: count × length · time of day)'):'nothing to source — all games sit on real ice';
      note='Run “⏱ Time entire season” first for precise day + time-of-day asks; “? day” rows are needs not yet planned. Windows: morning = 8–noon start, afternoon = noon–5, evening = 5+, any = whole day works. Sundays: teams are out before 3 PM.';
```

(The closing of the branch stays `} else if(kind==='unused'){` — do not disturb the neighbors.)

- [ ] **Step 3: Syntax gate.** Expected: `syntax OK`.

- [ ] **Step 4: Verify live**

Reload, run `timeEverything()` via the sidebar button (accept confirm), then navigate: sidebar → Schedule exports → report type "🔴 Ice to source". Check on screen:
- Columns = Weekend, Date, then location names (Calgary-area combined, Lower Mainland combined, Lloydminster combined, Evansburg/Hardisty standalone if present).
- Cells read like `Sat: 2×2h evening` with line breaks.
Then click Export and open the .xls — same matrix, line breaks inside cells. Then console-check totals roughly match the toast's "need sourcing" count plus unsourced-pod hypothetical slots, then click Undo.

- [ ] **Step 5: Commit**

```bash
git add index.html && git commit -m "feat: Ice to source export is now a weekend × location matrix of day/length/window asks"
```

---

### Task 7: End-to-end regression pass

**Files:** none (verification only), then merge-ready.

- [ ] **Step 1: Full smoke test in the preview**

1. Reload with a clean console (no errors on load — check with the console-messages tool).
2. Click through: Dashboard, a few weekends, Ice Allocation, Conflicts, Parking garage, each export type (league, team, division, weekend, city, arena, unused, sourced) — no blank screens, no console errors.
3. "⚙ Time this pod" on a sourced pod still works. "⏱ Hypothetical times" on an unsourced pod still works (one rink). "⚙ Auto weekend solve" still works.
4. Conflicts count before "Time entire season" vs after Undo: identical.
5. `games.length` is 768-scale constant throughout (matches its pre-run value exactly).

- [ ] **Step 2: Syntax gate one last time.** Expected: `syntax OK`.

- [ ] **Step 3: Report** — summarize results to the user, offer them the preview to try, and (only if they approve) merge `feature/time-entire-season` → `main`. Never push.

---

## Self-review notes

- Spec §1 button → Task 5. §2 engine/skips → Task 5 (+Task 2 rink rule). §3 overflow day+window, storage, lifecycle, single-pod consistency, display → Tasks 1, 3, 4. §4 export matrix, sources, cluster map → Task 6 (existing `clusterName` already encodes the approved mapping; Evansburg/neutrals fall through standalone). §5 invariants → asserted in Task 5/7 verifications.
- Type/name consistency checked: `TBD_NEEDS`, `saveTbdNeeds`, `clearTbdNeed`, `tbdNeedFor`, `assignTbdNeed`, `TBD_WIN_LABEL`, `timeEverything`, action `timeAll` used consistently across tasks.
- Known judgment call: in Task 6, over-capacity sourced pods count locked-real-time games as satisfied (not asks) — matches `sourcedFor` used-vs-real math via the `rest` fallback.
