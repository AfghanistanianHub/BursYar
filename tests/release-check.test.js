import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {hostnameAgreement,manifestSmokeTarget,renderServiceVars} from '../scripts/release-check.mjs';

const read=name=>readFileSync(fileURLToPath(new URL(`../${name}`,import.meta.url)),'utf8');
const repoFiles=()=>({
 vercelJson:read('vercel.json'),
 renderYaml:read('render.yaml'),
 releaseMd:read('RELEASE.md'),
 smokeSource:read('scripts/release-smoke.mjs')
});

test('the checked-in release configuration agrees on its hostnames',()=>{
 const verdict=hostnameAgreement(repoFiles());
 assert.deepEqual(verdict.failures,[]);
 assert.ok(verdict.checks.length>=10,`expected the guard to check its whole set, got ${verdict.checks.length}`);
});

test('a smoke target that is not the frontend host is rejected',()=>{
 const files=repoFiles();
 files.releaseMd=files.releaseMd.replace(
  'node scripts/release-smoke.mjs https://bursyar.vercel.app',
  'node scripts/release-smoke.mjs https://preview.example.dev');
 const verdict=hostnameAgreement(files);
 assert.ok(verdict.failures.some(label=>/one frontend host/.test(label)),verdict.failures.join('; '));
});

test('a /health rewrite pointing at another backend is rejected',()=>{
 const files=repoFiles();
 files.vercelJson=files.vercelJson.replace(
  '"https://bursyar-api.onrender.com/health"',
  '"https://other-api.example.dev/health"');
 const verdict=hostnameAgreement(files);
 assert.ok(verdict.failures.some(label=>/one backend host/.test(label)),verdict.failures.join('; '));
 assert.ok(verdict.failures.some(label=>/connect-src/.test(label)),verdict.failures.join('; '));
});

test('a render CORS origin that is not the frontend is rejected',()=>{
 const files=repoFiles();
 files.renderYaml=files.renderYaml.replace(
  'value: https://bursyar.vercel.app',
  'value: https://staging.example.dev');
 const verdict=hostnameAgreement(files);
 assert.ok(verdict.failures.some(label=>/CORS origin/.test(label)),verdict.failures.join('; '));
});

test('the release-smoke command in RELEASE.md is found',()=>{
 assert.equal(manifestSmokeTarget(read('RELEASE.md')),'https://bursyar.vercel.app');
});

test('render env vars are read without treating sync:false as a value',()=>{
 const vars=renderServiceVars(read('render.yaml'));
 assert.equal(vars.BURSYAR_ORIGIN,'https://bursyar.vercel.app');
 assert.equal(vars.META_API_KEY,undefined);
 assert.equal(vars.BURSYAR_DOCUMENT_SUPABASE_URL,undefined);
});
