/* FSL Bible write-back — the reverse of sync-ice.js.
 *
 * sync-ice.js reads the ICE ALLOCATION BIBLE and produces ice-allocation.json for the app.
 * This does the other direction: ice she added by hand in the Control Room is written INTO the
 * Bible, and every rink's Ice Surface is normalised to the exact name in the RAMP arena registry.
 *
 *   node bible-writeback.js <BIBLE.xlsx> [--apply]
 *
 * Without --apply it only reports (a dry run). With --apply it backs the Bible up first, then
 * writes. Refuses to touch a Bible that Excel has open.
 *
 * WHY THE ICE SURFACE COLUMN CARRIES THE REGISTRY NAME
 * The Bible already works this way for Edmonton ("SISE HATCH CO" / "Silent Ice Center - Hatch Co.
 * Arena"), Kimberley and Lloydminster: City+Arena identify the building, and Ice Surface names the
 * individual sheet. The registry is also per-sheet, and the app carries Ice Surface through to a
 * game's `sheet`, which is what the RAMP export matches on. So normalising Ice Surface — and
 * leaving City/Arena alone — lines the Bible up with RAMP without disturbing VENUE_MAP or anything
 * else on the read path.
 */
'use strict';
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const https = require('https');

const BIBLE = process.argv[2];
const APPLY = process.argv.includes('--apply');
if (!BIBLE) { console.error('usage: node bible-writeback.js <BIBLE.xlsx> [--apply]'); process.exit(2); }

const FIRESTORE = 'https://firestore.googleapis.com/v1/projects/western-canadian-champio-a32ef/databases/(default)/documents/schedules/fsl-shared?key=AIzaSyB-nKg7FKvY78D79tPicdHeYYfYuso5X3A';

/* ---- The RAMP arena registry (her selectedLocations export), keyed by the Bible's own
   City | Arena | Ice Surface. Only rinks that exist in the registry appear here; anything absent
   is deliberately left untouched rather than guessed at. ---------------------------------- */
const SURFACE_TO_REGISTRY = {
  'Abbotsford|Rinks at Summit Centre|East Rink'            : 'The Rinks at Summit Centre East Rink',
  'Abbotsford|Rinks at Summit Centre|West Rink'            : 'The Rinks at Summit Centre West Rink',
  'Aberdeen|Aberdeen Rec Center|Ice Surface TBD'           : 'Aberdeen Recreation Complex',
  'Banff|Fenlands Arena|Fenlands Arena 1'                  : 'Banff Recreation Centre - Arena 1',
  'Calgary|7 Chiefs|Rink 1'                                : '7 Chiefs Sportsplex & Jim Starlight Centre (1)',
  'Calgary|7 Chiefs|Rink 2'                                : '7 Chiefs Sportsplex & Jim Starlight Centre (2)',
  'Calgary|Great Plains Rec Centre|Rink 1'                 : 'Great Plains Arena 1',
  'Calgary|Great Plains Rec Centre|Rink 2'                 : 'Great Plains Arena 2',
  'Cochrane|SLS Centre|Totem 1'                            : 'SLS Centre - Totem 1',
  'Cochrane|SLS Centre|Totem 2'                            : 'SLS Centre - Totem 2',
  'Cochrane|SLS Centre|Totem 3'                            : 'SLS Centre - Totem 3',
  'Coquitlam|Planet Ice|Rink 3'                            : 'Planet Ice - Total Sport Entertainment (Ice 3)',
  'Coquitlam|Planet Ice|Rink 4'                            : 'Planet Ice - Total Sport Entertainment (Ice 4)',
  'Cowichan|Shawnigan Lake Arena|'                         : 'Shawnigan Lake School Arena',
  'Delta|Planet Ice Delta|American Rink'                   : 'Planet Ice - Delta - American',
  'Delta|Planet Ice Delta|Canadian Rink'                   : 'Planet Ice - Delta - Canadian',
  'Delta|Planet Ice Delta|International Rink'              : 'Planet Ice - Delta - International',
  'Delta|Planet Ice Delta|Legends Rink'                    : 'Planet Ice - Delta - Legends',
  'Edmonton|SISE HATCH CO|Silent Ice Center - Hatch Co. Arena' : 'Silent Ice Center - Hatch Co. Arena',
  'Edmonton|SISE HESCO|Silent Ice Center - Hesco Arena'    : 'Silent Ice Center - Hesco Arena',
  'Edmonton|SISE Morinville|Morinville Silent Ice Gardens' : 'Morinville Silent Ice Gardens',
  'Edmonton|SISE Morinville|Silent Ice Center - Morinville Gardens' : 'Morinville Silent Ice Gardens',
  'Edmonton|SISE-Morinville|Morinville Silent Ice Gardens' : 'Morinville Silent Ice Gardens',
  'Morinville|SISE Morinville|Morinville Silent Ice Gardens': 'Morinville Silent Ice Gardens',
  'Kimberley|Civic Center|Kimberley Civic Center'          : 'Kimberley Civic Centre',
  'Lloydminster|Archie Miller|Archie Miller'               : 'Archie Miller Arena',
  'Lloydminster|Servus Sports Centre|Holmes Arena'         : 'Servus Sports Centre Robert B. Holmes Arena',
  'Lloydminster|Servus Sports Centre|Rusway Arena'         : 'Servus Sports Centre Rusway Arena',
  'Spruce Grove|Heavy Metal Place|CBRA'                    : 'Community Arena - Heavy Metal Place',
  'Spruce Grove|Heavy Metal Place|TFA'                     : 'Thompson Family Arena - Heavy Metal Place',
  'Winnipeg|Seven Oaks Sportsplex|Blue Rink'               : 'Seven Oaks Arena - Blue',
  'Winnipeg|Seven Oaks Sportsplex|Red Rink'                : 'Seven Oaks Arena - Red',
  // She confirmed Calgary East Twin is the RED sheet. The registry export lists only the Blue
  // arena, so this name has to be added in RAMP for these to import.
  'Calgary|Calgary East Arena|Red Arena'                   : 'East Calgary Twin Arena Red'
};

