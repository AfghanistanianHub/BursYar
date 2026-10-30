import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {FamilyStore} from '../family.js';
import {minorRouteAllowed} from '../provider-router.js';

function makeStore() {
  const dir = mkdtempSync(join(tmpdir(), 'bursyar-family-'));
  return {dir, store: new FamilyStore(join(dir, 'family.db'))};
}

test('guardian registration requires adult attestation and consent', () => {
  const {dir, store} = makeStore();
  try {
    assert.throws(() => store.registerGuardian('g1', {adultAttested: true}), e => e.status === 400);
    assert.throws(() => store.registerGuardian('g1', {consent: true}), e => e.status === 400);
    assert.ok(store.registerGuardian('g1', {adultAttested: true, consent: true}));
    assert.throws(() => store.createMinorProfile('unknown-guardian', {consent: true}), e => e.status === 403);
  } finally { store.close(); rmSync(dir, {recursive: true, force: true}); }
});

test('minor profiles isolate guardians, enforce consent and reject sensitive identifiers', () => {
  const {dir, store} = makeStore();
  try {
    store.registerGuardian('alice', {adultAttested: true, consent: true});
    store.registerGuardian('bob', {adultAttested: true, consent: true});
    assert.throws(() => store.createMinorProfile('alice', {consent: true, nationalId: '123'}), e => e.status === 400);
    const minor = store.createMinorProfile('alice', {consent: true, label: 'Student A'});
    assert.throws(() => store.getMinorProfile('bob', minor.id), e => e.status === 404);
    assert.throws(() => store.updateMinorProfile('bob', minor.id, {consent: true, values: {languages: 'English'}}), e => e.status === 404);
    const profile = store.updateMinorProfile('alice', minor.id, {consent: true, values: {languages: 'English (declared)', degree: 'secondary'}});
    assert.equal(profile.languages.origin, 'guardian_declared');
    assert.equal(profile.languages.verificationStatus, 'not_verified');
    assert.throws(() => store.updateMinorProfile('alice', minor.id, {consent: true, values: {nationalId: 'x'}}), e => e.status === 400);
    assert.deepEqual(store.revokeMinorConsent('alice', minor.id), {revoked: true});
    assert.throws(() => store.getMinorProfile('alice', minor.id), e => e.status === 403);
    assert.deepEqual(store.deleteMinorProfile('alice', minor.id), {deleted: true});
    assert.throws(() => store.getMinorProfile('alice', minor.id), e => e.status === 404);
  } finally { store.close(); rmSync(dir, {recursive: true, force: true}); }
});

test('transfer at majority is explicit and never automatic', () => {
  const {dir, store} = makeStore();
  try {
    store.registerGuardian('g', {adultAttested: true, consent: true});
    const minor = store.createMinorProfile('g', {consent: true});
    assert.throws(() => store.transferAtMajority('g', minor.id, {newOwnerUid: 'adult', newOwnerConsent: true}), e => e.status === 400);
    const out = store.transferAtMajority('g', minor.id, {newOwnerUid: 'adult', newOwnerConsent: true, adultAttested: true});
    assert.equal(out.transferred, true);
    assert.throws(() => store.getMinorProfile('g', minor.id), e => e.status === 404);
  } finally { store.close(); rmSync(dir, {recursive: true, force: true}); }
});

test('minor subjects never use Meta or Gemini routes, including via guardian proxy', () => {
  assert.equal(minorRouteAllowed('meta_standard'), false);
  assert.equal(minorRouteAllowed('gemini_eligible'), false);
  assert.equal(minorRouteAllowed('self_hosted'), false);
  assert.equal(minorRouteAllowed('deterministic'), true);
});
