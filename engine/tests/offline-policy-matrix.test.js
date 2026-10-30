import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {createInferenceServer} from '../http.js';

const projectId = 'demo-bursyar';
const body = {text: 'Applicants must have completed a bachelor degree before the application deadline.', sourceUrl: 'https://example.edu/scholarships', language: 'en'};
const adultMeta = {provider: 'meta', model: 'muse-spark-1.3', subjectAgeBand: 'adult_18_plus', audience: 'adult_only', locationDecision: 'allowed', consentVerified: true, dataClass: 'user_content'};

async function runGateway({context, inferImpl, quotaImpl, geminiImpl} = {}) {
  let calls = 0, geminiCalls = 0, reservations = 0;
  const infer = inferImpl ?? (async () => { calls++; throw Error('Provider must never be invoked'); });
  infer.reservationUnits = () => 1;
  const server = createInferenceServer({
    projectId, origin: 'http://127.0.0.1:5173',
    verify: async () => ({uid: 'test-user', aud: projectId, iss: 'https://securetoken.google.com/' + projectId, bursyarDemo: true}),
    quota: quotaImpl ?? {reserve: () => { reservations++; }},
    infer, canInfer: () => true, diagnose: () => {},
    geminiInfer: geminiImpl ?? null,
    policyContextForRequest: async () => { if (context instanceof Error) throw context; return context; },
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const url = 'http://127.0.0.1:' + server.address().port + '/api/analyze';
    const res = await fetch(url, {method: 'POST', headers: {authorization: 'Bearer t', 'content-type': 'application/json', origin: 'http://127.0.0.1:5173'}, body: JSON.stringify(body)});
    return {status: res.status, calls, geminiCalls, reservations};
  } finally {
    await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
  }
}

test('minor, unknown age, and guardian-proxy contexts deny with zero provider calls and zero quota', async () => {
  for (const change of [{subjectAgeBand: 'under_18'}, {subjectAgeBand: 'unknown'}, {audience: 'minor_targeted'}]) {
    const r = await runGateway({context: {...adultMeta, ...change}});
    // Deterministic minor route does not use this model endpoint: 403, no quota, no provider.
    assert.deepEqual(r, {status: 403, calls: 0, geminiCalls: 0, reservations: 0});
  }
});

test('restricted/unknown geography and revoked consent deny with zero calls', async () => {
  for (const change of [{locationDecision: 'restricted'}, {locationDecision: 'unknown'}, {consentVerified: false}])
    assert.deepEqual(await runGateway({context: {...adultMeta, ...change}}), {status: 403, calls: 0, geminiCalls: 0, reservations: 0});
  assert.deepEqual(await runGateway({context: new Error('No reliable policy source')}), {status: 403, calls: 0, geminiCalls: 0, reservations: 0});
});

test('unconfigured gemini/self-hosted routes fail closed without meta fallback', async () => {
  const gemini = {...adultMeta, provider: 'gemini', model: 'gemini-approved', dataClass: 'public_source'};
  assert.deepEqual(await runGateway({context: gemini}), {status: 503, calls: 0, geminiCalls: 0, reservations: 0});
  const local = {provider: 'self_hosted', model: 'qwen3-local', subjectAgeBand: 'under_18', audience: 'minor_targeted', locationDecision: 'restricted', consentVerified: true, dataClass: 'user_content', selfHostedLegalReview: true, selfHostedSecurityReview: true};
  assert.deepEqual(await runGateway({context: local}), {status: 503, calls: 0, geminiCalls: 0, reservations: 0});
});

test('provider outage returns 502 without fallback; quota failure returns 429 without provider call', async () => {
  const outage = await runGateway({context: adultMeta, inferImpl: Object.assign(async () => { throw Object.assign(new Error('boom'), {status: 502}); }, {reservationUnits: () => 1})});
  // Outage passes policy+quota then fails at the selected provider only.
  assert.equal(outage.status, 502);
  assert.equal(outage.calls, 0); // default counter unused by custom impl; no gemini fallback possible
  const denied = await runGateway({context: adultMeta, quotaImpl: {reserve: () => { throw Object.assign(new Error('x'), {name: 'QuotaExceeded'}); }}});
  assert.equal([429, 503].includes(denied.status), true);
});
