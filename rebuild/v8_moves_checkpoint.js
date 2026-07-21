// v8 campaign checkpoint — replay against a fresh v7 test build if the browser dies.
// Inject MVB (gated batch mover) first, then run each batch in order.
// State after these batches: hard 34→22, totalSourced 157→169.
// MVB: find game by {div,home,away,wk}, set weekend/venue, clear day/time/endTime,
// rollback if any NEW hard (rule+msg) appears vs baseline.
const CTS='Cowichan — To Source';
const SHAW='Cowichan — Shawnigan Lake Arena';
const ABB='Abbotsford — Rinks at Summit Center';
const BATCHES=[
// C: Glaciers 12U Feb-12 LM trip + 2 CVR Jan-08 games -> Nov 27 Cowichan (kills C1-Feb12 x2, C3-Nov27)
[
 {div:'12U AAA',home:'Cowichan Valley Ravens',away:'Calgary Glaciers',wk:'Feb 12',toWk:'Nov 27',toVenue:CTS},
 {div:'12U AAA',home:'Cowichan Valley Ravens',away:'Calgary Glaciers',wk:'Feb 12',toWk:'Nov 27',toVenue:CTS},
 {div:'12U AAA',home:'Vancouver Aeros',away:'Calgary Glaciers',wk:'Feb 12',toWk:'Nov 27',toVenue:CTS},
 {div:'12U AAA',home:'Calgary Glaciers',away:'Langley Leafs',wk:'Feb 12',toWk:'Nov 27',toVenue:CTS},
 {div:'12U AAA',home:'Vancouver Aeros',away:'Cowichan Valley Ravens',wk:'Jan 08',toWk:'Nov 27',toVenue:CTS},
 {div:'12U AAA',home:'Langley Leafs',away:'Cowichan Valley Ravens',wk:'Jan 08',toWk:'Nov 27',toVenue:CTS}
],
// D: 3 Jan-15 CVR games -> Oct 09 Cowichan (kills C2-Oct09; Ravens 12U = 4 in own showcase)
[
 {div:'12U AAA',home:'Vancouver Aeros',away:'Cowichan Valley Ravens',wk:'Jan 15',toWk:'Oct 09',toVenue:CTS},
 {div:'12U AAA',home:'Vancouver Aeros',away:'Cowichan Valley Ravens',wk:'Jan 15',toWk:'Oct 09',toVenue:CTS},
 {div:'12U AAA',home:'Langley Leafs',away:'Cowichan Valley Ravens',wk:'Jan 15',toWk:'Oct 09',toVenue:CTS}
],
// a: 14U fixes (kills C1-Sep25, C1-Oct02 x1; LLvCVR refills freed Abbotsford grant slot)
[
 {div:'14U AAA',home:'Langley Leafs',away:'Cowichan Valley Ravens',wk:'Feb 12',toWk:'Oct 02',toVenue:ABB},
 {div:'14U AAA',home:'Cowichan Valley Ravens',away:'Vancouver Aeros',wk:'Oct 02',toWk:'Nov 20',toVenue:CTS},
 {div:'14U AAA',home:'Cowichan Valley Ravens',away:'Vancouver Aeros',wk:'Nov 06',toWk:'Nov 20',toVenue:CTS},
 {div:'14U AAA',home:'Cowichan Valley Ravens',away:'Calgary Glaciers',wk:'Sep 25',toWk:'Dec 04',toVenue:'Calgary — To Source'}
],
// f4: 16U AA (kills C3-Jan08, C3-Oct16, C2-Dec04)
[
 {div:'16U AA',home:'Victoria Hockey Academy',away:'Langley Leafs- AA',wk:'Jan 08',toWk:'Oct 09',toVenue:CTS},
 {div:'16U AA',home:'Victoria Hockey Academy',away:'Langley Leafs- AA',wk:'Jan 08',toWk:'Oct 09',toVenue:CTS},
 {div:'16U AA',home:'Victoria Hockey Academy',away:'Langley Leafs- AA',wk:'Oct 16',toWk:'Dec 04',toVenue:CTS},
 {div:'16U AA',home:'Victoria Hockey Academy',away:'Langley Leafs- AA',wk:'Nov 27',toWk:'Dec 04',toVenue:CTS},
 {div:'16U AA',home:'Manitoba Mavericks',away:'Victoria Hockey Academy',wk:'Nov 06',toWk:'Dec 04',toVenue:CTS}
],
// E: Nov 13 16U AA showcase -> Nov 27 (kills C3-Nov13)
[
 {div:'16U AA',home:'Victoria Hockey Academy',away:'Angels Pro Hockey- AA',wk:'Nov 13',toWk:'Nov 27',toVenue:SHAW},
 {div:'16U AA',home:'Victoria Hockey Academy',away:'Angels Pro Hockey- AA',wk:'Nov 13',toWk:'Nov 27',toVenue:SHAW},
 {div:'16U AA',home:'Victoria Hockey Academy',away:'Langley Leafs- AA',wk:'Nov 13',toWk:'Nov 27',toVenue:SHAW},
 {div:'16U AA',home:'Victoria Hockey Academy',away:'Langley Leafs- AA',wk:'Nov 13',toWk:'Nov 27',toVenue:SHAW},
 {div:'16U AA',home:'Langley Leafs- AA',away:'Angels Pro Hockey- AA',wk:'Nov 13',toWk:'Nov 27',toVenue:SHAW},
 {div:'16U AA',home:'Angels Pro Hockey- AA',away:'Langley Leafs- AA',wk:'Nov 13',toWk:'Nov 27',toVenue:SHAW}
]
];
// HOME-FLIPS (apply after batches; label-only, engine-gated):
// 1. 14U AAA Oct 02: 'Cowichan Valley Ravens v Peace Country Northstars' -> home=PCN (kills C1-Oct02 #2)
// 2. 16U AA Jan 29: 'Victoria Hockey Academy v Sask Phantoms- AA' -> home=SP (kills C1-Jan29)

