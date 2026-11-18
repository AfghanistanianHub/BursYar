#!/usr/bin/env node
// Live check of the credential-verification API on a deployed BursYar backend.
//
//   node scripts/verify-live-verification-api.mjs \
//     --base=https://bursyar.vercel.app \
//     --expect-commit=$(git ls-remote origin refs/heads/main | cut -f1)
//
// Unauthenticated checks need no credentials: they prove the deployed build
// exposes the routes (/api/verifications answers 401, not 404) and rejects a
// foreign Origin with 403. Set BURSYAR_VERIFY_TOKEN to a real Firebase ID token
// to also exercise the authenticated create/list/withdraw path end to end. The
// synthetic document and request it creates are deleted again at the end.
//
// A skipped check is never counted as a pass: the summary reports it separately
// and names what the run did not prove. Without BURSYAR_VERIFY_TOKEN the
// authenticated leg is skipped; pass --require-auth to turn that into a failure
// (for a gate that must not report success on unverified authentication).
//
// Exit status is 0 only when every executed check passes; a 404 here means the
// backend build is older than the release that added the verification routes.
import {randomUUID} from 'node:crypto';

const args = new Map(process.argv.slice(2).map(raw => {
  const [key, ...rest] = raw.replace(/^--/, '').split('=');
  return [key, rest.join('=')];
}));
const base = (args.get('base') || 'https://bursyar.vercel.app').replace(/\/$/, '');
const expectCommit = args.get('expect-commit') || process.env.BURSYAR_EXPECT_COMMIT || null;
const token = process.env.BURSYAR_VERIFY_TOKEN || null;
const asJson = args.has('json');
const origin = base;
const foreignOrigin = 'https://foreign-origin.invalid';

const results = [];
function record(name, ok, detail, {skipped = false} = {}) {
  results.push({name, ok, detail, skipped});
  if (!asJson) console.log((skipped ? 'SKIP ' : ok ? 'PASS ' : 'FAIL ') + name.padEnd(26) + ' ' + detail);
}

async function call(path, {method = 'GET', body, headers = {}, timeoutMs = 60000} = {}) {
  const response = await fetch(base + path, {
    method,
    headers: {
      ...(body === undefined ? {} : {'content-type': 'application/json'}),
      ...headers
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs)
  });
  const text = await response.text();
  let parsed = null;
  try { parsed = JSON.parse(text); } catch { /* non-JSON error pages are reported as text */ }
  return {status: response.status, body: parsed, text: text.slice(0, 200)};
}

// A free-plan service can be asleep; the first request may take a while, so the
// health probe is retried before any route assertion is judged.
async function health() {
  let last = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      last = await call('/health');
      if (last.status === 200) return last;
    } catch (error) { last = {status: 0, text: String(error?.message ?? error)}; }
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  return last;
}

const service = {name: 'context', actor: 'service', key: randomUUID()};

async function unauthenticated() {
  const check = await health();
  const commit = check.body?.capabilities?.build?.commit ?? check.body?.build?.commit ?? null;
  record('health', check.status === 200 && (!expectCommit || commit === expectCommit),
    check.status === 200
      ? 'commit ' + (commit ? commit.slice(0, 7) : 'unknown') + (expectCommit && commit !== expectCommit ? ' != expected ' + expectCommit.slice(0, 7) : '')
      : 'status ' + check.status + ' ' + check.text);

  // 401 proves the route exists behind authentication; 404 proves this build
  // predates the verification release.
  const list = await call('/api/verifications');
  record('GET /api/verifications', list.status === 401, 'status ' + list.status + ' ' + (list.body?.error ?? list.text));

  const providers = await call('/api/verifications/providers');
  record('GET .../providers', providers.status === 401, 'status ' + providers.status + ' ' + (providers.body?.error ?? providers.text));

  // The origin check runs before authentication, so a foreign Origin is denied
  // on a deployed build even without a token.
  const foreign = await call('/api/verifications', {
    method: 'POST', body: {}, headers: {origin: foreignOrigin}
  });
  record('foreign Origin denied', foreign.status === 403, 'status ' + foreign.status + ' ' + (foreign.body?.error ?? foreign.text));

  // Distinguishes a missing route from a broken proxy: another protected API
  // route must still authenticate.
  const exportRoute = await call('/api/export');
  record('proxy reaches backend', exportRoute.status === 401, 'status ' + exportRoute.status + ' ' + (exportRoute.body?.error ?? exportRoute.text));
}