/* Rinks with no registry entry — recorded so the report can say "left alone on purpose" rather
   than leaving them looking overlooked. */
const NO_REGISTRY_ENTRY = new Set([
  'Calgary|Father David Bauer|Father David Bauer Arena',   // NOT the registry's Vancouver "UBC Father Bauer"
  'Canmore|Town of Canmore|Alex Kaleta Arena',
  'Canmore|Town of Canmore|Thelma Crowe Arena',
  'Edmonton|Downtown Community Arena|Downtown Community Arena',
  'Grande Prairie|Bonnetts Energy Centre|BEC | Arena',
  'Calgary|7 Chiefs|TBD'                                   // surface not decided yet — can't pick (1) or (2)
]);

/* ---- App slot -> Bible row, keyed by the app's venue AND its recorded surface.
 *
 * Keyed on BOTH because the surface decides which Bible arena a slot belongs to: at Silent Ice,
 * a "Hatch" surface belongs under SISE HATCH CO and a "Hesco" one under SISE HESCO, even though
 * the app files both against one venue.
 *
 * Every pair present in the app is listed. Anything not listed is SKIPPED and reported rather
 * than written — a wrong building in the Bible is far worse than a missing row. `null` marks the
 * pairs deliberately excluded, with the reason.
 *
 * Value = [Bible City, Bible Arena, Ice Surface] where Ice Surface is already the RAMP registry
 * name, so an appended row can't reintroduce a spelling the rename pass just removed. ------ */
const SUMMIT_E = ['Abbotsford', 'Rinks at Summit Centre', 'The Rinks at Summit Centre East Rink'];
const SUMMIT_W = ['Abbotsford', 'Rinks at Summit Centre', 'The Rinks at Summit Centre West Rink'];
const MORINVILLE = ['Edmonton', 'SISE Morinville', 'Morinville Silent Ice Gardens'];
const DOWNTOWN = ['Edmonton', 'Downtown Community Arena', 'Downtown Community Arena'];