// ===== 5h-drive family batches (applied after the island batches; hard 22->5, ts 169->191) =====
// 19U+16UAA: BVNvOoks 19U Sep11->Nov27 EdmTS; AuroraVBVN 19U Sep11->Nov13 CalTS; PhoenixVAngels 16UAA Dec04->Sep11 CalTS
// 12U: RvBVN Oct09->Dec11 Hardisty; BVNvOoks Oct09->Dec11 Har; RvOoks Oct09->Dec11 Har; SPvBVN Oct09->Jan15 Lloyd;
//      SPvBVN Sep18->Jan15 Lloyd; GvOoks Jan29->Feb19 EdmTS; RvG Jan29->Dec11 Har; BVNvR Jan08->Dec11 Har
// 14U: RvG Oct09->Nov13 CalTS; RvBVN Oct09->Nov13 CalTS; BVNvOoks Oct09->Oct16 EdmTS; RvBVN Sep11->Jan08 CalTS;
//      GvOoks Sep11->Feb19 EdmTS; GvOoks Sep11->Jan15 EdmTS; RvG Sep11->Nov27 EdmTS;
//      EXCHANGE [BVN v CVR @ Sep11].home=PCN <-> [CVR v PCN @ Jan08].away=BVN
// 16UAAA: GvAurora Sep18->Nov13 LloydServus; GvAngels Sep18->Nov13 LloydServus;
//      BVNvG Sep11->Nov27 EdmTS; OoksvG Sep11->Nov27 EdmTS; BVNvOoks Sep11->Nov27 EdmTS
// 14UAA: AngelsVBVN-AA Nov13->Oct02 EdmTS; BVN-AAvAngels Nov13->Feb12 EdmTS;
//      AngelsVG-AA Feb12(Hesco)->Nov13 LloydServus; BVN-AAvG-AA Nov13->Dec11 CalTS
// Residual at this point: C3-Feb19 (16U AA showcase, unsatisfiable - user decision) + 4 flight-parity.

// ===== v9 travel rules (2026-07-21) — added to index.html engine =====
// RULE "Purcell trip minimums": Purcell no longer exempt; far clusters need 4 (19U 3),
//   except Lower Mainland: 16U AAA 3, 19U 2 (user's Delta allowance).
// RULE "Play the host": a team with games at an away cluster must play >=1 host-cluster team
//   that weekend (exempt: Midway/Hardisty neutrals, island<->LM ferry, LOCAL <=5h hops,
//   clusters with no same-division host).
// v8 baseline under these = 45 hard (6 Purcell-min, 36 host, +3 pre-existing residuals).
// In-page fixers (deterministic, replay on fresh v8 build in this order):
//   HOSTFIXW() x1  -> within-weekend re-pair (10 fixed)
//   HOSTFIXG() x1  -> generalized cross-weekend exchange (3 fixed)
//   IMPORTFIX() x1 -> import host-vs-visitor game into weekend (2 fixed, +1 sourcing LM)
//   HOSTFIXN/HOSTFIXG2 -> exhausted, 0 more re-pair fixes possible
// State after: 27 hard (24 new-rule residual + 3 old), ts 183.
// REMAINING 24 need a scope decision — see report. Infeasible-by-capacity (host caps < visitors):
//   19U Feb12 LM, 19U Feb19 Ab, 16UAA Jan15 Cal, 16UAA Nov06 Wpg, 16UAA Oct23 Edm.
//   No-host-present 2-team drive pods: 16UAA Feb05 Ab, 14UAA Feb12 Ab (both pinned at 4 mutual).
