import test from 'node:test';
import assert from 'node:assert/strict';
import {validateRequest,createPrompt,normalizeModelResponse} from './engine.js';
const text='The applicant must be enrolled in an undergraduate program and submit an application before December 2026.';
test('validates request language, length, and type',()=>{assert.equal(validateRequest({text,language:'fa'}).language,'fa');assert.throws(()=>validateRequest({text,language:'xx'}));assert.throws(()=>validateRequest({text:'short',language:'ps'}));assert.throws(()=>validateRequest([]));});
test('builds controlled developer messages for untrusted content',()=>{const a=createPrompt({text,language:'ps'});assert.equal(a[0].role,'developer');assert.match(a[0].content,/Do not invent/);assert.equal(a[1].role,'user');assert.match(a[1].content,/UNTRUSTED/);});
test('validates model response and flags mandatory human review',()=>{const a=normalizeModelResponse(JSON.stringify({summary:'Sample',criteria:['Enrolled'],deadline:null,uncertainties:['Unknown'],sourceLanguage:'en'}));assert.equal(a.requiresHumanReview,true);assert.equal(a.aiGenerated,true);assert.throws(()=>normalizeModelResponse('bad'));assert.throws(()=>normalizeModelResponse('{}'));});
