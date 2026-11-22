import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {researchScholarships,researchCheckedOn} from '../src/research-catalog.js';

const DAY=86400000;
// Dates are derived from the shipped rows, not hard-coded, so a routine re-read
// (which re-dates the rows) never turns these wiring tests red by itself.
const newestCheck=researchScholarships.map(researchCheckedOn).filter(Boolean).sort().at(-1);
const staleDate=new Date(Date.parse(newestCheck+'T00:00:00Z')+60*DAY).toISOString().slice(0,10);

function run(now){
 const args=['scripts/check-research.mjs',...(now===undefined?[]:[`--now=${now}`])];
 try{
  return {code:0,out:execFileSync(process.execPath,args,{encoding:'utf8',stdio:['ignore','pipe','pipe']})};
 }catch(error){
  return {code:error.status,out:String(error.stdout??''),err:String(error.stderr??'')};
 }
}

test('check:research exits 0 when every shipped row is inside its window',()=>{
 // Every row is dated on or before the newest check, and the project re-reads
 // them as a batch. A failure here means a row lags the newest by more than its
 // own window — re-read that source instead of loosening this test.
 const result=run(newestCheck);
 assert.equal(result.code,0,`expected 0 at ${newestCheck} (newest shipped check date), got ${result.code}${result.err?'\n'+result.err:''}`);
 assert.match(result.out,new RegExp(`${researchScholarships.length} shipped rows, 0 overdue`));
 assert.match(result.out,/nothing to re-read/);
});

test('check:research exits 1 and names each overdue row with its date and window',()=>{
 const result=run(staleDate);
 assert.equal(result.code,1,`expected 1 at ${staleDate}, got ${result.code}`);
 assert.match(result.out,new RegExp(`${researchScholarships.length} shipped rows, ${researchScholarships.length} overdue`));
 assert.match(result.out,/FAIL \S+ +\d{4}-\d{2}-\d{2} +\S+ +\d+d +\d+ days? past the \d+-day window/);
 assert.match(result.out,/must be re-read before this code can ship/);
 assert.match(result.out,/- chevening-2027: /);
});

test('check:research exits 2 for a bad --now so a typo is never read as overdue',()=>{
 const result=run('nope');
 assert.equal(result.code,2);
 assert.match(result.err,/--now expects a date/);
 assert.equal(result.out,'');
 const missing=run('2026-13-45');
 assert.equal(missing.code,2);
});
