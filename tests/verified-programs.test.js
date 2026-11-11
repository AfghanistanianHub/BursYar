import test from 'node:test';
import assert from 'node:assert/strict';
import {checkedPrograms,programWindow,verifiedProgramCopy} from '../src/verified-programs.js';
const row=()=>({...checkedPrograms[0],checkedAt:'2026-11-05T12:00:00Z'});
test('checked official program facts are separate from personal eligibility',()=>{
 const p=checkedPrograms[0];assert.equal(p.id,'eth-esop-2027');
 assert.equal(new URL(p.sourceUrl).hostname,'ethz.ch');assert.equal(p.window.closes,'2026-11-30');
 assert.equal('rules' in p,false);assert.equal('eligibleNationalities' in p,false);
 for(const lang of ['en','fa','ps'])for(const key of ['heading','reported_open','recheck','confirm_cutoff','past','not_yet','note'])assert.ok(verifiedProgramCopy[lang][key]);
});
test('official window status expires rather than advertising perpetual openings',()=>{
 assert.equal(programWindow(row(),new Date('2026-11-06T12:00:00Z')),'reported_open');
 assert.equal(programWindow(row(),new Date('2026-11-13T12:00:00Z')),'recheck');
 assert.equal(programWindow(row(),new Date('2026-11-04T12:00:00Z')),'recheck');
});
test('closing day never assumes midnight or an ambiguous source cutoff',()=>{
 const p={...row(),checkedAt:'2026-11-30T00:00:00Z'};
 assert.equal(programWindow(p,new Date('2026-11-30T12:00:00Z')),'confirm_cutoff');
 assert.equal(programWindow(p,new Date('2026-12-01T12:00:00Z')),'past');
});
test('invalid dates, credential URLs and missing provenance fail closed',()=>{
 for(const patch of [{window:{opens:'2026-02-30',closes:'2026-11-30'}},{sourceUrl:'https://x:y@ethz.ch/page'},{checkedAt:'not a date'},{sourceKind:'unverified'}]){
  assert.equal(programWindow({...row(),...patch},new Date('2026-11-06T12:00:00Z')),'recheck');
 }
});