async function authenticated() {
  if (!token) {
    record('authenticated flow', true,
      'no BURSYAR_VERIFY_TOKEN: create/list/withdraw were not exercised', {skipped: true});
    return;
  }
  const auth = {authorization: 'Bearer ' + token, origin};

  const providers = await call('/api/verifications/providers', {headers: auth});
  const list = Array.isArray(providers.body?.providers) ? providers.body.providers : [];
  const leak = JSON.stringify(providers.body ?? {}).match(/"(?:api[_-]?key|secret|password|access[_-]?token|bearer)"\s*:/i);
  const complete = list.every(p => typeof p?.id === 'string' && typeof p?.name === 'string'
    && (p?.verification?.officialUrl ?? p?.officialUrl ?? '').startsWith('https://') && p?.autoVerificationAvailable === false);
  record('providers matrix', providers.status === 200 && providers.body?.autoVerificationAvailable === false
      && list.length > 0 && complete && !leak,
    'status ' + providers.status + ', ' + list.length + ' issuers, autoVerificationAvailable=' + providers.body?.autoVerificationAvailable
      + ', https issuer URLs and no auto-verify: ' + complete + (leak ? ', credential field present' : ''));
  if (!list.length) return;

  const document = await call('/api/documents', {
    method: 'POST', headers: auth,
    body: {consent: true, mime: 'text/plain', text: 'IELTS Academic overall 7.5 (synthetic release check)', requestId: randomUUID()}
  });
  const documentId = document.body?.id;
  record('upload synthetic document', document.status === 201 && typeof documentId === 'string',
    'status ' + document.status + (document.status === 201 ? '' : ' ' + (document.body?.error ?? document.text)));
  if (typeof documentId !== 'string') return;

  const created = await call('/api/verifications', {
    method: 'POST', headers: auth,
    body: {consent: true, providerId: list[0].id, documentId, reference: 'live-check-' + Date.now()}
  });
  const requestId = created.body?.id;
  record('create request', created.status === 201 && created.body?.status === 'PENDING'
      && created.body?.provider?.autoVerificationAvailable === false,
    'status ' + created.status + ' record ' + (created.body?.status ?? created.body?.error ?? created.text));

  if (typeof requestId === 'string') {
    const listed = await call('/api/verifications', {headers: auth});
    const ids = (listed.body?.requests ?? []).map(r => r.id);
    record('list shows request', listed.status === 200 && ids.includes(requestId), 'status ' + listed.status + ', ' + ids.length + ' request(s)');

    const withdrawn = await call('/api/verifications/' + requestId, {method: 'DELETE', headers: auth});
    record('withdraw request', withdrawn.status === 200 && withdrawn.body?.withdrawn === true,
      'status ' + withdrawn.status + ' ' + (withdrawn.body?.status ?? withdrawn.body?.error ?? withdrawn.text));

    const after = await call('/api/verifications', {headers: auth});
    const remaining = (after.body?.requests ?? []).map(r => r.id);
    record('withdrawal persisted', after.status === 200 && !remaining.includes(requestId), 'status ' + after.status + ', ' + remaining.length + ' remaining');
  }

  const removed = await call('/api/documents/' + documentId, {method: 'DELETE', headers: auth});
  record('delete synthetic document', removed.status === 200, 'status ' + removed.status + ' ' + (removed.body?.error ?? ''));
}

try {
  await unauthenticated();
  await authenticated();
} catch (error) {
  record('probe completed', false, 'request failed: ' + String(error?.message ?? error));
}

const failed = results.filter(result => !result.ok);
const skipped = results.filter(result => result.skipped);
const requireAuth = args.has('require-auth');
if (asJson) {
  console.log(JSON.stringify({
    base, expectCommit, results,
    passed: !failed.length && !(requireAuth && skipped.length),
    skipped: skipped.map(result => result.name)
  }, null, 2));
} else {
  console.log('\n' + (results.length - failed.length - skipped.length) + ' passed, '
    + failed.length + ' failed, ' + skipped.length + ' skipped against ' + base);
  if (skipped.length) {
    console.log('NOT PROVEN by this run: ' + skipped.map(result => result.name).join(', ')
      + '. Set BURSYAR_VERIFY_TOKEN to exercise it' + (requireAuth ? '' : ' (or pass --require-auth to fail instead).'));
  }
  if (failed.length) {
    const missing = results.find(result => result.name.startsWith('GET /api/verifications') && /status 404/.test(result.detail));
    if (missing) console.log('The deployed backend build does not include the verification routes (404, not 401).');
  }
}
process.exit(failed.length || (requireAuth && skipped.length) ? 1 : 0);
