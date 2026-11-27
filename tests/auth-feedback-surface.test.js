import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {signInFeedback,signInFailureMessage} from '../src/auth-feedback.js';

const root=new URL('../',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');

test('every mocked src/auth.js in the browser suites exports the real surface', () => {
 // A missing named export rejects the whole dynamic import, so a lagging mock
 // silently stalls the panel that mounts the chunk instead of failing its check.
 const real=read('src/auth.js');
 const exported=[...real.matchAll(/export (?:async )?function (\w+)/g)].map(match=>match[1]);
 assert.ok(exported.includes('getAccountCapability'));
 for(const file of readdirSync(new URL('verification/',root))){
  if(!file.endsWith('.mjs'))continue;
  const source=read('verification/'+file);
  if(!source.includes('src/auth.js')||!source.includes('export '))continue;
  for(const name of exported)assert.ok(source.includes(name),`${file} mocks src/auth.js without ${name}`);
 }
});

test('sign-in failures are explained without echoing raw provider text', () => {
 const cases=[
  ['auth/popup-closed-by-user','en','cancelled'],
  ['auth/cancelled-popup-request','fa','لغو شد'],
  ['auth/popup-blocked','en','Allow pop-ups'],
  ['auth/operation-not-supported-in-this-environment','en','full browser'],
  ['auth/unauthorized-domain','en','site address'],
  ['auth/operation-not-allowed','ps','دې نسخه'],
  ['auth/configuration-not-found','en','this version'],
  ['auth/unexpected','en','try again']
 ];
 for(const [code,language,expected] of cases){
  const message=signInFailureMessage(Object.assign(Error('sensitive-diagnostic-marker'),{code}),language);
  assert.match(message,new RegExp(expected),`${code} in ${language}`);
  assert.doesNotMatch(message,/sensitive-diagnostic-marker|auth\/|Firebase/);
 }
});

test('an unconfigured build is explained as a configuration state, not a retry', () => {
 const message=signInFailureMessage(Error('Firebase sign-in is not configured'),'en');
 assert.equal(message,signInFeedback.en.configuration);
 assert.doesNotMatch(message,/Firebase/);
});

test('the workspace start card mounts with the shell instead of waiting for a scroll', () => {
 const main=read('src/main.js');
 // The card is the guided entry links' destination. Left to the intersection
 // observer it stayed an empty, one-pixel labelled section far below the fold,
 // so landmark jumps and hash links reached nothing.
 assert.match(main,/function wireLazyMounts\(\)\{[\s\S]*?ensureMount\('overview'\);/);
});

test('a language switch restores the account control and the analyzer does not duplicate it', () => {
 const main=read('src/main.js');
 // render() rebuilds the header, so the account button has to be rewritten into
 // the fresh #account-controls node instead of disappearing until the next auth event.
 assert.match(main,/render\(\);\n \/\/ The shell rebuild[\s\S]{0,400}renderAccountControls\(\);/);
 const analyzer=read('src/analyzer.js');
 assert.doesNotMatch(analyzer,/querySelector\('#account-controls'\)/);
});
