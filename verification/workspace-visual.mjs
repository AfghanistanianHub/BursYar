// Visual + structural inspection of the authenticated workspace.
//
// The accounts are real Firebase Auth emulator accounts: the browser signs in
// through the emulator with the real Firebase SDK (verification/support/
// emulator-session.js), the page is reloaded so the application's own session
// restore produces the signed-in state, and the document API verifies the
// emulator ID token with firebase-admin. No module of src/ is mocked.
//
// Screenshots land in verification/artifacts/workspace; every scene also runs
// the axe WCAG 2.1 AA rules and an overflow check.
import assert from 'node:assert/strict';
import {chromium, expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {createServer} from 'vite';
import {mkdirSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {initializeApp} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {DocumentStore} from '../engine/documents.js';
import {createInferenceServer} from '../engine/http.js';
import {createScholarshipCatalog} from '../engine/deterministic.js';
import {defaultCatalog} from '../engine/default-catalog.js';

const projectId = 'demo-bursyar';
const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST ?? '127.0.0.1:9099';
const emulatorUrl = `http://${authHost}`;
const firebaseConfig = {apiKey: 'demo-api-key', projectId, authDomain: authHost};
// The page must build its Firebase app with the same apiKey it signed in with,
// otherwise it looks for a different persisted session.
Object.assign(process.env, {
  VITE_FIREBASE_API_KEY: firebaseConfig.apiKey,
  VITE_FIREBASE_PROJECT_ID: firebaseConfig.projectId,
  VITE_FIREBASE_AUTH_DOMAIN: firebaseConfig.authDomain,
  VITE_FIREBASE_AUTH_EMULATOR: emulatorUrl
});

const outDir = 'verification/artifacts/workspace';
mkdirSync(outDir, {recursive: true});
const only = process.env.WORKSPACE_SCENE?.split(',').filter(Boolean) ?? null;

const admin = initializeApp({projectId}, 'bursyar-workspace-visual');
const adminAuth = getAuth(admin);

// Emulator Google sign-in: an unsigned provider payload is acceptable for the
// local emulator only, exactly as verification/emulator.mjs does.
function idpJwt(email) {
  const b64 = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  return b64({alg: 'none', typ: 'JWT'}) + '.' + b64({
    sub: email, email, email_verified: true, name: 'Emulator demo user',
    iss: 'https://accounts.google.com', aud: 'demo-client'
  }) + '.';
}
async function emulatorSignIn(email) {
  const response = await fetch(`${emulatorUrl}/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=demo-key`, {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({
      requestUri: 'http://localhost',
      postBody: new URLSearchParams({providerId: 'google.com', id_token: idpJwt(email)}).toString(),
      returnSecureToken: true,
      returnIdpCredential: true
    })
  });
  assert.equal(response.status, 200, 'emulator Google sign-in must succeed');
  return response.json();
}

const studentEmail = 'student@example.test';
const created = await emulatorSignIn(studentEmail);
await adminAuth.setCustomUserClaims(created.localId, {bursyarDemo: true});
const session = await emulatorSignIn(studentEmail);

const directory = mkdtempSync(join(tmpdir(), 'bursyar-workspace-'));
const documents = new DocumentStore(join(directory, 'documents.db'));
const server = await createServer({server: {host: '127.0.0.1', port: 0}, logLevel: 'error'});
await server.listen();
const url = `http://127.0.0.1:${server.httpServer.address().port}`;

const api = createInferenceServer({
  // The real reviewed catalog, so the local assessment runs its real rules.
  projectId, origin: url, documents, catalog: createScholarshipCatalog(defaultCatalog),
  quota: {reserve() { throw Error('Inference forbidden in workspace inspection'); }},
  infer: async () => { throw Error('Inference forbidden in workspace inspection'); },
  verify: token => adminAuth.verifyIdToken(token, true)
});

const scenes = [];
let browser;
try {
  await new Promise(resolve => api.listen(0, '127.0.0.1', resolve));
  const apiUrl = `http://127.0.0.1:${api.address().port}`;
  const seeded = await fetch(apiUrl + '/api/documents', {
    method: 'POST',
    headers: {authorization: 'Bearer ' + session.idToken, origin: url, 'content-type': 'application/json'},
    body: JSON.stringify({
      text: 'SYNTHETIC WORKSPACE DOCUMENT\nIssuer: Example University\nDegree: bachelor\nGPA: 3.4/4\nTOEFL iBT: overall=100; listening=25; reading=25; writing=25; speaking=25',
      mime: 'text/plain', consent: true
    })
  });
  assert.equal(seeded.status, 201, 'seeding the pending document must succeed');

  browser = await chromium.launch({args: ['--no-sandbox'], executablePath: process.env.CHROMIUM_PATH || undefined});
  const context = await browser.newContext({viewport: {width: 1280, height: 900}, deviceScaleFactor: 1});
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() !== 'error') return;
    if (/Failed to load resource: the server responded with a status of 404/.test(message.text())) return;
    errors.push(message.text());
  });
  const failedResponses = [];
  page.on('response', response => {
    if (response.status() < 400) return;
    failedResponses.push(response.status() + ' ' + new URL(response.url()).pathname);
  });
  await page.route('**/api/**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path === '/api/analyze') throw Error('Inference forbidden in workspace inspection');
    const response = await fetch(apiUrl + path, {
      method: request.method(),
      headers: {authorization: request.headers().authorization ?? '', origin: url, 'content-type': 'application/json'},
      body: request.postData() ?? undefined
    });
    await route.fulfill({status: response.status, contentType: response.headers.get('content-type') ?? 'application/json', body: await response.text()});
  });

  // Sign in through the emulator, then reload so the app restores the session.
  await page.goto(url + '/#top');
  const signed = await page.evaluate(async ({config, host, token}) => {
    const module = await import('/verification/support/emulator-session.js');
    return module.signInWithEmulator({...config, emulatorUrl: host, idToken: token});
  }, {config: firebaseConfig, host: emulatorUrl, token: session.idToken});
  assert.equal(signed.uid, session.localId, 'the browser session must belong to the emulator account');
  const storedAfterSignIn = await page.evaluate(() => Object.keys(sessionStorage));
  const served = await (await fetch(url + '/src/auth.js')).text();
  const envExposed = /VITE_FIREBASE_API_KEY/.test(served) ? served.includes(firebaseConfig.apiKey) : true;
  await page.reload();
  // A restored session opens the dashboard from the landing page by itself.
  try {
    await page.locator('#student-dashboard').waitFor({state: 'visible', timeout: 20000});
    await page.locator('#student-dashboard h1').filter({hasText: 'My dashboard'}).waitFor({timeout: 10000});
  } catch (error) {
    const state = await page.evaluate(async () => {
      const auth = await import('/src/auth.js');
      const user = await new Promise(resolve => {
        const timer = setTimeout(() => resolve('timeout'), 4000);
        auth.onAuthChange(next => { clearTimeout(timer); resolve(next ? {uid: next.uid} : null); });
      });
      return {
        hash: location.hash,
        restoredUser: user,
        session: Object.keys(sessionStorage),
        dashboard: !!document.querySelector('#student-dashboard'),
        hidden: document.querySelector('#student-dashboard')?.hidden
      };
    });
    throw new Error('Session was not restored after reload: ' + JSON.stringify({envExposed, storedAfterSignIn, state, errors}));
  }

  const dashboard = page.locator('#student-dashboard');
  const accessibility = async label => {
    const axe = await new AxeBuilder({page}).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    assert.deepEqual(axe.violations.map(v => ({id: v.id, nodes: v.nodes.length})), [], `axe: ${label}`);
  };
  const measure = () => page.evaluate(() => {
    const describe = el => {
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return {
        selector: (el.id ? '#' + el.id : '.' + String(el.className || el.tagName).split(' ')[0]),
        rect: [Math.round(rect.left), Math.round(rect.top), Math.round(rect.width), Math.round(rect.height)],
        display: style.display, position: style.position, visibility: style.visibility,
        detailsOpen: el.closest('details')?.open ?? null
      };
    };
    // Content inside a closed disclosure is not painted, so it cannot overflow
    // the visible page; an open menu is measured by its own scene.
    const painted = el => { const details = el.closest('details'); return !details || details.open; };
    const overflowing = [...document.querySelectorAll('#student-dashboard *')].filter(el => {
      const rect = el.getBoundingClientRect();
      return painted(el) && rect.width > 0 && (rect.right > innerWidth + 1 || rect.left < -1);
    }).slice(0, 6).map(describe);
    const heading = document.querySelector('#student-dashboard h1');
    return {
      hash: location.hash,
      title: heading?.textContent,
      titleSize: heading && getComputedStyle(heading).fontSize,
      dir: document.documentElement.dir,
      scrollWidth: document.documentElement.scrollWidth,
      overflowing
    };
  });
  const capture = async (name, {width = 1280, height = 900, reducedMotion} = {}) => {
    if (only && !only.includes(name)) return;
    await page.setViewportSize({width, height});
    if (reducedMotion) await page.emulateMedia({reducedMotion: 'reduce'});
    else await page.emulateMedia({reducedMotion: 'no-preference'});
    await page.waitForTimeout(320);
    // The page scrolls smoothly, so a fixed wait can photograph a scroll in
    // flight and make a correct landing look wrong.
    await page.evaluate(async () => {
      let previous = -1;
      for (let attempt = 0; attempt < 20 && previous !== window.scrollY; attempt++) {
        previous = window.scrollY;
        await new Promise(resolve => setTimeout(resolve, 60));
      }
    });
    const metrics = await measure();
    // Pixels first: an assertion below must never cost the evidence of what the
    // screen actually looked like.
    await page.screenshot({path: join(outDir, name + '.png')});
    const violations = await new AxeBuilder({page}).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    assert.deepEqual(violations.violations.map(v => ({id: v.id, nodes: v.nodes.length})), [], `axe ${name}`);
    assert.equal(metrics.scrollWidth <= width, true, `horizontal overflow at ${name}: ${metrics.scrollWidth} > ${width}`);
    assert.deepEqual(metrics.overflowing, [], `elements outside the viewport at ${name}: ` + JSON.stringify(metrics.overflowing));
    scenes.push({name, width, reducedMotion: !!reducedMotion, ...metrics, violations: 0});
    return metrics;
  };
  const go = async hash => {
    await page.evaluate(next => { location.hash = next; }, hash);
    await page.waitForTimeout(400);
  };

  await go('#dashboard');
  await dashboard.getByRole('heading', {name: 'My dashboard'}).waitFor();
  await dashboard.getByText(/document to review/).waitFor();
  await capture('01-home-1280-en');

  await dashboard.getByRole('link', {name: 'Documents & profile', exact: true}).click();
  await dashboard.locator('#documents-mount').waitFor({state: 'visible'});
  await capture('02-documents-1280-en');
  await capture('02b-documents-390-en', {width: 390, height: 844});
  await page.setViewportSize({width: 1280, height: 900});

  await dashboard.getByRole('link', {name: 'Dashboard', exact: true}).click();
  await dashboard.getByRole('link', {name: 'Review extracted details'}).click();
  await dashboard.locator('.document-claim').first().waitFor();
  await capture('03-reader-1280-en');
  const entry = await page.evaluate(() => {
    const heading = document.querySelector('#document-reader-heading');
    const legend = document.querySelector('.document-claim legend');
    return {
      scrollY: Math.round(scrollY), top: heading ? Math.round(heading.getBoundingClientRect().top) : null,
      active: document.activeElement?.id,
      legendFont: legend ? getComputedStyle(legend).fontFamily.slice(0, 60) : null
    };
  });
  console.log('reader entry:', JSON.stringify(entry));
  assert.ok(entry.top !== null && entry.top <= 140, 'the reader must open at its own heading: ' + JSON.stringify(entry));
  assert.equal(entry.active, 'document-reader-heading', 'focus enters the reader heading, not a bare container');

  // The reader sequences evidence first, then mapping: capture the lower half
  // where the guided mapping sits before any decision is taken.
  await capture('03d-reader-1280-reduced', {reducedMotion: true});
  await capture('03c-reader-390-en', {width: 390, height: 844});
  await page.setViewportSize({width: 1280, height: 900});
  await dashboard.locator('.document-mapping-host').scrollIntoViewIfNeeded();
  await capture('03b-reader-mapping-1280-en');
  await page.evaluate(() => window.scrollTo(0, 0));
  for (const decision of await dashboard.getByRole('combobox', {name: 'Approve reviewed claims'}).all()) {
    await decision.selectOption('accept');
  }
  await dashboard.getByRole('button', {name: 'Approve reviewed claims', exact: true}).click();
  await dashboard.locator('.document-claim').first().waitFor({state: 'detached'});
  await capture('04-reader-approved-1280-en');

  // Journey: conflicting evidence is surfaced and never silently applied.
  const documentsPanel = dashboard.locator('#documents');
  await documentsPanel.locator('.document-paste summary').click();
  await documentsPanel.locator('.document-paste textarea').fill(
    'SYNTHETIC CONFLICT ONLY\nIssuer: Example University\nDegree: bachelor\nDegree: master'
  );
  await dashboard.locator('#document-consent').check();
  await documentsPanel.getByRole('button', {name: 'Upload and inspect'}).click();
  await expect(documentsPanel.getByText('Conflicting values were found.')).toBeVisible();
  await expect(documentsPanel.locator('.document-source')).toContainText('Degree: master');
  assert.equal(await documentsPanel.locator('.document-claim').count(), 0, 'a conflicting document offers no claim decisions');
  assert.equal(await documentsPanel.getByRole('button', {name: 'Approve reviewed claims'}).count(), 0, 'a conflicting document cannot be approved');
  assert.equal(await documentsPanel.evaluate(el => el.dataset.documentStage), 'review', 'a conflict stays in review and never advances to save');
  await documentsPanel.locator('#document-reader-heading').scrollIntoViewIfNeeded();
  await capture('04b-conflict-1280-en');

  // Journey: uploading the same document again keeps its own record but says so,
  // then deleting the copy leaves the original untouched.
  const beforeCopy = documents.list(session.localId).length;
  await documentsPanel.getByRole('button', {name: 'Upload and inspect'}).click();
  await expect(documentsPanel.locator('.document-duplicate-note')).toBeVisible();
  await expect(documentsPanel.locator('#document-chooser')).toContainText('duplicate');
  assert.equal(documents.list(session.localId).length, beforeCopy + 1, 'the copy keeps its own consent record');
  await documentsPanel.locator('#document-reader-heading').scrollIntoViewIfNeeded();
  await capture('04c-duplicate-1280-en');
  await documentsPanel.getByRole('button', {name: 'Delete document and linked profile facts'}).click();
  await expect(documentsPanel.locator('.document-source')).toHaveCount(0);
  await expect(documentsPanel.locator('.document-duplicate-note')).toHaveCount(0);
  assert.equal(await documentsPanel.evaluate(el => el.dataset.documentStage), 'upload', 'an emptied reader returns the rail to intake');
  await expect.poll(() => documents.list(session.localId).length).toBe(beforeCopy);
  await documentsPanel.locator('fieldset').first().scrollIntoViewIfNeeded();
  await capture('04d-deleted-1280-en');

  await dashboard.getByRole('link', {name: 'Assessments', exact: true}).click();
  await dashboard.locator('#local-workflow-mount').waitFor({state: 'visible'});
  await page.waitForTimeout(600);
  await capture('05-assessments-1280-en');

  // Journey: reviewed catalog → local assessment → PathFinder next step.
  const workflow = dashboard.locator('.local-workflow');
  await workflow.getByRole('button', {name: 'Load reviewed scholarships'}).click();
  await expect(dashboard.locator('#local-program option')).toHaveCount(1);
  await expect(dashboard.locator('#local-program')).toContainText('oxford-clarendon-exclusions');
  await dashboard.locator('#local-degree').selectOption('bachelor');
  await dashboard.locator('#local-consent').check();
  await workflow.getByRole('button', {name: 'Save degree in this scope'}).click();
  await expect(dashboard.locator('#local-status')).toHaveText('Degree saved in the selected scope.');
  await workflow.getByRole('button', {name: 'Assess saved profile'}).click();
  // The catalog declares incomplete coverage, so the honest result is unknown.
  await expect(dashboard.locator('#local-status')).toHaveText('Missing, conflicting or unsupported evidence');
  const assessment = await workflow.innerText();
  assert.match(assessment, /deferred/, 'the cited requirement stays visible');
  assert.match(assessment, /Unknown is not a rejection/, 'an unknown result is never reported as a rejection');
  await expect(page.locator('#next-actions')).toContainText('Next: obtain missing documents');
  const [assessFill, setupFill] = await Promise.all([
    workflow.getByRole('button', {name: 'Assess saved profile'}).evaluate(el => getComputedStyle(el).backgroundColor),
    workflow.getByRole('button', {name: 'Load reviewed scholarships'}).evaluate(el => getComputedStyle(el).backgroundColor)
  ]);
  assert.notEqual(assessFill, setupFill, 'the assess action must outrank the setup actions');
  await capture('05b-assessment-result-1280-en');
  await capture('05d-assessments-768-en', {width: 768, height: 1024});
  await capture('05e-assessments-390-en', {width: 390, height: 844});
  await page.setViewportSize({width: 1280, height: 900});

  // The home summary must now report the assessment it just completed.
  await go('#dashboard');
  await expect(dashboard.getByText('Assessment ready to review')).toBeVisible();
  await capture('05c-home-after-assessment-1280-en');

  // Journey: discovery → saved scholarship keeps its official source link.
  await dashboard.getByRole('link', {name: 'Saved scholarships', exact: true}).click();
  await capture('06-saved-1280-en');
  await dashboard.getByRole('link', {name: 'Browse scholarships'}).click();
  // Only listings that cite a source carry a save control, so drive the first
  // one that does and read the citation from that same card.
  const saveButton = page.locator('#research-explorer [data-research-save]').first();
  await saveButton.waitFor();
  const card = saveButton.locator('xpath=ancestor::article[1]');
  const officialHref = await card.locator('.card-bottom a').first().getAttribute('href');
  assert.match(officialHref, /^https:\/\//, 'a listing must cite its official HTTPS source');
  await saveButton.click();
  await page.locator('#dashboard-entry').click();
  await expect(dashboard.getByText('1 saved scholarship', {exact: true})).toBeVisible();
  await dashboard.getByRole('link', {name: 'Saved scholarships', exact: true}).click();
  await expect(dashboard.locator('.dashboard-saved-list li a')).toHaveAttribute('href', officialHref);
  await expect(dashboard.locator('.dashboard-saved-list li')).toHaveCount(1);
  const [clearFill, browseFill] = await Promise.all([
    dashboard.locator('[data-saved-clear]').evaluate(el => getComputedStyle(el).backgroundColor),
    dashboard.getByRole('link', {name: 'Browse scholarships'}).evaluate(el => getComputedStyle(el).backgroundColor)
  ]);
  assert.notEqual(clearFill, browseFill, 'a destructive action must not look like the primary action');
  await capture('06b-saved-with-official-source-1280-en');

  await dashboard.getByRole('link', {name: 'Verification', exact: true}).click();
  await page.waitForTimeout(400);
  await capture('07-verifications-1280-en');
  // No issuer integration exists locally, so this panel is the unavailable
  // state on purpose. It must explain that honestly, keep the student's own
  // documents listed, and never read as a sign-in problem.
  await expect(dashboard.getByText(/Verification details could not be loaded/).first()).toBeVisible();
  await expect(dashboard.locator('.verification-requests')).toContainText('could not be loaded');
  await expect(dashboard.getByText('Sign in and try again')).toHaveCount(0);
  const selectors = dashboard.locator('.verification-request select');
  assert.deepEqual(await selectors.nth(1).locator('option').allTextContents(), ['No issuing organisation is connected yet.']);
  assert.equal(await selectors.first().locator('option').count(), documents.list(session.localId).length, 'every saved document stays selectable during a provider outage');

  await dashboard.getByRole('link', {name: 'Account', exact: true}).click();
  await capture('08-account-1280-en');

  await dashboard.locator('.dashboard-account summary').click();
  await capture('08b-account-menu-1280-en');
  await dashboard.locator('.dashboard-account summary').click();

  await go('#dashboard');
  await dashboard.locator('#dashboard-language').selectOption('fa');
  await page.waitForTimeout(400);
  await capture('09-home-1280-fa');
  await dashboard.getByRole('link', {name: 'مدارک و پروفایل', exact: true}).click();
  await dashboard.locator('#documents-mount').waitFor({state: 'visible'});
  await capture('10-documents-1280-fa');

  await dashboard.locator('#dashboard-language').selectOption('ps');
  await page.waitForTimeout(400);
  await capture('11-documents-1280-ps');
  await dashboard.locator('#dashboard-language').selectOption('en');
  await page.waitForTimeout(400);

  await go('#dashboard');
  await capture('12-home-390-en', {width: 390, height: 844});
  await capture('13-home-1280-en-reduced', {reducedMotion: true});

  await dashboard.getByRole('link', {name: 'Saved scholarships', exact: true}).click();
  await capture('14-saved-390-en', {width: 390, height: 844});

  writeFileSync(join(outDir, 'report.json'), JSON.stringify({scenes, errors, failedResponses}, null, 1));
  console.log(JSON.stringify({failedResponses, errors, scenes: scenes.map(s => [s.name, s.title, s.titleSize, s.dir])}, null, 1));
  // The local server has no issuer integration, so /api/verifications/providers
  // answers 503 on purpose and the panel is verified in that state above.
  // Chromium logs the failed resource itself; only that line is expected.
  const documented = failedResponses.filter(entry => !/ \/api\/verifications(\/providers)?$/.test(entry));
  assert.deepEqual(documented, [], 'unexpected failed requests');
  const unexpected = failedResponses.length ? errors.filter(line => !/status of 503/.test(line)) : errors;
  assert.deepEqual(unexpected, [], 'no page or console errors');
  console.log('Workspace visual inspection passed for ' + scenes.length + ' scenes');
} finally {
  await browser?.close();
  await server.close();
  if (api.listening) await new Promise(resolve => api.close(resolve));
  documents.close();
  rmSync(directory, {recursive: true, force: true});
}
