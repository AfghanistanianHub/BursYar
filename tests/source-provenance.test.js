import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {auditScholarshipEvidence} from '../engine/source-provenance.js';

const text = 'Applicants must hold a bachelor degree.\nApplicants must have TOEFL iBT 90 overall, with no section below 20.';
const excerpt = 'Applicants must hold a bachelor degree.';
const expectedDigest = createHash('sha256').update(text).digest('hex');
const valid = {sourceUrl:'https://university.example/admissions',sourceText:text,excerpt,expectedDigest,capturedOn:'2026-10-01',checkedOn:'2026-10-29'};
const audit = override => auditScholarshipEvidence({...valid,...override});

test('matching excerpts and fresh digests do not imply official source or institution acceptance',()=>{
 const a=audit();
 assert.equal(a.metadataConsistent,true);
 assert.equal(a.sourceAuthenticity,'unverified');
 assert.equal(a.institutionalAcceptance,'unknown');
 assert.equal(a.requiresHumanReview,true);
 assert.equal(a.translationStatus,'UNREVIEWED');
 assert.ok(Object.isFrozen(a));
});

test('rejects modified excerpts, partial conditional lines, stale snapshots and wrong digests',()=>{
 for(const sample of [
  {excerpt:'Applicants must hold a bachelor degree'},
  {sourceText:'Applicants must hold a bachelor degree, unless exempted.', excerpt:'Applicants must hold a bachelor degree.'},
  {expectedDigest:'0'.repeat(64)},
  {capturedOn:'2025-01-01'},
  {capturedOn:'2026-11-01'},
  {capturedOn:'2026-02-30'},
  {contradictions:[{reason:'different_rules_for_same_dimension'}]}
 ])assert.equal(audit(sample).metadataConsistent,false,JSON.stringify(sample));
});

test('URL parser rejects non HTTPS, local and credentialed sources',()=>{
 for(const sourceUrl of [
  'http://university.example/admissions','https://user:pass@university.example/',
  'https://127.0.0.1/admissions','https://localhost/admissions',
  'https://university.example/admissions#fake'
 ])assert.ok(audit({sourceUrl}).issues.includes('invalid_source_url'),sourceUrl);
});

test('caller-supplied claims of verification cannot elevate an audit',()=>{
 const a=audit({verified:true,official:true,acceptedTests:['Duolingo'],institutionReviewed:true});
 assert.equal(a.sourceAuthenticity,'unverified');
 assert.equal(a.institutionalAcceptance,'unknown');
 assert.equal(a.requiresHumanReview,true);
});