const APP_SLOT_TO_BIBLE = {
  'Abbotsford - Rinks at Summit Centre||East Rink'          : SUMMIT_E,
  'Abbotsford - Summit Centre||East Rink'                   : SUMMIT_E,
  'Abbotsford - Summit Centre||West Rink'                   : SUMMIT_W,
  'Abbotsford - The Rinks at Summit Centre||East Rink'      : SUMMIT_E,
  'Abbotsford - The Rinks at Summit Centre||West Rink'      : SUMMIT_W,
  'Abbotsford — Rinks at Summit Center||East Rink'          : SUMMIT_E,
  'Abbotsford — Rinks at Summit Center||West Rink'          : SUMMIT_W,
  'Abbotsford — Summit Center (user ice)||East Rink'        : SUMMIT_E,
  'Abbotsford — Summit Center (user ice)||West Rink'        : SUMMIT_W,
  'Calgary — GPRC||Rink 1'                                  : ['Calgary', 'Great Plains Rec Centre', 'Great Plains Arena 1'],
  'Calgary — GPRC||Rink 2'                                  : ['Calgary', 'Great Plains Rec Centre', 'Great Plains Arena 2'],
  'Cochrane - SLS Centre||Totem 1'                          : ['Cochrane', 'SLS Centre', 'SLS Centre - Totem 1'],
  'Cochrane - SLS Centre||Totem 2'                          : ['Cochrane', 'SLS Centre', 'SLS Centre - Totem 2'],
  'Cochrane - SLS Centre||Totem 3'                          : ['Cochrane', 'SLS Centre', 'SLS Centre - Totem 3'],
  'Cochrane - SLS Centre (2 Sheets)||Totem 1'               : ['Cochrane', 'SLS Centre', 'SLS Centre - Totem 1'],
  'Cochrane - SLS Centre (2 Sheets)||Totem 2'               : ['Cochrane', 'SLS Centre', 'SLS Centre - Totem 2'],
  'Coquitlam — Planet Ice||3'                               : ['Coquitlam', 'Planet Ice', 'Planet Ice - Total Sport Entertainment (Ice 3)'],
  // building certain, pad not chosen yet — blank is honest, and the Bible already does this
  'Coquitlam — Planet Ice||'                                : ['Coquitlam', 'Planet Ice', ''],
  // single-sheet buildings: no surface recorded is unambiguous
  'Cowichan — Shawnigan Lake Arena||'                       : ['Cowichan', 'Shawnigan Lake Arena', 'Shawnigan Lake School Arena'],
  'Edmonton — Morinville Silent Ice Gardens||'              : MORINVILLE,
  'Edmonton - Downtown Community Arena||Downtown Community Arena' : DOWNTOWN,
  'Edmonton — Downtown Community Arena||Downtown Community Arena' : DOWNTOWN,
  'Edmonton - Morinville Silent Ice Gardens||Morinville Silent Ice Gardens' : MORINVILLE,
  'Edmonton — Morinville Silent Ice Gardens||Morinville Silent Ice Gardens' : MORINVILLE,
  'Morinville - Silent Ice Gardens||Morinville Silent Ice Gardens'          : MORINVILLE,
  // the surface, not the venue label, decides which Silent Ice arena this is
  'Edmonton — Silent Ice Center (Hatch+Hesco)||Silent Ice Center - Hatch Co. Arena' : ['Edmonton', 'SISE HATCH CO', 'Silent Ice Center - Hatch Co. Arena'],
  'Edmonton — Silent Ice Center - Hesco||Hesco Arena'       : ['Edmonton', 'SISE HESCO', 'Silent Ice Center - Hesco Arena'],
  'Kimberley — Civic Centre (user ice)||Kimberley Civic Center' : ['Kimberley', 'Civic Center', 'Kimberley Civic Centre'],

  // ---- deliberately NOT written -------------------------------------------------------
  // Venue says Morinville, surface names a different building. She ruled: leave these out of
  // the Bible and fix the venue in the app first. Morinville and Downtown Community Arena are
  // two separate locations.
  'Edmonton — Morinville Silent Ice Gardens||Downtown Community Arena' : null,
  'Edmonton — Morinville Silent Ice Gardens||SISE HATCH'              : null,
  // same shape: venue says Hesco, surface says Hatch
  'Edmonton — Silent Ice Center - Hesco||Hatch Arena'                 : null,
  // "Delta/Coquitlam" is one venue record standing for two different buildings
  'Delta/Coquitlam - Planet Ice||Planet Ice Coquitlam'                : null,
  'Delta/Coquitlam - Planet Ice||Planet Ice Delta'                    : null,
  // no Bible city/arena and no registry entry
  'Calgary - Norma Bush||Norma Bush Arena'                            : null,
  'Fox Creek - Greenview Multiplex||'                                 : null,
  'Fox Creek - TBD||'                                                 : null,
  // registry has Seven Oaks Blue and Red only — "Rink 1" matches neither
  'Winnipeg — 7 Oaks Arena||7 Oaks Arena - Rink 1'                    : null
};

