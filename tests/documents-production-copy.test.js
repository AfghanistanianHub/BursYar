import test from 'node:test';
import assert from 'node:assert/strict';

if (typeof globalThis.document === 'undefined') {
  globalThis.document = {addEventListener() {}, dispatchEvent() {}, querySelector() { return null; }};
}
const {documentsCopy} = await import('../src/documents.js');

test('documents copy carries production TXT-only note and file label in en/fa/ps', () => {
  for (const lang of ['en', 'fa', 'ps']) {
    const t = documentsCopy[lang];
    assert.equal(typeof t.noteProduction, 'string', `${lang}.noteProduction`);
    assert.ok(t.noteProduction.includes('TXT'), `${lang}.noteProduction names TXT`);
    assert.ok(!t.noteProduction.includes('5 MB'), `${lang}.noteProduction promises no binary size`);
    assert.equal(typeof t.fileProduction, 'string', `${lang}.fileProduction`);
    assert.ok(t.fileProduction.includes('TXT'), `${lang}.fileProduction names TXT`);
    assert.ok(!t.fileProduction.includes('PDF'), `${lang}.fileProduction promises no PDF`);
  }
  assert.match(documentsCopy.en.noteProduction, /only/i, 'en says only');
  assert.match(documentsCopy.fa.noteProduction, /فقط/, 'fa says only');
  assert.match(documentsCopy.ps.noteProduction, /یوازې/, 'ps says only');
});
