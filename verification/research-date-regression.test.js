import test from 'node:test';
import assert from 'node:assert/strict';
import {filterResearch,researchDeadlineOn,researchDeadlineState,researchFreshness,exportResearchSaved} from '../src/research-catalog.js';
const row={id:'sample',title:'Sample',provider:'Provider',country:'Canada',degrees:['master'],funding:'unknown',sourceUrl:'https://example.org',deadline:'2026-02-30',lastCheckedAt:'2026-02-30'};
test('malformed dates are never represented as confirmed deadlines or fresh checks',()=>{
 assert.equal(researchDeadlineOn(row),null);
 assert.equal(researchDeadlineState(row,new Date('2026-11-20T12:00:00Z')),'unknown');
 assert.equal(researchFreshness(row,new Date('2026-11-20T12:00:00Z')),'unknown');
});
test('saved reference exports omit malformed dates',()=>{
 const exported=exportResearchSaved(['sample'],[row],new Date('2026-11-20T12:00:00Z'));
 assert.equal(exported.entries[0].deadline,null);
 assert.equal(exported.entries[0].lastCheckedAt,null);
});
test('search handles null query without excluding public records',()=>{
 assert.deepEqual(filterResearch([row],{q:null}),[row]);
});
test('invalid current clock does not classify a deadline as current',()=>{
 assert.equal(researchDeadlineState({...row,deadline:'2026-11-30'},new Date(NaN)),'unknown');
 assert.equal(researchFreshness({...row,lastCheckedAt:'2026-11-19'},new Date(NaN)),'unknown');
});
