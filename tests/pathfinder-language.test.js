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

test('gap actions never fabricate provider acceptance or referral links',async()=>{
 const {planGaps,actionText}=await import('../src/gap-actions.js');
 const gaps=planGaps({results:[{requirementId:'english',status:'unknown',reason:'missing_language_test',source:{url:'https://example.edu'}},{requirementId:'degree',status:'met'}]});
 assert.equal(gaps.length,1);assert.equal(gaps[0].providerUrl,null);assert.equal(gaps[0].action,'confirm_accepted_tests');
 for(const language of ['en','fa','ps'])assert.ok(actionText[language][gaps[0].action]);
});
