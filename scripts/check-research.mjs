#!/usr/bin/env node
// Research freshness gate as a standalone operator tool (BY-08).
//
//   npm run check:research
//   node scripts/check-research.mjs --now=2026-12-07   # ask "what breaks then?"
//
// Prints every shipped row whose recorded source check is outside the recheck
// window its provenance earns, with the date and the window, then exits 1 so a
// release stops. Exit 0 means every row is provably fresh. It never rewrites
// data: re-reading the source, re-dating the row and recording the evidence stay
// deliberate human acts, per RELEASE.md step 2.
import {
  researchScholarships,
  researchCheckedOn,
  researchCheckedBy,
  researchRecheckDays,
  researchFreshness
} from '../src/research-catalog.js';

const DAY=86400000;
const argument=process.argv.slice(2).find(value=>value.startsWith('--now='));
const now=argument?new Date(argument.slice('--now='.length)):new Date();
if(!Number.isFinite(now.getTime())){
 console.error(`check:research — --now expects a date, got ${JSON.stringify(argument.slice('--now='.length))}`);
 process.exit(2);
}
const today=now.toISOString().slice(0,10);

const rows=researchScholarships.map(row=>{
 const checked=researchCheckedOn(row);
 const window=researchRecheckDays(row);
 const provenance=researchCheckedBy(row)??'unknown_provenance';
 const freshness=researchFreshness(row,now);
 const age=checked?Math.floor((now.getTime()-Date.parse(checked+'T00:00:00Z'))/DAY):null;
 const overdue=age!==null&&age>window?age-window:null;
 const note=freshness==='fresh'?''
  :!checked?'no valid lastCheckedAt — cannot prove any reading'
  :age<0?`lastCheckedAt ${checked} is in the future`
  :`${overdue} day${overdue===1?'':'s'} past the ${window}-day window`;
 return {id:row.id,title:row.title??'',checked,provenance,window,freshness,note};
});

const overdue=rows.filter(row=>row.freshness!=='fresh');
console.log('Research freshness gate: every shipped check date must still be inside the recheck window its provenance earns (RELEASE.md step 2).');
console.log(`Research check as of ${today}: ${rows.length} shipped rows, ${overdue.length} overdue`);
console.log('');
for(const row of rows){
 const status=row.freshness==='fresh'?'OK  ':'FAIL';
 const checked=row.checked??'(no date)';
 console.log(`${status} ${row.id.padEnd(30)} ${checked}  ${row.provenance.padEnd(20)} ${row.window}d${row.note?'  '+row.note:''}`);
}
console.log('');

if(!overdue.length){
 console.log(`Every shipped row is inside the window its provenance earns; nothing to re-read as of ${today}.`);
 process.exit(0);
}

console.log(`${overdue.length} row${overdue.length===1?'':'s'} must be re-read before this code can ship:`);
for(const row of overdue)console.log(`  - ${row.id}: ${row.title}`);
console.log('');
console.log('For each row: open its sourceUrl, confirm the recorded details still hold, set lastCheckedAt (and lastCheckedBy) in src/research-data.js, and record the evidence in docs/RESEARCH-RECHECK-<date>.md. Then run this check again.');
process.exit(1);
