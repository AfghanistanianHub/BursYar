import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';

// The OCR runtime ships inside the application: worker script, WASM core and
// EN/FA/PS traineddata are copied from pinned npm packages by
// scripts/prepare-ocr-assets.mjs (run automatically by pretest/prebuild).
const manifest = JSON.parse(readFileSync(new URL('../public/ocr/manifest.json', import.meta.url), 'utf8'));
const root = new URL('../public/ocr/', import.meta.url);

test('OCR assets are generated from the pinned, audited package versions', () => {
  assert.deepEqual(manifest.packages, {
    'tesseract.js': '5.1.1',
    'tesseract.js-core': '5.1.1',
    '@tesseract.js-data/eng': '1.0.0',
    '@tesseract.js-data/fas': '1.0.0',
    '@tesseract.js-data/pus': '1.0.0'
  });
  assert.equal(manifest.servedFrom, '/ocr/');
});

test('every OCR asset exists, is non-empty and matches its recorded sha256', () => {
  assert.equal(manifest.files.length, 9);
  for (const file of manifest.files) {
    const path = new URL(file.path, root);
    assert.ok(existsSync(path), `${file.path} exists`);
    const bytes = readFileSync(path);
    assert.equal(bytes.length, file.bytes, `${file.path} size`);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256, `${file.path} sha256`);
    assert.ok(file.bytes > 0);
  }
});

test('the SIMD and fallback LSTM cores plus all three languages are shipped', () => {
  const paths = manifest.files.map(file => file.path);
  for (const required of [
    'worker.min.js', 'tesseract.esm.min.js',
    'tesseract-core-simd-lstm.wasm.js', 'tesseract-core-simd-lstm.wasm',
    'tesseract-core-lstm.wasm.js', 'tesseract-core-lstm.wasm',
    'lang/eng.traineddata.gz', 'lang/fas.traineddata.gz', 'lang/pus.traineddata.gz'
  ]) assert.ok(paths.includes(required), `${required} is shipped`);
  const total = manifest.files.reduce((sum, file) => sum + file.bytes, 0);
  assert.ok(total < 40 * 1024 * 1024, `assets stay under the 40 MiB gate (${total} bytes)`);
});

test('the runtime resolves every OCR asset to this application origin', () => {
  const runtime = readFileSync(new URL('../src/ocr-runtime.js', import.meta.url), 'utf8');
  assert.match(runtime, /const base='\/ocr\/'/);
  assert.match(runtime, /workerPath:`\$\{base\}worker\.min\.js`/);
  assert.match(runtime, /corePath:base/);
  assert.match(runtime, /langPath:`\$\{base\}lang`/);
  assert.match(runtime, /workerBlobURL:false/, 'worker script is same-origin, not a blob URL');
  // No absolute http(s) origin may appear: a CDN fallback would silently
  // reintroduce the third-party dependency the CSP exists to prevent.
  assert.equal([...runtime.matchAll(/https?:\/\//g)].length, 0, 'no absolute URLs in the OCR runtime');
});

test('document extraction no longer references any third-party code origin', () => {
  for (const file of ['../src/document-extraction.js', '../src/pdf-runtime.js']) {
    const source = readFileSync(new URL(file, import.meta.url), 'utf8');
    const urls = [...new Set([...source.matchAll(/https?:\/\/[^\s'"`)]+/g)].map(match => match[0]))];
    assert.deepEqual(urls, [], `${file} loads no remote code`);
  }
});

test('the generated asset directory is not committed to the repository', () => {
  const ignore = readFileSync(new URL('../.gitignore', import.meta.url), 'utf8').split('\n');
  assert.ok(ignore.includes('public/ocr/'), 'public/ocr/ is generated, not tracked');
  assert.ok(statSync(new URL('../public/ocr', import.meta.url)).isDirectory());
});
