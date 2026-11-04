import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {demoAssessment,analysisWorkspaceCopy} from '../src/analysis-workspace.js';
const css=readFileSync(new URL('../src/analysis-workspace.css',import.meta.url),'utf8');
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');

test('M17 demo contract: default verdicts are met/met/not_met/unknown',()=>{
 const assessment=demoAssessment();
 const byId=Object.fromEntries(assessment.results.map(r=>[r.requirementId,r]));
 assert.equal(byId.degree.status,'met');
 assert.equal(byId.english.status,'met');
 assert.equal(byId.gpa.status,'not_met');
 assert.equal(byId.continuity.status,'unknown');
 assert.equal(assessment.summary,'not_met');
});

test('M17 demo contract: flagged claims are excluded from reasoning',()=>{
 const assessment=demoAssessment(['docA-claim1','docA-claim2','docB-claim1']);
 const byId=Object.fromEntries(assessment.results.map(r=>[r.requirementId,r]));
 assert.equal(byId.degree.status,'unknown');
 assert.equal(byId.english.status,'unknown');
 assert.equal(byId.gpa.status,'unknown');
 assert.equal(byId.continuity.status,'unknown');
 assert.equal(assessment.summary,'unknown');
});

test('M17 demo contract: every verdict cites a real reason and reviewed fact origin',()=>{
 for(const r of demoAssessment().results){
  assert.ok(r.reason&&r.reason!=='pending_review');
  for(const fact of r.usedFacts??[])assert.equal(fact.origin,'document_extracted');
 }
});

test('M17 workspace copy exists in en/fa/ps with no empty strings',()=>{
 for(const lang of ['en','fa','ps']){
  const t=analysisWorkspaceCopy[lang];
  assert.ok(t,`missing ${lang}`);
  assert.equal(t.stages.length,5);
  const walk=value=>{if(typeof value==='string')assert.ok(value.trim(),`${lang} empty string`);else if(value&&typeof value==='object')Object.values(value).forEach(walk);};
  walk(t);
 }
 assert.match(analysisWorkspaceCopy.fa.title,/[\u0600-\u06ff]/);
 assert.match(analysisWorkspaceCopy.ps.title,/[\u0600-\u06ff]/);
});

test('M17 stylesheet: five-stage flow, RTL logical properties, no gradients',()=>{
 assert.match(css,/\.aw-flow\{[^}]*grid-template-columns:repeat\(5/);
 assert.match(css,/border-inline-start/);
 assert.match(css,/padding-inline-start/);
 assert.match(css,/\[dir=rtl\]/);
 assert.match(css,/prefers-reduced-motion/);
 assert.doesNotMatch(css,/linear-gradient|radial-gradient/);
});

test('M17 workspace is mounted in the main render',()=>{
 assert.match(main,/mountAnalysisWorkspace\(document\.querySelector\('#analysis-workspace'\),state\.language\)/);
 assert.match(main,/<section id="analysis-workspace"/);
 assert.match(main,/import '\.\/analysis-workspace\.css';/);
});

test('M17 trace selection preserves text opacity for WCAG contrast',()=>{
 assert.doesNotMatch(css,/\[data-req\]:not\([^}]*opacity:\s*\.(?:[0-9]+)/s);
 assert.match(css,/\.aw-flow\[data-selected\] \[data-req\]\{opacity:1\}/);
 assert.match(css,/\.aw-req:focus-visible/);
});

test('M17 workspace contains overflow during 200% layout zoom',()=>{
 assert.match(css,/#analysis-workspace\{[^}]*min-width:0/);
 assert.match(css,/\.aw-flow\{min-width:0;max-width:100%;overflow-x:auto/);
 assert.doesNotMatch(css,/overflow-x:visible/);
});
