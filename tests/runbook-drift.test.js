import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

// The owner packet's §6 runbook quotes the exact FAIL/INFO lines the two release
// tools print, and names the rollback pair. If a message is renamed in a tool, or
// a documented red disappears from the runbook, the runbook quietly describes
// output that no longer exists — and the operator reads the wrong remedy in the
// middle of an incursion. These tests are offline: they only compare the checked-in
// files, and they expect each documented line to still be printed verbatim.
const read=path=>readFileSync(fileURLToPath(new URL(`../${path}`,import.meta.url)),'utf8');
const packet=read('docs/OWNER-UNBLOCK-PACKET.md');
const releaseMd=read('RELEASE.md');
const tools={check:read('scripts/release-check.mjs'),smoke:read('scripts/release-smoke.mjs')};

function sectionOf(text,heading){
 const start=text.indexOf(heading);
 assert.ok(start>=0,`missing heading: ${heading}`);
 const rest=text.slice(start+heading.length);
 const end=rest.search(/\n#{2,3} /);
 return end<0?rest:rest.slice(0,end);
}

// First column of the section's table, with the header and separator dropped.
function documentedCells(heading){
 return sectionOf(packet,heading).split('\n')
  .filter(line=>line.startsWith('|'))
  .map(line=>line.split('|')[1]?.trim()??'')
  .filter(cell=>cell&&!/^-{3}/.test(cell)&&!['Failing line','Check (as printed)'].includes(cell));
}

function assertRunbookMatches(heading,tool,lines){
 const text=tools[tool];
 const cells=documentedCells(heading);
 assert.ok(cells.length>=lines.length,`${heading} has ${cells.length} rows but only ${lines.length} fixtures`);

 for(const line of lines){
  assert.ok(cells.some(cell=>cell.includes(line.cell)),
   `the runbook no longer documents "${line.cell}" — update the fixture or restore the row`);
 }

 for(const cell of cells){
  const matching=lines.filter(line=>cell.includes(line.cell));
  assert.equal(matching.length,1,
   `the runbook row "${cell}" has ${matching.length} fixtures in ${tool}; it needs exactly one`);
  for(const must of matching[0].must){
   assert.ok(text.includes(must),
    `${tool} no longer prints "${must}" (documented as "${cell}") — the runbook would describe output that cannot appear`);
  }
 }
}

test('every documented release:check red line is still printed by scripts/release-check.mjs',()=>{
 assertRunbookMatches('### 6.1 What each `release:check` step means','check',[
  {cell:'the tree has N uncommitted paths',
   must:['the tree has ${paths.length} uncommitted path']},
  {cell:'the frontend/backend row is a full 40-character SHA',
   must:['the frontend row is a full 40-character SHA','the backend row is a full 40-character SHA']},
  {cell:'the frontend/backend commit exists in this clone',
   must:['the ${name} commit exists in this clone']},
  {cell:'the recorded frontend commit is on main',
   must:['the recorded frontend commit is on ${rows.branch}']},
  {cell:'the recorded branch … is available to compare against',
   must:['the recorded branch ${rows.branch} is available to compare against']},
  {cell:'vercel.json rewrites … to an absolute URL',
   must:['vercel.json rewrites /api/:path* to an absolute URL','keeps the path','keeps the /api prefix']},
  {cell:'both rewrites target one backend host',
   must:['both rewrites target one backend host']},
  {cell:'render.yaml sets BURSYAR_ORIGIN',
   must:['render.yaml sets BURSYAR_ORIGIN to an absolute URL','render.yaml healthCheckPath is /health']},
  {cell:'RELEASE.md documents a release-smoke URL',
   must:['RELEASE.md documents a release-smoke URL','release-smoke.mjs declares DEFAULT_BASE','name one frontend host']},
  {cell:"render.yaml's CORS origin is the frontend host",
   must:["render.yaml's CORS origin is the frontend host"]},
  {cell:'the CSP connect-src allows the backend host',
   must:['the CSP connect-src allows the backend host']},
  {cell:'every shipped research row is inside its recheck window',
   must:['every shipped research row is inside its recheck window']},
  {cell:'npm run build succeeds',
   must:['npm run build succeeds']},
  {cell:'dist/index.html carries a build stamp',
   must:['dist/index.html carries a build stamp','the stamp is HEAD']},
  {cell:'the rehearsal passes all four scenarios',
   must:['the rehearsal passes all four scenarios']}
 ]);
});

test('every documented release-smoke red line is still printed by scripts/release-smoke.mjs',()=>{
 assertRunbookMatches('### 6.2 What each `release-smoke` line means','smoke',[
  {cell:'GET / → 302',
   must:['GET / → ${home.status}',"no Vercel SSO redirect (location: ${home.location||'none'})"]},
  {cell:'/ serves HTML (<type>)',
   must:["/ serves HTML (${home.type||'no content-type'})"]},
  {cell:'the app shell is present in the HTML',
   must:['the app shell is present in the HTML']},
  {cell:'/assets/<hash>.js → 404',
   must:['match(/\\/assets\\/','→ ${res.status}']},
  {cell:'frontend reports its build commit (missing stamp, rebuild …)',
   must:["frontend reports its build commit (${frontendCommit||'missing stamp, rebuild with the current vite config'})"]},
  {cell:'GET /health → 404',
   must:['GET /health → ${health.status}']},
  {cell:'GET /health → no answer within 45000 ms',
   must:['GET /health → no answer within ${healthTimeoutMs} ms']},
  {cell:'backend reports a build commit (none)',
   must:["backend reports a build commit (${backendCommit||'none'})"]},
  {cell:'frontend <a> and backend <b> report the same commit',
   must:['frontend ${frontendCommit} and backend ${backendCommit} report the same commit']},
  {cell:'RELEASE.md records both commits (frontend missing, backend missing)',
   must:["RELEASE.md records both commits (frontend ${manifest.frontend||'missing'}, backend ${manifest.backend||'missing'}"]},
  {cell:'frontend/backend <a> matches RELEASE.md (<c>)',
   must:['frontend ${frontendCommit} matches RELEASE.md (','backend ${backendCommit} matches RELEASE.md (']},
  {cell:'request failed: …',
   must:['request failed: ${error.message}']}
 ]);
});

test("the packet's rollback pair is the pair RELEASE.md records",()=>{
 const inventory=sectionOf(releaseMd,'## Verified deployment inventory');
 const frontend=inventory.match(/Production frontend branch and commit[^\n]*?`([0-9a-f]{40})`/i)?.[1]??'';
 const backend=inventory.match(/Backend production SHA[^\n]*?`([0-9a-f]{40})`/i)?.[1]??'';
 const rollback=sectionOf(releaseMd,'## Rollback');
 const deployment=rollback.match(/`(dpl_[A-Za-z0-9]+)`/)?.[1]??'';
 const previousBackend=rollback.match(/previous backend commit[^\n]*?`([0-9a-f]{7,40})`/i)?.[1]??'';
 assert.ok(frontend&&backend&&deployment&&previousBackend,
  `RELEASE.md must record the inventory pair and the rollback targets (frontend ${frontend||'missing'}, backend ${backend||'missing'}, deployment ${deployment||'missing'}, previous backend ${previousBackend||'missing'})`);
 assert.ok(backend.startsWith(previousBackend),
  `RELEASE.md's rollback backend (${previousBackend}) is not the recorded backend (${backend})`);

 const pair=sectionOf(packet,'### 6.3 The safe rollback pair');
 for(const [label,value] of [['frontend commit',frontend],['frontend deployment',deployment],['backend commit',backend]]){
  assert.ok(pair.includes(value),
   `§6.3 no longer names the ${label} RELEASE.md records (${value}) — a rollback to a pair nobody verified is not safe`);
 }
});
