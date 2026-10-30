import test from 'node:test';
import assert from 'node:assert/strict';
import {dispatchProviderRequest, ProviderDenied, ProviderUnavailable, minorRouteAllowed} from './provider-router.js';

const adult = {provider: 'meta', model: 'muse-spark-1.3', subjectAgeBand: 'adult_18_plus', audience: 'adult_only', locationDecision: 'allowed', consentVerified: true, dataClass: 'user_content'};

test('meta route invokes only the meta adapter', async () => {
  const calls = [];
  const out = await dispatchProviderRequest(adult, {
    meta: async () => { calls.push('meta'); return 'ok'; },
    gemini: async () => { calls.push('gemini'); },
    selfHosted: async () => { calls.push('self'); },
    deterministic: async () => { calls.push('det'); },
  });
  assert.equal(out.route, 'meta_standard');
  assert.deepEqual(calls, ['meta']);
});

test('denied contexts invoke zero adapters and never reserve quota', async () => {
  for (const change of [{subjectAgeBand: 'under_18'}, {audience: 'minor_targeted'}, {locationDecision: 'restricted'}, {model: 'muse-spark-1.3-contributor'}, {consentVerified: false}]) {
    let called = false;
    await assert.rejects(
      dispatchProviderRequest({...adult, ...change}, {meta: async () => { called = true; }, gemini: async () => { called = true; }, selfHosted: async () => { called = true; }, deterministic: async () => { called = true; }}),
      err => err instanceof ProviderDenied
    );
    assert.equal(called, false);
  }
});

test('gemini/self-hosted without an approved adapter fail closed without meta fallback', async () => {
  const gemini = {...adult, provider: 'gemini', model: 'gemini-approved', dataClass: 'public_source'};
  let metaCalled = false;
  await assert.rejects(
    dispatchProviderRequest(gemini, {meta: async () => { metaCalled = true; }}),
    err => err instanceof ProviderUnavailable
  );
  assert.equal(metaCalled, false);
  const local = {provider: 'self_hosted', model: 'qwen3-local', subjectAgeBand: 'under_18', audience: 'minor_targeted', locationDecision: 'restricted', consentVerified: true, dataClass: 'user_content', selfHostedLegalReview: true, selfHostedSecurityReview: true};
  metaCalled = false;
  await assert.rejects(
    dispatchProviderRequest(local, {meta: async () => { metaCalled = true; }}),
    err => err instanceof ProviderUnavailable
  );
  assert.equal(metaCalled, false);
});

test('configured gemini/self-hosted adapters run exactly once with no fallback', async () => {
  const calls = [];
  const gemini = {...adult, provider: 'gemini', model: 'gemini-approved', dataClass: 'public_source'};
  const g = await dispatchProviderRequest(gemini, {
    meta: async () => { calls.push('meta'); },
    gemini: async () => { calls.push('gemini'); return 'g'; },
  });
  assert.equal(g.route, 'gemini_eligible');
  const local = {provider: 'self_hosted', model: 'qwen3-local', subjectAgeBand: 'under_18', audience: 'minor_targeted', locationDecision: 'restricted', consentVerified: true, dataClass: 'user_content', selfHostedLegalReview: true, selfHostedSecurityReview: true};
  const s = await dispatchProviderRequest(local, {
    meta: async () => { calls.push('meta'); },
    selfHosted: async () => { calls.push('self'); return 's'; },
  });
  assert.equal(s.route, 'self_hosted');
  assert.deepEqual(calls, ['gemini', 'self']);
});

test('deterministic route never touches provider adapters', async () => {
  let providerCalled = false;
  const out = await dispatchProviderRequest({model: 'deterministic', subjectAgeBand: 'under_18', locationDecision: 'restricted'}, {
    meta: async () => { providerCalled = true; },
    deterministic: async () => 'local',
  });
  assert.equal(out.route, 'deterministic');
  assert.equal(providerCalled, false);
});

test('minor mode allows only the deterministic route', () => {
  assert.equal(minorRouteAllowed('deterministic'), true);
  assert.equal(minorRouteAllowed('meta_standard'), false);
  assert.equal(minorRouteAllowed('gemini_eligible'), false);
  assert.equal(minorRouteAllowed('self_hosted'), false);
});
