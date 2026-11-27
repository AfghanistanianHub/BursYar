import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verificationLoadCopy} from '../src/verifications.js';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

// These guard the workspace defects found by inspecting rendered screens in
// verification/workspace-visual.mjs, so a later stylesheet or markup edit cannot
// quietly bring them back.
test('the mobile tab bar holds every dashboard route in whole rows', () => {
  const css = read('src/student-dashboard.css');
  const mobile = css.slice(css.indexOf('@media (max-width: 760px)'));
  const navStart = mobile.indexOf('.dashboard-nav {');
  const nav = mobile.slice(navStart, mobile.indexOf('}', navStart));
  // Six destinations in four columns wrapped into a second row that the bar's own
  // height clipped, so "Verification" and "Account" sat under the screen edge.
  assert.match(nav, /grid-template-columns:\s*repeat\(3,/, 'six routes need three columns');
  assert.doesNotMatch(nav, /repeat\(4,/, 'a four-column bar clips the last two routes');
  assert.match(nav, /position: fixed/);
  const mainStart = mobile.indexOf('.dashboard-main');
  const main = mobile.slice(mainStart, mobile.indexOf('}', mainStart));
  assert.match(main, /padding-block-end:\s*calc\(1[4-9][0-9]px/, 'the reading pane must reserve both bar rows');
});

test('desktop navigation stays reachable while a long reader scrolls', () => {
  const css = read('src/student-dashboard.css');
  const desktop = css.slice(0, css.indexOf('@media (max-width: 760px)'));
  const start = desktop.indexOf('.dashboard-nav {');
  const rule = desktop.slice(start, desktop.indexOf('}', start));
  assert.match(rule, /position: sticky/, 'an unsticky nav leaves an empty column beside the reader');
});

test('the account menu is an out-of-flow menu with its own surface', () => {
  const css = read('src/student-dashboard.css');
  const start = css.indexOf('.dashboard-account #account-controls {');
  assert.ok(start > 0);
  const rule = css.slice(start, css.indexOf('}', start));
  assert.match(rule, /position: absolute/);
  assert.match(rule, /box-shadow/);
  assert.match(rule, /background:/);
});

test('the document stage rail clears the floated illustration plate', () => {
  const css = read('src/documents-storyboard.css');
  const start = css.indexOf('.document-stage-list{');
  const rule = css.slice(start, css.indexOf('}', start));
  assert.match(rule, /clear:both/, 'the float squeezes four stages into wrapped labels');
});

test('opening a pending document enters the reader at its own heading', () => {
  const source = read('src/documents.js');
  assert.match(source, /document-reader-heading/);
  assert.match(source, /heading\.focus\(\{preventScroll:true\}\)/);
  assert.match(source, /scrollIntoView\(\{block:'start'\}\)/);
  // The bare-region focus survives only as the fallback when no heading exists.
  assert.match(source, /else\{content\.tabIndex=-1;content\.focus\(\);\}/);
});

test('the drop hint sits above the file control it points at', () => {
  const source = read('src/documents.js');
  assert.match(source, /label\.insertBefore\(dropHint,file\)/);
});

test('the verification panel survives a provider outage and explains an empty selector', () => {
  const source = read('src/verifications.js');
  for (const load of ['loadProviders', 'loadDocuments', 'loadRequests']) {
    assert.match(source, new RegExp(`await attempt\\(${load}\\)`), load);
  }
  assert.match(source, /providersEmpty/);
  assert.doesNotMatch(source, /catch \{ status\.textContent = t\.error; \}/, 'an outage is not a sign-in problem');
});

test('reader and verification load copy exist in all three languages', () => {
  // documents.js registers a document listener at module scope, so it is read as
  // text here instead of imported into Node.
  const documents = read('src/documents.js');
  for (const title of ['Document reader', 'خوانش سند', 'د سند لوستنه']) {
    assert.ok(documents.includes(title), title);
  }
  for (const language of ['en', 'fa', 'ps']) {
    for (const value of [
      verificationLoadCopy[language]?.providersEmpty,
      verificationLoadCopy[language]?.unavailable
    ]) {
      assert.ok(typeof value === 'string' && value.trim(), language);
    }
  }
});