/* Weekend key -> that weekend's Friday. Anchors on the real weekday so Jan 02 (a Sat-Sun weekend)
   still resolves its Friday to Jan 1. Mirrors the app's own helper. */
const WKDISPLAY = {
  'Sep 11':'Sep 11, 2026','Sep 18':'Sep 18, 2026','Sep 25':'Sep 25, 2026','Oct 02':'Oct 2, 2026',
  'Oct 09':'Oct 9, 2026','Oct 16':'Oct 16, 2026','Oct 23':'Oct 23, 2026','Oct 30':'Oct 30, 2026',
  'Nov 06':'Nov 6, 2026','Nov 13':'Nov 13, 2026','Nov 20':'Nov 20, 2026','Nov 27':'Nov 27, 2026',
  'Dec 04':'Dec 4, 2026','Dec 11':'Dec 11, 2026','Jan 02':'Jan 2, 2027','Jan 08':'Jan 8, 2027',
  'Jan 15':'Jan 15, 2027','Jan 22':'Jan 22, 2027','Jan 29':'Jan 29, 2027','Feb 05':'Feb 5, 2027',
  'Feb 12':'Feb 12, 2027','Feb 19':'Feb 19, 2027'
};
const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function fridayOf(wk) {
  const s = WKDISPLAY[wk]; if (!s) return null;
  const m = /^([A-Za-z]{3})\s+(\d{1,2}),\s*(\d{4})$/.exec(s); if (!m) return null;
  const mi = MON.indexOf(m[1]); if (mi < 0) return null;
  const d = new Date(Date.UTC(+m[3], mi, +m[2]));
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() - 5 + 7) % 7));
  return d;
}
function dateFor(wk, day) {
  const f = fridayOf(wk), off = { Fri:0, Sat:1, Sun:2, Mon:3 }[day];
  if (!f || off == null) return null;
  return new Date(f.getTime() + off * 86400000);
}
// Excel serial for a UTC date (1900 system, with the historical leap-year offset).
const excelSerial = d => Math.round(d.getTime() / 86400000) + 25569;
const dayFrac = hhmm => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || '').trim());
  return m ? ((+m[1]) * 60 + (+m[2])) / 1440 : null;
};

const getJson = url => new Promise((res, rej) => {
  https.get(url, r => { let b = ''; r.on('data', c => b += c); r.on('end', () => { try { res(JSON.parse(b)); } catch (e) { rej(e); } }); }).on('error', rej);
});

