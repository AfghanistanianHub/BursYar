import test from 'node:test';
import assert from 'node:assert/strict';
import {validProfileValue,manualProfileUpdates} from '../engine/profile-schema.js';
import {exportResearchSaved} from '../src/research-catalog.js';

test('malformed nested academic records fail validation without throwing',()=>{
 for(const value of [null,[],{},'invalid',42])assert.equal(validProfileValue('academicScore',value),false);
 for(const value of [null,[],{},'invalid',42,{test:'IELTS Academic',overall:7,bands:[]}])assert.equal(validProfileValue('languageTest',value),false);
 assert.throws(()=>manualProfileUpdates({academicScore:[]}));
 assert.throws(()=>manualProfileUpdates({languageTest:{test:'IELTS Academic',overall:7,bands:[]}}));
});

test('valid academic score and IELTS data still pass validation',()=>{
 assert.equal(validProfileValue('academicScore',{score:3.4,scale:4}),true);
 assert.equal(validProfileValue('languageTest',{test:'IELTS Academic',overall:7,bands:{listening:7,reading:7,writing:7,speaking:7}}),true);
});

test('invalid clock does not crash saved scholarship export',()=>{
 const result=exportResearchSaved([],[],new Date(NaN));
 assert.equal(result.exportedAt,null);
 assert.deepEqual(result.entries,[]);
});
