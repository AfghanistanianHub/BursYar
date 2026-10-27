import test from 'node:test';
import assert from 'node:assert/strict';
import {findBarriers,barrierText} from '../src/pathfinder.js';
test('all three languages express conservative source criterion guidance',()=>{
 const [result]=findBarriers([{id:'one',kind:'transcripts',required:true}],{transcripts:'unavailable'});
 for(const lang of ['en','fa','ps']){const t=barrierText(result,lang);assert.ok(t.status&&t.action);if(lang!=='en')assert.match(t.action,/[\u0600-\u06ff]/);}
 const [unknown]=findBarriers([{id:'two',kind:'education'}],{education:'available'});assert.equal(unknown.status,'cannot determine');
});
test('optional, exempted and unclassified criteria never become mandatory barriers',()=>{
 for(const required of [false,null,undefined]){const [r]=findBarriers([{id:'one',kind:'transcripts',required}],{transcripts:'unavailable'});assert.equal(r.status,'cannot determine');}
});
