import test from 'node:test';
import assert from 'node:assert/strict';
import {assessScholarship,simulate} from '../eligibility.js';
const source={sourceUrl:'https://example.edu/admissions',sourceExcerpt:'Example fixture only; not a real scholarship.',ambiguous:false};
const rules=[
  {...source,id:'degree',type:'minimum_degree',minimum:'bachelor'},
  {...source,id:'english',type:'ielts_academic',test:'IELTS Academic',overallMin:6.5,eachBandMin:6}
];
const f=(value,origin='user_declared')=>({value,origin,claimIds:[]});
const testScore=(overall,writing=6.5)=>({test:'IELTS Academic',overall,bands:{listening:7,reading:7,writing,speaking:7}});
test('unknown facts never count as eligible',()=>{
  const x=assessScholarship(rules,{});
  assert.equal(x.summary,'unknown');
  assert.deepEqual(x.results.map(r=>r.status),['unknown','unknown']);
});
test('overall pass with one band below minimum fails',()=>{
  const x=assessScholarship(rules,{degree:f('bachelor'),languageTest:f(testScore(7,5.5))});
  assert.equal(x.summary,'not_met');
  assert.equal(x.results[1].status,'not_met');
});
test('all explicit thresholds met does not claim authenticity',()=>{
  const x=assessScholarship(rules,{degree:f('master'),languageTest:f(testScore(7))});
  assert.equal(x.summary,'met');
  assert.equal(Object.hasOwn(x,'authentic'),false);
});
test('unknown provenance is not trusted',()=>{
  const x=assessScholarship(rules,{degree:{value:'master',origin:'hypothetical'},languageTest:f(testScore(7))});
  assert.equal(x.summary,'unknown');
});
test('hypothetical update does not mutate actual profile',()=>{
  const original={degree:f('bachelor'),languageTest:f(testScore(6))};
  const before=structuredClone(original);
  const s=simulate(rules,original,{languageTest:testScore(7)});
  assert.equal(s.base.summary,'not_met');
  assert.equal(s.scenario.summary,'met');
  assert.deepEqual(original,before);
  assert.equal(s.hypothetical,true);
});
test('unreviewed rules cannot yield met',()=>{
  const x=assessScholarship([{...rules[0],ambiguous:true}],{degree:f('master')});
  assert.equal(x.summary,'unknown');
});
test('unsupported score scales remain unknown',()=>{
  const x=assessScholarship(rules,{degree:f('master'),languageTest:f({test:'TOEFL iBT',overall:5,bands:{}})});
  assert.equal(x.summary,'unknown');
});
test('invalid band and input are not silently coerced',()=>{
  const x=assessScholarship(rules,{degree:f('bachelor'),languageTest:f(testScore('7'))});
  assert.equal(x.summary,'unknown');
  assert.throws(()=>simulate(rules,{}, {issuer_verified:{value:true}}),/Unsupported override/);
});
test('missing explicit evidence and unsupported clauses stay unknown',()=>{
  const x=assessScholarship([{...rules[0],sourceExcerpt:''},{...rules[1],test:'TOEFL iBT'}],{degree:f('master'),languageTest:f(testScore(7))});
  assert.deepEqual(x.results.map(r=>r.status),['unknown','unknown']);
});
