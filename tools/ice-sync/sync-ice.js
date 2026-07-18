/* FSL ice-allocation sync — reads the ICE ALLOCATION BIBLE and produces ice-allocation.json.
   Run: node sync-ice.js <biblePath> <outJsonPath> <isoTimestamp>
   (timestamp passed in because schedulers, not the script, own "now"). */
const XLSX = require('xlsx');
const fs = require('fs');

const BIBLE = process.argv[2];
const OUT = process.argv[3];
const STAMP = process.argv[4] || 'unknown';

// --- Bible city|arena -> app canonical venue name. Ambiguous ones noted in ASSUMPTIONS. ---
const VENUE_MAP = {
  'Abbotsford|Rinks at Summit Centre':'Abbotsford — Rinks at Summit Center',
  'Aberdeen|Aberdeen Rec Center':'Aberdeen — Aberdeen Rec Center',
  'Banff|Fenlands Arena':'Banff — Fenlands Arena',
  'Calgary|7 Chiefs':'Calgary — 7 Chiefs Sportsplex (JPHL Contract)',
  'Calgary|Calgary East':'Calgary — Calgary East Arena',
  'Calgary|Father David Bauer':'Calgary — Father David Bauer Arena',
  'Calgary|Great Plains Rec Centre':'Calgary — GPRC',
  'Canmore|Town of Canmore':'Canmore — Canmore Arena',
  'Cochrane|SLS Centre':'Cochrane — SLS Center',
  'Delta|Planet Ice Delta':'Delta — Planet Ice Delta',
  'Edmonton|SISE HATCH CO':'Edmonton — Silent Ice Center (Hatch+Hesco)',
  'Edmonton|SISE HESCO':'Edmonton — Silent Ice Center (Hatch+Hesco)',
  'Edmonton|SISE Morinville':'Edmonton — Morinville Silent Ice Gardens',
  'Edmonton|SISE-Morinville':'Edmonton — Morinville Silent Ice Gardens',
  'Kimberley|Civic Center':'Kimberley — Civic Centre',
  'Lloydminster|Archie Miller':'Lloydminster — Archie Miller Arena',
  'Lloydminster|Servus Sports Centre':'Lloydminster — Servus Sports Center',
  'Morinville|SISE Morinville':'Edmonton — Morinville Silent Ice Gardens',
  'Spruce Grove|Heavy Metal Place':'Spruce Grove - Heavy Metal Place',
  'Winnipeg|7 Oaks':'Winnipeg — 7 Oaks Arena'
};
const ASSUMPTIONS = [
  'Both "SISE HATCH CO" and "SISE HESCO" map to "Edmonton — Silent Ice Center (Hatch+Hesco)".',
  'All Morinville variants map to "Edmonton — Morinville Silent Ice Gardens".'
];

// --- Season weekend Fridays (month is 0-indexed). ---
const WEEKENDS = [
  ['Sep 11',[2026,8,11]],['Sep 18',[2026,8,18]],['Sep 25',[2026,8,25]],
  ['Oct 02',[2026,9,2]],['Oct 09',[2026,9,9]],['Oct 16',[2026,9,16]],['Oct 23',[2026,9,23]],['Oct 30',[2026,9,30]],
  ['Nov 06',[2026,10,6]],['Nov 13',[2026,10,13]],['Nov 20',[2026,10,20]],['Nov 27',[2026,10,27]],
  ['Dec 04',[2026,11,4]],['Dec 11',[2026,11,11]],
  ['Jan 02',[2027,0,2]],['Jan 08',[2027,0,8]],['Jan 15',[2027,0,15]],['Jan 22',[2027,0,22]],['Jan 29',[2027,0,29]],
  ['Feb 05',[2027,1,5]],['Feb 12',[2027,1,12]],['Feb 19',[2027,1,19]]
];
const DAYNAMES = ['Fri','Sat','Sun'];

function serialToUTC(s){ return new Date(Date.UTC(1899,11,30) + Math.round(s)*86400000); }
function fracToHHMM(f){ let mins=Math.round(f*24*60); let h=Math.floor(mins/60), m=mins%60;
  return String(h).padStart(2,'0')+':'+String(m).padStart(2,'0'); }
