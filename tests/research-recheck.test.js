import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdirSync,mkdtempSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {datePatterns,findDeadlineEvidence,assessRow,renderDraft,draftPath,isIsoDay,isDraftPath} from '../scripts/research-recheck-lib.mjs';

const cli=fileURLToPath(new URL('../scripts/research-recheck.mjs',import.meta.url));
const repo=fileURLToPath(new URL('..',import.meta.url));
// The guards run before the first fetch, so these checks stay offline.
function runCLI(args,cwd=repo){return spawnSync(process.execPath,[cli,...args],{cwd,encoding:'utf8',timeout:30000});}

test('a recorded deadline is found however the page prints it',()=>{
 const forms=['Applications close 8 December 2026 at noon.','Deadline: 8th December 2026.','8 Dec 2026, 23:59 CET','Tuesday 8 December, 2026','closes on 08/12/2026','closes on 12/08/2026','2026-12-08'];
 for(const form of forms){
  const evidence=findDeadlineEvidence(form,'2026-12-08');
  assert.equal(evidence.found,true,`not found in: ${form}`);
  assert.ok(evidence.excerpt.length>0);
 }
});

test('a deadline from another year or day is not reported as the recorded one',()=>{
 for(const text of ['closes 8 December 2025','closes 9 December 2026','January 2027 intake','applications close in December']){
  assert.equal(findDeadlineEvidence(text,'2026-12-08').found,false,`false positive in: ${text}`);
 }
 assert.deepEqual(datePatterns('2026-13-01'),[]);
 assert.deepEqual(datePatterns('not a date'),[]);
});

test('a row with a printed deadline, a changed page and an unreadable page are distinguished',()=>{
 const row={id:'demo',lastCheckedAt:'2026-11-22',deadline:'2026-12-08'};
 const printed=assessRow(row,{text:'Applications close on 8 December 2026.',finalUrl:'https://example.test/'});
 assert.equal(printed.status,'deadline_found');
 assert.match(printed.evidence,/8 December 2026/);
 assert.equal(assessRow({...row,deadline:'2027-01-03'},{text:'Applications close on 8 December 2026.'}).status,'deadline_not_found');
 assert.equal(assessRow(row,{error:'HTTP 403'}).status,'unreachable');
});

test('a row with no recorded deadline is never confirmed by a keyword search',()=>{
 const row={id:'demo',lastCheckedAt:'2026-11-22',deadline:null};
 assert.equal(assessRow(row,{text:'Applications are open','finalUrl':'https://example.test/'}).status,'no_recorded_deadline');
 assert.equal(assessRow(row,{error:'page unavailable (challenge)'}).status,'unreachable');
});

test('the draft names the date and every row, and claims no check date of its own',()=>{
 const results=[
  {id:'alpha',recordedDeadline:'2026-12-08',status:'deadline_found',detail:'8 December 2026',evidence:'Applications close 8 December 2026.'},
  {id:'beta',recordedDeadline:'none',status:'no_recorded_deadline',detail:'',evidence:''},
  {id:'gamma',recordedDeadline:'2027-01-07',status:'deadline_not_found',detail:'no printed date',evidence:''}
 ];
 const draft=renderDraft({date:'2026-11-23',results,fetchedAt:'2026-11-23T06:00:00.000Z'});
 assert.match(draft,/^# Research source re-check — 2026-11-23 \(DRAFT\)/);
 for(const result of results)assert.match(draft,new RegExp(`\`${result.id}\``));
 assert.match(draft,/1 row\(s\) need a human decision: `gamma`/);
 assert.match(draft,/1 row\(s\) have no recorded deadline/);
 assert.match(draft,/never writes a check date/i);
 assert.match(draft,/lastCheckedAt` and `lastCheckedBy` are unchanged by this run/);
 assert.equal(draftPath('2026-11-23'),'docs/RESEARCH-RECHECK-2026-11-23.md');
});

test('the assistant only ever writes a dated record under docs/',()=>{
 assert.equal(isDraftPath(draftPath('2026-12-07')),true);
 for(const path of ['src/research-data.js','docs/RELEASE-NOTES.md','./docs/RESEARCH-RECHECK-2026-12-07.md','docs/../src/research-data.js','/tmp/docs/RESEARCH-RECHECK-2026-12-07.md','docs/RESEARCH-RECHECK-2026-12-07.md.bak','docs/RESEARCH-RECHECK-07-12-2026.md','docs/research-recheck-2026-12-07.md','docs/RESEARCH-RECHECK-2026-12-07.md/']){
  assert.equal(isDraftPath(path),false,`accepted a path it must refuse: ${path}`);
 }
});

test('a --date must name a real calendar day',()=>{
 for(const value of ['2026-12-07','2028-02-29'])assert.equal(isIsoDay(value),true,value);
 for(const value of ['2026-12-7','07/12/2026','tomorrow','2026-13-01','2026-02-30','2027-02-29','']){
  assert.equal(isIsoDay(value),false,`accepted an impossible date: ${value}`);
 }
});

test('a bad --date exits 2 before fetching or writing',()=>{
 for(const value of ['2026-12-7','2026-13-01','2026-02-30','tomorrow']){
  const result=runCLI([`--date=${value}`]);
  assert.equal(result.status,2,`--date=${value} exited ${result.status}: ${result.stderr}`);
  assert.match(result.stderr,/--date expects YYYY-MM-DD/);
  assert.equal(/^(?:OK |!! )/m.test(result.stdout),false,'a rejected date must not start fetching');
 }
});

test('an existing dated record is not overwritten without --force',()=>{
 const dir=mkdtempSync(join(tmpdir(),'bursyar-recheck-'));
 const date='2019-01-02';
 const target=join(dir,'docs',`RESEARCH-RECHECK-${date}.md`);
 const signed='# Signed record — do not overwrite\n';
 try{
  mkdirSync(join(dir,'docs'),{recursive:true});
  writeFileSync(target,signed);
  const result=runCLI([`--date=${date}`],dir);
  assert.equal(result.status,2,`exited ${result.status}: ${result.stderr}`);
  assert.match(result.stderr,/already exists/);
  assert.match(result.stderr,/--force/);
  assert.equal(readFileSync(target,'utf8'),signed,'the existing record was modified');
 }finally{
  rmSync(dir,{recursive:true,force:true});
 }
});
