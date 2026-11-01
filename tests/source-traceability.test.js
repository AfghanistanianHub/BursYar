import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

const ledger = JSON.parse(readFileSync(new URL('../data/scholarship-sources.json', import.meta.url), 'utf8'));
const fixture = JSON.parse(readFileSync(new URL('../verification/fixtures/scholarship-evaluation.json', import.meta.url), 'utf8'));
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const METHODS = new Set(['server_fetch_live_unpaid', 'official_page_review', 'official_snippets_only', 'excerpt_from_prior_review']);

test('ledger schema is valid and nothing is pre-approved', () => {
  assert.equal(ledger.schemaVersion, 1);
  assert.ok(Array.isArray(ledger.records) && ledger.records.length > 0);
  const ids = new Set();
  for (const r of ledger.records) {
    assert.equal(typeof r.id, 'string');
    assert.ok(!ids.has(r.id), `duplicate ledger id ${r.id}`);
    ids.add(r.id);
    const url = new URL(r.sourceUrl);
    assert.equal(url.protocol, 'https:');
    assert.ok(METHODS.has(r.method), `unknown method ${r.method}`);
    assert.ok(r.capturedOn === null || ISO_DAY.test(r.capturedOn));
    assert.equal(typeof r.coverage, 'string');
    assert.ok(Array.isArray(r.excerpts));
    assert.equal(typeof r.retrievalEvidence, 'string');
    assert.equal(r.status, 'needs_reverification');
    assert.equal(r.verifiedBy, null);
  }
});

test('pinned excerpt digests match their text', () => {
  for (const r of ledger.records)
    for (const e of r.excerpts)
      assert.equal(createHash('sha256').update(e.text).digest('hex'), e.digest, `${r.id}/${e.id}`);
});

test('every non-synthetic fixture case has a ledger record', () => {
  const urls = new Set(ledger.records.map(r => r.sourceUrl));
  for (const c of fixture.cases) {
    if (new URL(c.sourceUrl).hostname === 'university.example') continue;
    assert.ok(urls.has(c.sourceUrl), `fixture case ${c.id} has no ledger record`);
  }
});

test('fixture cases carry provenance metadata', () => {
  for (const c of fixture.cases) {
    assert.equal(typeof c.id, 'string');
    assert.equal(typeof c.sourceUrl, 'string');
    assert.ok(c.provenance && typeof c.provenance === 'object', `${c.id} missing provenance`);
    assert.ok(METHODS.has(c.provenance.method) || c.provenance.method === 'synthetic', `${c.id} bad method`);
    assert.equal(typeof c.provenance.note, 'string');
  }
});