// The Bible's Date column is mixed: some cells are real Excel dates (serials), most are
// text in US M/D/YYYY format. Handle both. Returns a UTC Date or null.
function parseDate(v){
  if(typeof v==='number' && isFinite(v)) return serialToUTC(v);
  if(typeof v==='string'){
    const m=v.trim().match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if(m){ let mo=+m[1], da=+m[2], yr=+m[3]; if(yr<100) yr+=2000; return new Date(Date.UTC(yr,mo-1,da)); }
  }
  return null;
}
// Start time is a day-fraction (real Excel time) or a string like "6:45 PM". Returns "HH:MM".
function parseTime(v){
  if(typeof v==='number' && isFinite(v)) return fracToHHMM(v);
  if(typeof v==='string'){
    const s=v.trim();
    if(/^tbd$/i.test(s)) return 'TBD';   // ice is held but the time isn't set yet
    const m=s.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])?$/);
    if(m){ let h=+m[1], mi=+m[2]; const ap=(m[3]||'').toUpperCase();
      if(ap==='PM'&&h<12) h+=12; if(ap==='AM'&&h===12) h=0;
      return String(h).padStart(2,'0')+':'+String(mi).padStart(2,'0'); }
  }
  return '??:??';
}
function weekendFor(dateUTC){
  for(const [key,[y,mo,d]] of WEEKENDS){
    const fri=Date.UTC(y,mo,d);
    const idx=Math.round((dateUTC.getTime()-fri)/86400000);
    if(idx>=0 && idx<=2) return {weekend:key, day:DAYNAMES[idx]};
  }
  return null;
}

// --- Read the Bible (raw serials + time fractions). ---
const wb = XLSX.readFile(BIBLE, {cellDates:false});
const ws = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(ws, {header:1, raw:true, defval:''}).slice(1).filter(r=>r[0]!=='' && r[0]!=null);

const alloc={};              // weekend -> venue -> {Fri:[],Sat:[],Sun:[]}
const slotKeys=new Set();    // "weekend|venue|day|time" for diffing
const unmappedVenues=new Set();
const badRows=[];              // genuinely unparseable rows — surfaced as a safety net
let outOfSeasonSkipped=0;      // ice outside the season (Alpine Cup Dec 17-20, after Feb 21) — dropped, not listed
let placed=0;

for(const r of rows){
  const [dateVal, city, arena, iceSurface, startVal] = r;
  const dUTC=parseDate(dateVal);
  if(!dUTC){ badRows.push('(bad date) '+JSON.stringify(r.slice(0,4))); continue; }
  const wd=weekendFor(dUTC);
  if(!wd){ outOfSeasonSkipped++; continue; }   // not on any FSL weekend -> out of season, drop silently
  const vk=city+'|'+arena;
  let venue=VENUE_MAP[vk];
  if(!venue){ venue=city+' — '+arena; unmappedVenues.add(vk); }
  const time=parseTime(startVal);
  (alloc[wd.weekend]=alloc[wd.weekend]||{});
  (alloc[wd.weekend][venue]=alloc[wd.weekend][venue]||{Fri:[],Sat:[],Sun:[]});
  alloc[wd.weekend][venue][wd.day].push(time);
  slotKeys.add(wd.weekend+'|'+venue+'|'+wd.day+'|'+time);
  placed++;
}
// sort slot times within each day
for(const w in alloc) for(const v in alloc[w]) for(const d of DAYNAMES) alloc[w][v][d].sort();

// --- Diff against previous sync to find NEW slots. First run = baseline (nothing flagged). ---
let prevKeys=new Set(), isBaseline=true;
if(fs.existsSync(OUT)){
  try{ const prev=JSON.parse(fs.readFileSync(OUT,'utf8')); if(Array.isArray(prev.slotKeys)){ prevKeys=new Set(prev.slotKeys); isBaseline=false; } }catch(e){}
}
const newThisSync = isBaseline ? [] : [...slotKeys].filter(k=>!prevKeys.has(k)).sort();
const removedThisSync = isBaseline ? [] : [...prevKeys].filter(k=>!slotKeys.has(k)).sort();
// contentChanged = the ice actually differs from the last sync (added or removed slots), so
// the automation can commit/push only on real changes (not on every timestamp bump).
const contentChanged = isBaseline || newThisSync.length>0 || removedThisSync.length>0;

const output={
  generatedAt: STAMP,
  source: 'ICE ALLOCATION BIBLE.xlsx',
  totalSlots: placed,
  weekends: alloc,
  newThisSync,
  removedThisSync,
  contentChanged,
  isBaseline,
  slotKeys: [...slotKeys].sort(),          // used by the next run's diff
  unmappedVenues: [...unmappedVenues].sort(),
  outOfSeasonSkipped,
  badRows,
  assumptions: ASSUMPTIONS
};
fs.writeFileSync(OUT, JSON.stringify(output,null,2));

// --- Console summary ---
console.log('Bible rows read      :', rows.length);
console.log('Slots placed         :', placed);
console.log('Weekends covered     :', Object.keys(alloc).length, '('+Object.keys(alloc).join(', ')+')');
console.log('Distinct venues      :', new Set([].concat(...Object.values(alloc).map(v=>Object.keys(v)))).size);
console.log('Unmapped venues      :', output.unmappedVenues.length, JSON.stringify(output.unmappedVenues));
console.log('Out-of-season skipped:', outOfSeasonSkipped, '| bad rows:', badRows.length);
console.log('Baseline (first run) :', isBaseline, '| new:', newThisSync.length, '| removed:', removedThisSync.length);
console.log('Wrote                :', OUT);
console.log('CONTENT_CHANGED=' + (contentChanged ? 'yes' : 'no'));   // read by the automation wrapper
