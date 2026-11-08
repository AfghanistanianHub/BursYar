import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

test('OCR host never clones oversized or non-string text into the page', async () => {
  const messages = [];
  let text;
  const worker = {
    Worker: class {},
    TextEncoder,
    postMessage: message => messages.push(message),
    close() {},
    MAX_TEXT_BYTES: 12000,
    Tesseract: {createWorker: async () => ({
      recognize: async () => ({data:{text}}),
    })},
  };
  const source = readFileSync(new URL('../src/ocr-host.worker.js', import.meta.url), 'utf8');
  runInNewContext(source.replace(/^import .*;$/gm, ''), worker);
  await worker.onmessage({data:{id:0,action:'initialize'}});
  const recognize = async value => {
    text = value;
    await worker.onmessage({data:{id:1,action:'recognize',bytes:new ArrayBuffer(1)}});
    return messages.at(-1);
  };

  const exact = 'ش'.repeat(6000);
  assert.equal((await recognize(exact)).value.data.text, exact);
  assert.equal((await recognize(exact + 'ش')).error, 'extractedTextTooLarge');
  assert.equal((await recognize(' '.repeat(12001))).error, 'extractedTextTooLarge');
  assert.equal((await recognize({nested:'invalid'})).error, true);
  assert.equal((await recognize('next upload')).value.data.text, 'next upload');
});
