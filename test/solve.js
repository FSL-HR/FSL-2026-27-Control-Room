// FSL division rebuild optimizer — runs inside the app page (has detectConflicts + DATA + games).
// Real engine is the objective; we scope `games` to one division's slice for ~7x speed.
window.SOLVE = (function(){
  var CLUSTERS_ALL = ['Edmonton','Calgary-area','Aberdeen','Winnipeg','Lower Mainland','Cowichan','Lloydminster','Kimberley','Midway','Hardisty'];
  var CITY = {'Calgary-area':'Calgary','Lower Mainland':'Lower Mainland','Edmonton':'Edmonton','Aberdeen':'Aberdeen',
              'Winnipeg':'Winnipeg','Lloydminster':'Lloydminster','Cowichan':'Cowichan','Kimberley':'Kimberley'};
  var HELD = { // canonical held venue string per cluster (used when realIce has capacity that weekend)
    'Winnipeg':'Winnipeg — 7 Oaks Arena'
  };
  var NEUTRAL = {'Midway':'Midway- Midway Arena','Hardisty':'Hardisty — Hardisty Arena'};
  function rnd(n){ return Math.floor(Math.random()*n); }
  function pick(a){ return a[rnd(a.length)]; }

  // canonical venue string for a (cluster, weekend). Prefers a held Bible venue if that weekend
  // has capacity in that cluster; else a city To-Source placeholder. Winnipeg = held only.
  function venueFor(cl, wk){
    if(NEUTRAL[cl]) return NEUTRAL[cl];
    var ri = (DATA.realIce[wk]||{});
    var heldV = Object.keys(ri).filter(function(v){ return clusterName(v)===cl && (ri[v].Fri+ri[v].Sat+ri[v].Sun)>0
      && !/WEM Ice Palace|Archie Miller|Grand(e)? Prairie|Bonnetts/i.test(v); }); // restricted venues filled by recovery pass
    if(cl==='Winnipeg') return heldV.length? heldV[0] : null; // no new Winnipeg ice
    if(heldV.length) return heldV[0];
    if((CFG.noNewIce||[]).indexOf(cl)>=0) return null; // can't source new ice here (Kimberley/GP too)
    return (CITY[cl]||cl)+' — To Source';
  }

  var S = {};
  S.div = null; S.work = null; S.real = null; S.teams = null; S.homeCl = {}; S.weekends = null;

  S.setup = function(div){
    S.div = div;
    S.real = games;                       // keep reference to full real array
    S.teams = DATA.teams.filter(function(t){return t.division===div;});
    S.homeCl = {}; S.teams.forEach(function(t){ S.homeCl[t.name]=t.homeCluster; });
    S.weekends = CFG.weekendOrder.filter(function(w){ return w!=='Jan 02'; }); // Jan 02 league blackout
    // deep-copy the division games as the working set; blank times for structural search
    S.work = games.filter(function(g){return g.division===div;}).map(function(g){
      return {id:g.id, division:div, home:g.home, away:g.away, weekend:g.weekend, venue:g.venue,
              day:g.day, time:'', endTime:'', sheet:g.sheet||'', date:'', override:g.override||''};
    });
    // apply pair-locks: force a matchup pair to a fixed cluster (e.g. Langley-Aeros -> Lower Mainland)
    S.LOCKS = S.LOCKS || {};
    S.work.forEach(function(g){ var k=[g.home,g.away].sort().join('|'); if(S.LOCKS[k]){ g.lockCl=S.LOCKS[k];
      var v=venueFor(g.lockCl, g.weekend); if(v) g.venue=v; } });
    // precompute deficit-metric inputs: other-division usage per venue-weekend + real contracted ice
    S.OTHERVW={}; S.REALAVAIL={};
    var vwSet={};
    games.forEach(function(g){ vwSet[g.weekend+'|'+g.venue]=1; if(g.division===div) return; var cl=clusterName(g.venue); if(cl==='Midway'||cl==='Hardisty') return; var k=g.weekend+'|'+g.venue; S.OTHERVW[k]=(S.OTHERVW[k]||0)+1; });
    Object.keys(DATA.realIce).forEach(function(wk){ Object.keys(DATA.realIce[wk]).forEach(function(vn){ vwSet[wk+'|'+vn]=1; }); });
    Object.keys(vwSet).forEach(function(k){ var i=k.indexOf('|'); var w=k.slice(0,i), v=k.slice(i+1); S.REALAVAIL[k]=(typeof realAvailTotal==='function')?realAvailTotal(w,v):0; });
    return {teams:S.teams.map(function(t){return t.name;}), games:S.work.length, weekends:S.weekends.length, locked:S.work.filter(function(g){return g.lockCl;}).length};
  };

  // score the working set with the REAL engine, scoped to just this division (fast).
  S.score = function(work){
    var saved = games; games = work;
    var c;
    try { c = detectConflicts(); } finally { games = saved; }
    var hard=0, soft=0, hbyRule={};
    for(var i=0;i<c.length;i++){ if(c[i].sev==='hard'){ hard++; hbyRule[c[i].rule]=(hbyRule[c[i].rule]||0)+1; } else soft++; }
    return {hard:hard, soft:soft, hbyRule:hbyRule, list:c};
  };

  // balance penalty: pre-Christmas share (~60-70% by Dec 11) + home/away (~target) per team.
  var PRE = new Set(['Sep 11','Sep 18','Sep 25','Oct 02','Oct 09','Oct 16','Oct 23','Oct 30','Nov 06','Nov 13','Nov 20','Nov 27','Dec 04','Dec 11']);
  S.balance = function(work){
    var tot={}, pre={}, h={}, a={};
    S.teams.forEach(function(t){ tot[t.name]=0; pre[t.name]=0; h[t.name]=0; a[t.name]=0; });
    work.forEach(function(g){
      tot[g.home]++; tot[g.away]++; h[g.home]++; a[g.away]++;
      if(PRE.has(g.weekend)){ pre[g.home]++; pre[g.away]++; }
    });
    var pen=0;
    S.teams.forEach(function(t){
      var n=tot[t.name]||1; var frac=pre[t.name]/n;
      if(frac<0.55) pen+=(0.55-frac)*20; if(frac>0.72) pen+=(frac-0.72)*20;
      var htarget=n*0.375; // ~12/32
      pen += Math.abs(h[t.name]-htarget)*0.4;
    });
    return pen;
  };

  // shaped penalties that give the search a gradient the binary hard-conflicts don't:
  // flights over cap, undersized flights (<4 games), and undersized long drives (<3).
  S.shape = function(work){
    var pen=0;
    S.teams.forEach(function(t){
      var fw={};   // weekend -> #games at fly dests
      var bc={};   // weekend -> present a BC fly dest
      var dv={};   // weekend -> #games at regional-drive dests
      work.forEach(function(g){ if(g.home!==t.name&&g.away!==t.name) return; var cl=clusterName(g.venue);
        if(cl==='Midway'||cl==='Hardisty') return; var tt=travelTypeFor(t,cl);
        if(tt==='FLY'){ fw[g.weekend]=(fw[g.weekend]||0)+1; if(CLUSTER_REGION[cl]==='BC') bc[g.weekend]=1; }
        else if(tt==='REGIONAL') dv[g.weekend]=(dv[g.weekend]||0)+1; });
      if(t.homeCluster==='Winnipeg'){
        var nbc=Object.keys(bc).length; if(nbc>1) pen += (nbc-1)*160;   // one BC trip max; AB flights uncapped
      } else {
        var rg=CLUSTER_REGION[t.homeCluster]; var cap = (rg==='BC'||rg==='AB') ? 4 : 3;
        var nfly=Object.keys(fw).length; if(nfly>cap) pen += (nfly-cap)*160;  // strong gradient toward the flight cap
      }
      // flights: <3 is hard (strong penalty), 3 allowed but 4 preferred (light pull); drives: <3 hard
      Object.keys(fw).forEach(function(wk){ if(fw[wk]<3) pen += (3-fw[wk])*80; else if(fw[wk]<4) pen += 8; });
      Object.keys(dv).forEach(function(wk){ if(dv[wk]<3) pen += (3-dv[wk])*80; });
    });
    // per-team weekend & per-day overflow (gradient toward showcase/day caps) + three-straight-weekends
    var perS=perShow(S.div), mxD=maxDay(S.div);
    var WKD={'Sep 11':'2026-09-11','Sep 18':'2026-09-18','Sep 25':'2026-09-25','Oct 02':'2026-10-02','Oct 09':'2026-10-09','Oct 16':'2026-10-16','Oct 23':'2026-10-23','Oct 30':'2026-10-30','Nov 06':'2026-11-06','Nov 13':'2026-11-13','Nov 20':'2026-11-20','Nov 27':'2026-11-27','Dec 04':'2026-12-04','Dec 11':'2026-12-11','Jan 02':'2027-01-02','Jan 08':'2027-01-08','Jan 15':'2027-01-15','Jan 22':'2027-01-22','Jan 29':'2027-01-29','Feb 05':'2027-02-05','Feb 12':'2027-02-12','Feb 19':'2027-02-19'};
    var dnum={}; Object.keys(WKD).forEach(function(w){ dnum[w]=Math.round(new Date(WKD[w]+'T00:00:00Z').getTime()/86400000); });
    S.teams.forEach(function(t){
      var wk={}, wd={};
      work.forEach(function(g){ if(g.home!==t.name&&g.away!==t.name) return; wk[g.weekend]=(wk[g.weekend]||0)+1; if(g.day) wd[g.weekend+'|'+g.day]=(wd[g.weekend+'|'+g.day]||0)+1; });
      Object.keys(wk).forEach(function(w){ if(wk[w]>perS) pen += (wk[w]-perS)*35; });
      Object.keys(wd).forEach(function(k){ if(wd[k]>mxD) pen += (wd[k]-mxD)*35; });
      var ws=Object.keys(wk).filter(function(w){return dnum[w]!=null;}).sort(function(a,b){return dnum[a]-dnum[b];});
      for(var i=2;i<ws.length;i++){ if(dnum[ws[i-1]]-dnum[ws[i-2]]<=8 && dnum[ws[i]]-dnum[ws[i-1]]<=8) pen+=25; } // three-straight
    });
    return pen;
  };
  // quality: each game should be at a participant's home rink, with the host team listed home.
  // Orphan games (neither team from the venue cluster) are allowed but discouraged (need a host).
  S.quality = function(work){
    var pen=0;
    work.forEach(function(g){ var cl=clusterName(g.venue); if(cl==='Midway'||cl==='Hardisty') return;
      var hostH=S.homeCl[g.home]===cl, hostA=S.homeCl[g.away]===cl;
      if(!hostH && !hostA){ if(cl!=='Calgary-area') pen+=5; }  // orphans OK at the central Calgary-area neutral showcase
      else if(hostA && !hostH) pen+=7;      // host team is wrongly the away side
    });
    return pen;
  };
  // sourcing penalty: prefer HELD Bible ice over To-Source (games should land on weekends with real ice)
  S.sourcing = function(work){ var n=0; for(var i=0;i<work.length;i++){ if(/To Source/i.test(work[i].venue)) n++; } return n*S.SRCW; };
  S.SRCW = 0;
  // deficit penalty = the APP's real "to source" metric for THIS division: sum over venue-weekends of
  // max(0, otherDivGames + thisDivGames - realContractedIce). Neutrals (Midway/Hardisty) excluded (kept).
  S.DEFW = 0; S.OTHERVW = {}; S.REALAVAIL = {};
  S.deficit = function(work){ if(!S.DEFW) return 0; var u={};
    for(var i=0;i<work.length;i++){ var g=work[i]; var cl=clusterName(g.venue); if(cl==='Midway'||cl==='Hardisty') continue; var k=g.weekend+'|'+g.venue; u[k]=(u[k]||0)+1; }
    var d=0; for(var k in u){ var over=(S.OTHERVW[k]||0)+u[k]-(S.REALAVAIL[k]||0); if(over>0) d+=over; }
    return d*S.DEFW; };
  S.HARDW = 1000;  // graduated: lower during ice-packing exploration so anneal can tunnel past conflicts, raise to squeeze out
  S.obj = function(sc, work){ return sc.hard*S.HARDW + sc.soft*8 + S.balance(work) + S.shape(work) + S.quality(work) + S.sourcing(work) + S.deficit(work); };

  // ---- moves (mutate a game in `work`); return an undo fn ----
  function setVenueWk(g, cl, wk){ g.weekend=wk; g.venue=venueFor(cl, wk) || g.venue; }
  S.MOVES = {
    reweekend: function(work){ var g=pick(work); var o={weekend:g.weekend,venue:g.venue};
      var cl=clusterName(g.venue); var wk=pick(S.weekends); var v=venueFor(cl,wk); if(!v) return null;
      g.weekend=wk; g.venue=v; return function(){ g.weekend=o.weekend; g.venue=o.venue; }; },
    recluster: function(work){ var g=pick(work); if(g.lockCl) return null; var o={venue:g.venue};
      var cl=pick(CLUSTERS_ALL); var v=venueFor(cl,g.weekend); if(!v) return null;
      g.venue=v; return function(){ g.venue=o.venue; }; },
    homeaway: function(work){ var g=pick(work); var t=g.home; g.home=g.away; g.away=t;
      return function(){ var t=g.home; g.home=g.away; g.away=t; }; },
    reday: function(work){ var g=pick(work); var o=g.day; g.day=pick(['Fri','Sat','Sun']);
      return function(){ g.day=o; }; },
    shiftwk: function(work){ // move ALL of one team's games on a weekend to another weekend (breaks 3-straight/overflow)
      var g=pick(work); var tm=Math.random()<0.5?g.home:g.away; var wk=g.weekend;
      var wg=work.filter(function(x){ return x.weekend===wk && (x.home===tm||x.away===tm) && !x.lockCl; });
      if(!wg.length) return null; var w2=pick(S.weekends); if(w2===wk) return null;
      var undos=[]; wg.forEach(function(x){ var cl=clusterName(x.venue); var v=venueFor(cl,w2); if(!v) return;
        var ow=x.weekend, ov=x.venue; x.weekend=w2; x.venue=v; undos.push(function(){ x.weekend=ow; x.venue=ov; }); });
      if(!undos.length) return null;
      return function(){ for(var i=undos.length-1;i>=0;i--) undos[i](); }; },
    rewire: function(work){ // swap an endpoint between two games, preserving each team's total degree
      var i=rnd(work.length), j=rnd(work.length); if(i===j) return null;
      var g1=work[i], g2=work[j];
      if(g1.lockCl || g2.lockCl) return null; // never rewire locked pairs
      // swap g1.away <-> g2.away if it doesn't create a self-pairing or duplicate structure
      if(g1.home===g2.away || g2.home===g1.away) return null;
      // don't let a rewire create/alter a locked pair (would change that pair's count)
      var LK=S.LOCKS||{};
      if(LK[[g1.home,g2.away].sort().join('|')] || LK[[g2.home,g1.away].sort().join('|')]) return null;
      var o={a1:g1.away,a2:g2.away}; g1.away=o.a2; g2.away=o.a1;
      return function(){ g1.away=o.a1; g2.away=o.a2; }; }
  };
  var MOVE_KEYS = ['reweekend','reweekend','recluster','recluster','homeaway','reday','rewire','shiftwk','shiftwk'];

  // simulated annealing
  S.anneal = function(iters, T0, T1){
    var work = S.work;
    var cur = S.score(work); var curObj = S.obj(cur, work);
    var best = work.map(function(g){return Object.assign({},g);}); var bestObj=curObj; var bestSc=cur;
    var acc=0, imp=0;
    for(var it=0; it<iters; it++){
      var T = T0 * Math.pow(T1/T0, it/iters);
      var mk = pick(MOVE_KEYS);
      var undo = S.MOVES[mk](work);
      if(!undo) continue;
      var sc = S.score(work); var o = S.obj(sc, work);
      var d = o - curObj;
      if(d<=0 || Math.random() < Math.exp(-d/Math.max(T,0.001))){
        curObj=o; cur=sc; acc++;
        if(o<bestObj){ bestObj=o; bestSc=sc; best=work.map(function(g){return Object.assign({},g);}); imp++; }
      } else { undo(); }
    }
    S.work = best.map(function(g){return Object.assign({},g);});
    return {bestObj:Math.round(bestObj), hard:bestSc.hard, soft:bestSc.soft, hbyRule:bestSc.hbyRule, accepted:acc, improved:imp};
  };

  S.venueFor = venueFor;
  // apply a targeted candidate {g,type,val}; returns undo fn or null if infeasible/no-op
  function applyCand(cd){
    var g=cd.g;
    if(cd.type==='cluster'){ if(g.lockCl && cd.val!==g.lockCl) return null; var v=venueFor(cd.val, g.weekend); if(!v||v===g.venue) return null;
      var o=g.venue; g.venue=v; return function(){ g.venue=o; }; }
    if(cd.type==='wk'){ if(cd.val===g.weekend) return null; var cl=clusterName(g.venue);
      var v=venueFor(cl, cd.val); if(!v) return null; var ow=g.weekend, ov=g.venue; g.weekend=cd.val; g.venue=v;
      return function(){ g.weekend=ow; g.venue=ov; }; }
    if(cd.type==='ha'){ var t=g.home; g.home=g.away; g.away=t; return function(){ var t=g.home; g.home=g.away; g.away=t; }; }
    if(cd.type==='clwk'){ if(g.lockCl && cd.val.cl!==g.lockCl) return null; var v=venueFor(cd.val.cl, cd.val.wk); if(!v) return null; var ow=g.weekend, ov=g.venue;
      g.weekend=cd.val.wk; g.venue=v; return function(){ g.weekend=ow; g.venue=ov; }; }
    return null;
  }
  function applyCompound(list){ var undos=[]; for(var i=0;i<list.length;i++){ var u=applyCand(list[i]); if(u) undos.push(u); }
    if(!undos.length) return null; return function(){ for(var i=undos.length-1;i>=0;i--) undos[i](); }; }
  function teamOf(nm){ return S.teams.filter(function(t){return t.name===nm;})[0]; }
  // fly-weekends of a team in `work`: {wk:[games]}
  function flyWksOf(tm, work){ var t=teamOf(tm); var fw={};
    work.forEach(function(g){ if(g.home!==tm&&g.away!==tm) return; var cl=clusterName(g.venue);
      if(cl==='Midway'||cl==='Hardisty') return; if(travelTypeFor(t,cl)==='FLY') (fw[g.weekend]=fw[g.weekend]||[]).push(g); });
    return fw; }
  // greedy targeted repair: read each hard conflict, try relocations of the involved games, apply best improving.
  S.repair = function(rounds, wkSample){
    var work=S.work; var applied=0;
    for(var r=0; r<rounds; r++){
      var sc=S.score(work); if(sc.hard===0) break;
      var curObj=S.obj(sc, work);
      var cands=[];
      sc.list.filter(function(x){return x.sev==='hard';}).forEach(function(c){
        var involved=S.teams.filter(function(t){return c.msg.indexOf(t.name)>=0;}).map(function(t){return t.name;});
        involved.forEach(function(tm){
          var hc=S.homeCl[tm];
          // COMPOUND: for three-straight-weekends, clear the middle weekend of the trio for this team
          if(c.rule==='Three straight weekends'){
            var mm=c.msg.match(/plays ([A-Z][a-z]{2} \d\d), ([A-Z][a-z]{2} \d\d), ([A-Z][a-z]{2} \d\d)/);
            if(mm){ var trio=[mm[1],mm[2],mm[3]];
              // prefer target weekends where this team currently has the FEWEST games (byes first), capped to 6
              var load={}; work.forEach(function(g){ if(g.home===tm||g.away===tm) load[g.weekend]=(load[g.weekend]||0)+1; });
              var targets=S.weekends.filter(function(w){ return trio.indexOf(w)<0; })
                .sort(function(a,b){ return (load[a]||0)-(load[b]||0); }).slice(0,6);
              [trio[1],trio[0],trio[2]].forEach(function(clrWk){
                var wg=work.filter(function(g){ return g.weekend===clrWk && (g.home===tm||g.away===tm); });
                if(!wg.length) return;
                targets.forEach(function(w2){
                  cands.push({type:'multi', list: wg.map(function(g){ return {g:g,type:'clwk',val:{cl:clusterName(g.venue),wk:w2}}; })}); });
              });
            }
          }
          // COMPOUND: for flight trouble (over cap, undersized, repeat-region), relocate/merge whole fly-weekends
          if(c.rule==='Too many flights' || c.rule==='Repeat-region flight' || c.rule==='Flight <4 games'){
            var fw=flyWksOf(tm, work);
            Object.keys(fw).forEach(function(wk){
              cands.push({type:'multi', list: fw[wk].map(function(g){ return {g:g,type:'cluster',val:hc}; })}); // host whole wk at home
              cands.push({type:'multi', list: fw[wk].map(function(g){ return {g:g,type:'cluster',val:'Midway'}; })}); // whole wk to Midway
              // merge this fly-weekend into another fly-weekend of same team (bundles undersized trips to 4)
              Object.keys(fw).forEach(function(wk2){ if(wk2!==wk) cands.push({type:'multi', list: fw[wk].map(function(g){ return {g:g,type:'wk',val:wk2}; })}); });
            });
          }
          var gs=work.filter(function(g){ return (c.wk? g.weekend===c.wk : (g.home===tm||g.away===tm)) && (g.home===tm||g.away===tm); });
          gs.forEach(function(g){
            cands.push({g:g,type:'cluster',val:hc});                 // host at team's home
            cands.push({g:g,type:'cluster',val:S.homeCl[g.home===tm?g.away:g.home]}); // host at opponent home
            cands.push({g:g,type:'cluster',val:'Midway'});
            cands.push({g:g,type:'cluster',val:'Hardisty'});
            cands.push({g:g,type:'ha'});
            var oppHc = S.homeCl[g.home===tm?g.away:g.home];
            // cap the weekend sample to the team's emptiest weekends (keeps repair fast)
            var sample = wkSample;
            if(!sample){ var ld={}; work.forEach(function(x){ if(x.home===tm||x.away===tm) ld[x.weekend]=(ld[x.weekend]||0)+1; });
              sample = S.weekends.slice().sort(function(a,b){ return (ld[a]||0)-(ld[b]||0); }).slice(0,7); }
            sample.forEach(function(w2){ if(w2!==g.weekend){ cands.push({g:g,type:'wk',val:w2});
              cands.push({g:g,type:'clwk',val:{cl:hc,wk:w2}});           // team's home on another weekend
              cands.push({g:g,type:'clwk',val:{cl:oppHc,wk:w2}}); } });   // opponent's home on another weekend
          });
        });
      });
      function applyAny(cd){ return cd.type==='multi' ? applyCompound(cd.list) : applyCand(cd); }
      // first-improvement: apply the first candidate that improves the objective, then next round (fast)
      var appliedThis=false;
      for(var i=0;i<cands.length;i++){ var undo=applyAny(cands[i]); if(!undo) continue;
        var o=S.obj(S.score(work), work); var gain=curObj-o;
        if(gain>0.5){ applied++; appliedThis=true; break; }   // keep it applied
        undo(); }
      if(!appliedThis) break;
    }
    var f=S.score(work); return {hard:f.hard, soft:f.soft, hbyRule:f.hbyRule, applied:applied, bal:Math.round(S.balance(work))};
  };
  // Unconditionally drive every team to its flight cap by rehoming its smallest fly-weekends
  // to home ice (opponents then travel). Breaks the local minimum; re-anneal cleans up fallout.
  function teamGamesOn(nm, wk, work){ var n=0; work.forEach(function(g){ if(g.weekend===wk&&(g.home===nm||g.away===nm)) n++; }); return n; }
  S.forceFlightCap = function(){
    var work=S.work; var changed=0;
    S.teams.forEach(function(t){
      var homeWks = S.weekends.filter(function(w){ return venueFor(t.homeCluster, w); }); // weekends home cluster has ice
      var isWpg = t.homeCluster==='Winnipeg';
      var guard=0;
      while(guard++<12){
        var fw={};
        work.forEach(function(g){ if(g.home!==t.name&&g.away!==t.name) return; if(g.lockCl) return; var cl=clusterName(g.venue);
          if(cl==='Midway'||cl==='Hardisty') return; if(travelTypeFor(t,cl)!=='FLY') return;
          if(isWpg && CLUSTER_REGION[cl]!=='BC') return;   // Winnipeg only capped on BC trips
          (fw[g.weekend]=fw[g.weekend]||[]).push(g); });
        var wks=Object.keys(fw); var rgc=CLUSTER_REGION[t.homeCluster]; var cap = isWpg ? 1 : ((rgc==='BC'||rgc==='AB')?4:3);
        if(wks.length<=cap) break;
        wks.sort(function(a,b){ return fw[a].length-fw[b].length; }); // smallest first
        var wk=wks[0], moved=false;
        fw[wk].forEach(function(g){
          var v=venueFor(t.homeCluster, g.weekend);
          if(v){ g.venue=v; changed++; moved=true; return; }        // host in place at home
          // home cluster has no ice this weekend (e.g. Winnipeg off-window): relocate to a home-ice weekend
          var cands=homeWks.slice().sort(function(a,b){ return teamGamesOn(t.name,a,work)-teamGamesOn(t.name,b,work); });
          for(var i=0;i<cands.length;i++){ if(teamGamesOn(t.name,cands[i],work)<4){ g.weekend=cands[i]; g.venue=venueFor(t.homeCluster,cands[i]); changed++; moved=true; break; } }
        });
        if(!moved) break;
      }
    });
    return {changed:changed, after:S.score(work).hbyRule};
  };
  // move any game whose team is ineligible for its neutral venue (Midway/Hardisty) to a legal cluster
  S.fixNeutral = function(){
    var work=S.work; var changed=0;
    function elig(nm,cl){ var c=S.homeCl[nm];
      if(cl==='Midway') return c==='Lower Mainland'||c==='Calgary-area'||/purcell/i.test(nm);
      if(cl==='Hardisty') return c==='Aberdeen'||c==='Calgary-area'||c==='Edmonton';
      return true; }
    work.forEach(function(g){ if(g.lockCl) return; var cl=clusterName(g.venue);
      if(cl!=='Midway'&&cl!=='Hardisty') return;
      if(elig(g.home,cl)&&elig(g.away,cl)) return;
      var opts=[S.homeCl[g.home], S.homeCl[g.away], 'Calgary-area'];
      for(var i=0;i<opts.length;i++){ var v=venueFor(opts[i], g.weekend); if(v){ g.venue=v; changed++; return; } }
    });
    return {changed:changed};
  };
  // deterministic ice cleanup: any held venue/day booked over its capacity spills the excess games
  // to a same-city To-Source placeholder (uncapped, always sourceable).
  S.cleanupIce = function(){
    var work=S.work; var moved=0; var groups={};
    work.forEach(function(g){ if(!g.day) return; (groups[g.weekend+'␟'+g.venue+'␟'+g.day]=groups[g.weekend+'␟'+g.venue+'␟'+g.day]||[]).push(g); });
    Object.keys(groups).forEach(function(k){ var p=k.split('␟'); var wk=p[0], vn=p[1], day=p[2];
      var v=DATA.venues.find(function(x){return x.weekend===wk&&x.venue===vn;});
      if(!v) return; var cap=({Fri:v.capFri,Sat:v.capSat,Sun:v.capSun}[day])||0;
      var gs=groups[k]; if(gs.length<=cap) return;
      var cl=clusterName(vn); if(cl==='Midway'||cl==='Hardisty') return; // don't dilute neutrals
      if((CFG.noNewIce||[]).indexOf(cl)>=0) return; // can't source (Winnipeg/Kimberley/GP): leave for solver
      var city=vn.split(/\s*[—–-]\s*/)[0].trim(); var toSrc=city+' — To Source';
      for(var i=cap;i<gs.length;i++){ if(gs[i].venue!==toSrc){ gs[i].venue=toSrc; moved++; } } });
    return {moved:moved};
  };
  function fmtT(m){ var h=Math.floor(m/60), mn=m%60; return (h<10?'0':'')+h+':'+(mn<10?'0':'')+mn; }
  // assign start/end times per (weekend,venue,day): pack across available sheets, keep each team's
  // same-day games >= rest gap apart, within the day window.
  S.assignTimes = function(work, others){
    work = work || S.work; others = others || [];
    var DAYSTART=8*60, DAYEND=22*60+45, BUF=(CFG.bufferMin||15);
    // other divisions' exact start-time occupancy per shared venue (to dodge cross-division sheet clashes)
    var occ={}; others.forEach(function(g){ if(g.day&&g.time){ var kk=g.weekend+'␟'+g.venue+'␟'+g.day+'␟'+g.time; occ[kk]=(occ[kk]||0)+1; } });
    var days={};
    work.forEach(function(g){ if(!g.day||!g.weekend) return; var k=g.weekend+'␟'+g.day; (days[k]=days[k]||[]).push(g); });
    Object.keys(days).forEach(function(k){ var p=k.split('␟'); var wk=p[0], day=p[1]; var gs=days[k];
      var sheetFree={};   // venue -> [next-free per sheet]
      var teamLast={};    // team -> last start (shared across venues this day)
      gs.forEach(function(g){
        var slot=Math.round(slotHours(g.division)*60);
        var rest=(g.division==='19U AAA')?0:((CFG.restHours[g.division]||3)*60);
        var sheets=Math.max(1,sheetsForVenueDay(wk,g.venue,day));
        if(!sheetFree[g.venue]){ var arr=[]; for(var i=0;i<sheets;i++)arr.push(DAYSTART); sheetFree[g.venue]=arr; }
        var sf=sheetFree[g.venue];
        var t=DAYSTART, placed=false, guard=0;
        while(!placed && guard++<600){
          var busyMine=0, si=-1; for(var i=0;i<sf.length;i++){ if(sf[i]>t) busyMine++; else if(si<0) si=i; }
          var othersAtT = occ[wk+'␟'+g.venue+'␟'+day+'␟'+fmtT(t)]||0;   // other divisions at this exact start time
          var hOk = teamLast[g.home]==null || (t-teamLast[g.home])>=rest;
          var aOk = teamLast[g.away]==null || (t-teamLast[g.away])>=rest;
          // place if a sheet is free (si>=0) AND my-busy + other-divisions at t stays within sheets AND both teams rested
          if(si>=0 && (busyMine + othersAtT) < sheets && hOk && aOk){ g.time=fmtT(t); g.endTime=fmtT(t+slot);
            sf[si]=t+slot+BUF; teamLast[g.home]=t; teamLast[g.away]=t; placed=true; }
          else { t+=15; if(t>DAYEND){ g.time=fmtT(DAYSTART); g.endTime=fmtT(DAYSTART+slot); placed=true; } }
        }
      });
    });
    return work;
  };
  // full-context ice cleanup: given the OTHER divisions' (fixed) games, spill any of this division's
  // games that overbook a shared held venue/day (or collide in a slot) onto same-city To-Source ice.
  S.cleanupIceFull = function(others){
    var work=S.work; var moved=0;
    var occDay={};   // wk|venue|day -> count from other divisions
    others.forEach(function(g){ if(!g.day) return; var k=g.weekend+'␟'+g.venue+'␟'+g.day; occDay[k]=(occDay[k]||0)+1; });
    var groups={};
    work.forEach(function(g){ if(!g.day) return; var k=g.weekend+'␟'+g.venue+'␟'+g.day; (groups[k]=groups[k]||[]).push(g); });
    Object.keys(groups).forEach(function(k){ var p=k.split('␟'); var wk=p[0], vn=p[1], day=p[2];
      var cl=clusterName(vn); if(cl==='Midway'||cl==='Hardisty') return;
      if((CFG.noNewIce||[]).indexOf(cl)>=0) return;   // can't source (Winnipeg etc.) — leave held
      var v=DATA.venues.find(function(x){return x.weekend===wk&&x.venue===vn;});
      if(!v) return;                                    // already a To-Source/unknown: no cap
      var cap=({Fri:v.capFri,Sat:v.capSat,Sun:v.capSun}[day])||0;
      var used=occDay[k]||0;                            // slots taken by other divisions
      var allowed=Math.max(0, cap-used);
      var gs=groups[k];
      if(gs.length>allowed){ var city=vn.split(/\s*[—–-]\s*/)[0].trim(); var toSrc=city+' — To Source';
        for(var i=allowed;i<gs.length;i++){ if(gs[i].venue!==toSrc){ gs[i].venue=toSrc; gs[i].time=''; gs[i].endTime=''; moved++; } } }
    });
    return {moved:moved};
  };
  S.current = function(){ return S.score(S.work); };
  S.getWork = function(){ return S.work; };
  return S;
})();
