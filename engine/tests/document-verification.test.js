import test from 'node:test';
import assert from 'node:assert/strict';
import {verificationLabel, verificationNote} from '../document-verification.js';

test('documents default to unverified and never claim official verification without issuer response', () => {
  assert.equal(verificationLabel({authenticity: 'not_verified', extractionMethod: 'bounded_text_parser'}), 'unverified');
  assert.equal(verificationLabel({authenticity: 'not_verified', extractionMethod: 'bounded_text_parser', reviewedAt: '2026-01-01'}), 'automated_inspection_only');
  // An unverified issuer claim must not promote the label.
  assert.equal(verificationLabel({reviewedAt: '2026-01-01'}, {verified: true}), 'unverified');
  assert.equal(verificationLabel({reviewedAt: '2026-01-01'}, {verified: true, issuer: 'Example University', authorized: false}), 'unverified');
});

test('official verification requires an authorized issuing-institution response', () => {
  assert.equal(verificationLabel({}, {verified: true, issuer: 'Example University', authorized: true}), 'officially_verified');
  assert.ok(verificationNote('officially_verified').length > 0);
  assert.ok(verificationNote('automated_inspection_only').includes('not official proof'));
  assert.ok(verificationNote('unverified').includes('Unverified'));
});