(async () => {
  // Excel keeps a ~$ lock file open next to the workbook.
  const lock = path.join(path.dirname(BIBLE), '~$' + path.basename(BIBLE));
  if (fs.existsSync(lock)) {
    console.error('Bible is open in Excel (' + path.basename(lock) + ') — close it and re-run.');
    process.exit(1);
  }

  const wb = XLSX.readFile(BIBLE, { cellDates: false });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });
  const header = rows[0];
  console.log('Bible: ' + (rows.length - 1) + ' data rows, header ' + JSON.stringify(header));

  /* ---- 1. normalise Ice Surface to the registry name ---------------------------------- */
  const renames = new Map(), skipped = new Map(), unknown = new Map();
  rows.slice(1).forEach(r => {
    const c = String(r[1] || '').trim(), a = String(r[2] || '').trim(), s = String(r[3] || '').trim();
    if (!c && !a) return;
    const k = `${c}|${a}|${s}`;
    const to = SURFACE_TO_REGISTRY[k];
    if (to) { if (to !== s) renames.set(k + ' -> ' + to, (renames.get(k + ' -> ' + to) || 0) + 1); }
    else if (NO_REGISTRY_ENTRY.has(k)) skipped.set(k, (skipped.get(k) || 0) + 1);
    else unknown.set(k, (unknown.get(k) || 0) + 1);
  });

  console.log('\n=== 1. Ice Surface -> RAMP registry name ===');
  [...renames.entries()].sort().forEach(([k, n]) => console.log('  ' + String(n).padStart(4) + '  ' + k));
  console.log('  (' + [...renames.values()].reduce((s, n) => s + n, 0) + ' rows would change)');
  if (skipped.size) {
    console.log('\n  left alone — no entry in the registry:');
    [...skipped.entries()].sort().forEach(([k, n]) => console.log('    ' + String(n).padStart(4) + '  ' + k));
  }
  if (unknown.size) {
    console.log('\n  NOT RECOGNISED — needs a decision:');
    [...unknown.entries()].sort().forEach(([k, n]) => console.log('    ' + String(n).padStart(4) + '  ' + k));
  }

  /* ---- 2. append ice she added by hand in the app -------------------------------------- */
  const doc = await getJson(FIRESTORE);
  const payload = JSON.parse(doc.fields.payload.stringValue);
  const slotAdds = payload.slotAdds || [];

  /* What the Bible already holds. Compared on the RAW cell values — the Excel serial and the
     day-fraction — not on the formatted text. Formatted dates come back as "02/10/2026"
     (day-first), which would never equal an ISO date, so a text comparison silently matches
     nothing and every existing slot gets appended a second time. */
  const rowsRaw = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: '' });
  const fracToMin = v => (typeof v === 'number') ? Math.round(v * 1440) : null;
  const held = new Set();
  rowsRaw.slice(1).forEach(r => {
    const c = String(r[1] || '').trim(), a = String(r[2] || '').trim();
    const serial = (typeof r[0] === 'number') ? r[0] : null;
    const mins = fracToMin(r[4]);
    if (serial == null || mins == null) return;
    held.add(`${c}|${a}|${serial}|${mins}`);
  });

  const toAppend = [], excluded = new Map(), unrecognised = new Map();
  slotAdds.forEach(sa => {
    const raw = String(sa.sheet || sa.surface || '').trim();
    const pair = `${sa.venue}||${raw}`;
    if (!(pair in APP_SLOT_TO_BIBLE)) { unrecognised.set(pair, (unrecognised.get(pair) || 0) + 1); return; }
    const be = APP_SLOT_TO_BIBLE[pair];
    if (be === null) { excluded.set(pair, (excluded.get(pair) || 0) + 1); return; }
    const d = dateFor(sa.weekend, sa.day);
    if (!d) return;
    const [city, arena, surface] = be;
    const serial = excelSerial(d), mins = fracToMin(dayFrac(sa.start));
    const key = `${city}|${arena}|${serial}|${mins}`;
    if (held.has(key)) return;
    held.add(key);
    toAppend.push({ city, arena, surface, date: d, start: sa.start, end: sa.end,
                    from: `${sa.weekend} ${sa.day} ${sa.start}-${sa.end} @ ${sa.venue}` +
                          (surface !== raw ? `  [surface "${raw || '(blank)'}" -> "${surface || '(blank)'}"]` : '') });
  });
  const unmappable = new Map([...excluded, ...unrecognised]);

  console.log('\n=== 2. hand-added ice to append ===');
  console.log('  slotAdds in the app: ' + slotAdds.length + '  ->  to append: ' + toAppend.length);
  const byVenue = new Map();
  toAppend.forEach(t => byVenue.set(t.city + ' | ' + t.arena, (byVenue.get(t.city + ' | ' + t.arena) || 0) + 1));
  [...byVenue.entries()].sort().forEach(([k, n]) => console.log('    ' + String(n).padStart(4) + '  ' + k));
  if (excluded.size) {
    console.log('\n  NOT written on purpose (venue/surface disagree, or no Bible + registry entry):');
    [...excluded.entries()].sort().forEach(([k, n]) => console.log('    ' + String(n).padStart(4) + '  ' + k.replace('||', '  ||  ')));
  }
  if (unrecognised.size) {
    console.log('\n  NOT RECOGNISED — new venue/surface pair, needs a mapping decision:');
    [...unrecognised.entries()].sort().forEach(([k, n]) => console.log('    ' + String(n).padStart(4) + '  ' + k.replace('||', '  ||  ')));
  }
  console.log('\n  first 8 rows that would be added:');
  toAppend.slice(0, 8).forEach(t => console.log('    ' + t.date.toISOString().slice(0, 10) + '  ' + t.city + ' | ' + t.arena + ' | ' + (t.surface || '(blank)') + ' | ' + t.start + '-' + t.end + '   <- ' + t.from));

  if (!APPLY) {
    console.log('\nDRY RUN — nothing written. Re-run with --apply to write.');
    return;
  }

  /* ---- 3. write ------------------------------------------------------------------------ */
  const stamp = new Date().toISOString().slice(0, 10);
  const backup = BIBLE.replace(/\.xlsx$/i, ` - backup before writeback ${stamp}.xlsx`);
  fs.copyFileSync(BIBLE, backup);
  console.log('\nbacked up -> ' + path.basename(backup));

  /* Edit the worksheet IN PLACE. Rebuilding it from sheet_to_json output destroys the file: that
     output is formatted TEXT, so every Date / Start / End cell comes back as a string and
     sync-ice.js can no longer parse them — 849 of 948 rows read as out-of-season. Touching only
     the cells that change also preserves the workbook's existing formatting. */
  const at = (r, c) => XLSX.utils.encode_cell({ r, c });
  const range = XLSX.utils.decode_range(ws['!ref']);

  // 1. rename the Ice Surface cell where the registry has a name for it
  let renamed = 0;
  for (let R = range.s.r + 1; R <= range.e.r; R++) {
    const cc = ws[at(R, 1)], ca = ws[at(R, 2)], cs = ws[at(R, 3)];
    const c = cc ? String(cc.v).trim() : '', a = ca ? String(ca.v).trim() : '', s = cs ? String(cs.v).trim() : '';
    if (!c && !a) continue;
    const to = SURFACE_TO_REGISTRY[`${c}|${a}|${s}`];
    if (!to || to === s) continue;
    if (cs) { cs.v = to; cs.t = 's'; delete cs.w; delete cs.f; }
    else ws[at(R, 3)] = { t: 's', v: to };
    renamed++;
  }

  // 2. append, borrowing the number formats from the first data row so the new rows look native
  const zOf = C => { const cell = ws[at(range.s.r + 1, C)]; return cell && cell.z ? cell.z : undefined; };
  const zDate = zOf(0), zStart = zOf(4), zEnd = zOf(5);
  let R = range.e.r;
  toAppend.forEach(t => {
    R++;
    ws[at(R, 0)] = { t: 'n', v: excelSerial(t.date), z: zDate };
    ws[at(R, 1)] = { t: 's', v: t.city };
    ws[at(R, 2)] = { t: 's', v: t.arena };
    ws[at(R, 3)] = { t: 's', v: t.surface };
    ws[at(R, 4)] = { t: 'n', v: dayFrac(t.start), z: zStart };
    ws[at(R, 5)] = { t: 'n', v: dayFrac(t.end), z: zEnd };
  });
  range.e.r = R;
  ws['!ref'] = XLSX.utils.encode_range(range);

  XLSX.writeFile(wb, BIBLE);
  console.log('WROTE: ' + renamed + ' surfaces renamed, ' + toAppend.length + ' rows appended -> ' +
              (R - range.s.r) + ' data rows total.');
})().catch(e => { console.error('FAILED: ' + e.message); process.exit(1); });
