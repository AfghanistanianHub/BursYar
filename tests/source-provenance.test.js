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

test('normalization attaches a conservative source audit to each requirement', async()=>{
 const {normalizeEvidence}=await import('../engine/evidence.js');
 const input={text,sourceUrl:valid.sourceUrl,language:'en'};
 const raw=JSON.stringify({criteria:[{kind:'education',required:true,excerpt,en:'Review needed',fa:'تفسیر نیاز به بررسی دارد',ps:'تفسیر بیاکتنې ته اړتیا لري'}],deadline:null,funding:[]});
 const result=normalizeEvidence(raw,input);
 assert.equal(result.sourceAudits.length,1);
 assert.equal(result.sourceAudits[0].criterionId,'criterion-1');
 assert.equal(result.sourceAudits[0].excerptMatched,true);
 assert.equal(result.sourceAudits[0].sourceAuthenticity,'unverified');
 assert.equal(result.sourceAudits[0].institutionalAcceptance,'unknown');
 assert.ok(result.sourceAudits[0].issues.includes('invalid_freshness_metadata'));
 assert.equal(result.compilation.sourceStatus,'user_supplied_unverified');
});

test('normalization carries conflicting same-dimension thresholds into source audits', async()=>{
 const {normalizeEvidence}=await import('../engine/evidence.js');
 const lines=[
  'Applicants must hold a minimum GPA of 3.0 on a 4.0 scale.',
  'Applicants must hold a minimum GPA of 3.5 on a 4.0 scale.'
 ];
 const input={text:lines.join('\\n'),sourceUrl:valid.sourceUrl,language:'en'};
 const raw=JSON.stringify({criteria:lines.map(excerpt=>({kind:'education',required:true,excerpt,en:'Review required',fa:'تفسیر نیاز به بررسی دارد',ps:'تفسیر بیاکتنې ته اړتیا لري'})),deadline:null,funding:[]});
 const output=normalizeEvidence(raw,input);
 assert.equal(output.compilation.contradictions.length,1);
 assert.ok(output.sourceAudits.every(a=>a.issues.includes('unresolved_contradiction')));
 assert.ok(output.compilation.rules.every(r=>r.ambiguous===true));
 assert.ok(output.sourceAudits.every(a=>a.institutionalAcceptance==='unknown'));
});
