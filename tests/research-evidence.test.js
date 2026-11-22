import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {researchScholarships,researchCheckedOn,researchCheckedBy} from '../src/research-catalog.js';

const root=fileURLToPath(new URL('..',import.meta.url));

// The freshness gate forces a re-read; this guard forces the read to leave a
// record. Without it the cheapest way to green the suite on 7 December 2026 is
// to move lastCheckedAt forward, which would make the date a claim with nothing
// behind it. A date is only allowed to exist if a dated evidence document names
// every row that carries it.
test('every research check date has a dated evidence record naming each row',()=>{
 const byDate=new Map();
 for(const row of researchScholarships){
  const date=researchCheckedOn(row);
  assert.ok(date,`${row.id} has no valid lastCheckedAt; a row cannot claim a check without a date`);
  byDate.set(date,[...(byDate.get(date)??[]),row.id]);
 }
 assert.ok(byDate.size>0,'no shipped rows to check');

 for(const [date,ids] of byDate){
  const file=`docs/RESEARCH-RECHECK-${date}.md`;
  assert.ok(existsSync(join(root,file)),
   `${ids.length} row(s) claim lastCheckedAt ${date} but ${file} does not exist. Re-dating a row requires writing the evidence for that read: ${ids.join(', ')}.`);
  const text=readFileSync(join(root,file),'utf8');
  assert.match(text,new RegExp(`\\b${date}\\b`),`${file} does not mention ${date}`);
  const missing=ids.filter(id=>!text.includes(id));
  assert.deepEqual(missing,[],`${file} has no entry for ${missing.join(', ')}; every row sharing a check date must be recorded in it`);
  if(ids.some(id=>researchCheckedBy(researchScholarships.find(row=>row.id===id))==='automated_source_read')){
   assert.match(text,/automated_source_read|automated (?:source )?read/i,
    `${file} must state that at least one check was an automated source read, not a human one`);
  }
 }
});
