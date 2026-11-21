import test from 'node:test';
import assert from 'node:assert/strict';
import {safeVerificationDate, safeVerificationUrl, verificationArray} from '../src/verifications.js';

const formatter = new Intl.DateTimeFormat('en', {dateStyle:'medium',timeZone:'UTC'});
test('issuer links require HTTPS without embedded credentials', () => {
 assert.equal(safeVerificationUrl('https://example.org/check'), 'https://example.org/check');
 for (const value of ['http://example.org','javascript:alert(1)','https://user:pass@example.org','//example.org',null,{},'not a url']) {
  assert.equal(safeVerificationUrl(value), null);
 }
});
test('invalid dates cannot crash verification rendering', () => {
 assert.equal(safeVerificationDate('not-a-date', formatter), '—');
 assert.equal(safeVerificationDate(undefined, formatter), '—');
 assert.match(safeVerificationDate('2026-11-21T00:00:00Z', formatter), /2026/);
});
test('invalid API response shapes are rejected before rendering', () => {
 for (const data of [null,{}, {requests:null},{requests:{}},{requests:'bad'}]) {
  assert.throws(() => verificationArray(data, 'requests'), /Invalid verification response/);
 }
 assert.deepEqual(verificationArray({requests:[]}, 'requests'), []);
 assert.deepEqual(verificationArray({providers:[{id:'issuer'}]}, 'providers'), [{id:'issuer'}]);
 assert.throws(() => verificationArray({documents:{}}, 'documents'), /Invalid verification response/);
});
