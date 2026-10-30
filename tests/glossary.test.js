import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {glossary} from '../src/glossary.js';
import {translations} from '../src/i18n.js';
import {barrierText} from '../src/pathfinder.js';

const ARABIC = /[\u0600-\u06ff]/;

test('glossary terms are complete, bounded, frozen and script-correct', () => {
  const keys = Object.keys(glossary);
  assert.ok(keys.length >= 10);
  for (const [key, term] of Object.entries(glossary)) {
    assert.deepEqual(Object.keys(term).sort(), ['en', 'fa', 'ps'], key);
    for (const [lang, text] of Object.entries(term)) {
      assert.equal(typeof text, 'string', `${key}.${lang}`);
      assert.ok(text.length > 0 && text.length <= 80, `${key}.${lang}`);
      if (lang !== 'en') assert.match(text, ARABIC, `${key}.${lang}`);
    }
    assert.ok(Object.isFrozen(term), key);
  }
  assert.ok(Object.isFrozen(glossary));
});

test('reviewer glossary document lists every coded term and stays unreviewed', () => {
  const doc = readFileSync(new URL('../docs/GLOSSARY.md', import.meta.url), 'utf8');
  assert.match(doc, /UNREVIEWED/);
  for (const term of Object.values(glossary)) assert.ok(doc.includes(term.en), term.en);
});

test('interface translations keep identical keys across languages', () => {
  const keys = Object.keys(translations.en).sort();
  assert.ok(keys.length > 10);
  for (const lang of ['fa', 'ps']) assert.deepEqual(Object.keys(translations[lang]).sort(), keys, lang);
});

test('translations are never marked reviewed without a reviewer record', () => {
  const review = JSON.parse(readFileSync(new URL('../docs/TRANSLATION-REVIEW.json', import.meta.url), 'utf8'));
  assert.ok(Array.isArray(review.reviewers));
  if (review.status !== 'PENDING_HUMAN_REVIEW') {
    assert.ok(review.reviewers.length > 0);
    for (const r of review.reviewers) assert.ok(r.reviewer && r.approvedAt && r.outputDigest);
  }
});

test('PathFinder status labels match the controlled glossary', () => {
  const codes = [['potential mismatch', 'potentialMismatch'], ['cannot determine', 'cannotDetermine']];
  for (const [code, key] of codes) {
    for (const lang of ['en', 'fa', 'ps']) {
      assert.equal(barrierText({status: code}, lang).status, glossary[key][lang], `${code}.${lang}`);
    }
  }
});
