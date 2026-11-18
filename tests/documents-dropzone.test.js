import test from 'node:test';
import assert from 'node:assert/strict';

if (typeof globalThis.document === 'undefined') {
  globalThis.document = {addEventListener() {}, dispatchEvent() {}, querySelector() { return null; }};
}
const {documentsCopy, documentSteps, documentStageKeys, binaryDocumentsEnabled} = await import('../src/documents.js');

const ARABIC = /[\u0600-\u06ff]/;

test('document workflow has Upload, Extract-or-enter, Review, Save steps in en/fa/ps', () => {
  assert.deepEqual(documentStageKeys, ['upload', 'extract', 'review', 'save']);
  for (const lang of ['en', 'fa', 'ps']) {
    assert.equal(documentSteps[lang].length, 4, `${lang} has 4 steps`);
    for (const name of documentSteps[lang]) assert.ok(name.length > 0, `${lang} step non-empty`);
  }
  assert.deepEqual(documentSteps.en, ['Upload', 'Extract or enter text', 'Review before use', 'Save']);
});

test('dropzone copy exists in en/fa/ps and never promises binary intake by itself', () => {
  for (const lang of ['en', 'fa', 'ps']) {
    const t = documentsCopy[lang];
    for (const key of ['dropHint', 'dropActive', 'dropDisabled']) {
      assert.equal(typeof t[key], 'string', `${lang}.${key}`);
      assert.ok(t[key].length > 0, `${lang}.${key} non-empty`);
    }
    if (lang !== 'en') {
      assert.match(t.dropHint, ARABIC, `${lang}.dropHint script`);
      assert.match(t.methodFrom.utf8_text, ARABIC, `${lang}.methodFrom script`);
    }
  }
});

test('binary intake is enabled and the copy names PDF/PNG/JPEG without claiming verification', () => {
  assert.equal(binaryDocumentsEnabled, true, 'PDF and image intake is available in production');
  for (const lang of ['en', 'fa', 'ps']) {
    const t = documentsCopy[lang];
    assert.match(t.unsupportedFile, /PDF/, `${lang}.unsupportedFile names PDF`);
    assert.match(t.note, /PDF/, `${lang}.note describes PDF limits`);
    // No remaining string may tell users that production is TXT-only.
    for (const value of Object.values(t)) {
      if (typeof value !== 'string') continue;
      assert.ok(!/TXT only|فقط TXT|یوازې TXT/.test(value), `${lang} has no stale TXT-only claim`);
    }
  }
});

test('extraction-method provenance covers every recorded method plus a fallback', () => {
  const methods = ['utf8_text', 'local_pdf_text_or_ocr', 'local_image_ocr',
    'manual_transcription_from_image', 'manual_transcription_from_pdf', 'other'];
  for (const lang of ['en', 'fa', 'ps']) {
    assert.deepEqual(Object.keys(documentsCopy[lang].methodFrom).sort(), methods.sort(), `${lang}.methodFrom keys`);
    for (const label of Object.values(documentsCopy[lang].methodFrom)) {
      assert.ok(label.length > 0, `${lang} method label non-empty`);
      assert.ok(!/verif/i.test(label) || /not|نمی|نه|نہ/.test(label), `${lang} method label claims no verification: ${label}`);
    }
  }
});
