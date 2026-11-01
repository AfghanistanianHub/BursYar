import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const academic = readFileSync(new URL('../src/academic-evidence-form.js', import.meta.url), 'utf8');
const eligibility = readFileSync(new URL('../src/eligibility-demo.js', import.meta.url), 'utf8');

test('academic scores remount on identity change like profile and documents', () => {
  const identity = academic.split('\n').find(l => l.includes('bursyar:identity'));
  assert.ok(identity, 'identity listener present');
  assert.match(identity, /mountAcademicEvidence\(/);
  assert.match(identity, /#academic-evidence-mount/);
  assert.match(identity, /profile=\{\}/);
  assert.match(identity, /epoch\+\+/);
});

test('eligibility assessment preserves saved TOEFL type and sections', () => {
  assert.match(eligibility, /savedFields\.testType=test\.test/);
  assert.match(eligibility, /test\.bands\?\?test\.sections/);
  assert.match(eligibility, /savedFields\.testType==='TOEFL iBT'\?asFact\(\{test:'TOEFL iBT',overall:[^}]+sections/);
  assert.match(eligibility, /:\s*asFact\(\{test:'IELTS Academic',overall:[^}]+bands/);
  assert.match(eligibility, /eligibility-simulate'\)\.addEventListener\('click',\(\)=>\{[^]*?savedFields\.testType==='TOEFL iBT'/s);
});
