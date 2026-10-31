import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validProfileValue,manualProfileUpdates} from '../engine/profile-schema.js';
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const form=readFileSync(new URL('../src/academic-evidence-form.js',import.meta.url),'utf8');
test('academic score inputs are mounted within the private profile workspace',()=>{
 assert.match(main,/mountAcademicEvidence\(/);
 assert.match(main,/academic-evidence-mount/);
 assert.match(form,/getInferenceToken/);
 assert.match(form,/\/api\/profile/);
 assert.match(form,/consent:true/);
 assert.doesNotMatch(form,/\/api\/analyze|contributor/i);
 for(const language of ['en','fa','ps'])assert.match(form,new RegExp('\\b'+language+':\\{title:'));
});
test('manual GPA and test edits stay bounded and never become issuer-verified facts',()=>{
 const values={gpa:{gpa:3.4,scale:4},languageTest:{test:'TOEFL iBT',overall:100,sections:{reading:25,listening:24,speaking:25,writing:26}}};
 for(const [key,value] of Object.entries(values))assert.equal(validProfileValue(key,value),true);
 const updates=manualProfileUpdates(values);
 for(const value of Object.values(updates)){assert.equal(value.origin,'user_declared');assert.equal(value.verificationStatus,'not_verified');}
 assert.equal(validProfileValue('gpa',{gpa:7,scale:4}),false);
 assert.equal(validProfileValue('languageTest',{test:'TOEFL iBT',overall:100,sections:{reading:99,listening:24,speaking:25,writing:26}}),false);
});
