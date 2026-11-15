import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  officialVerificationRoutes,
  officialVerificationReviewedAt,
  myCredsInstitutions,
  myCredsShareRoute,
  verificationRouteKinds,
  resolveOfficialVerificationRoute,
  routeForExactTest,
  programAcceptanceStatus,
  createVerificationState,
  markRequestedByStudent,
  noteOfficialLinkOpened,
  reviewedOfficialUrl,
  verificationCopy,
  issuerVerificationEvidenceFields
} from '../src/official-verification.js';

const ARABIC = /[\u0600-\u06ff]/;

function shapeEqual(path, en, other) {
  if (typeof en === 'string' || typeof other === 'string') {
    assert.equal(typeof en, 'string', `${path} en type`);
    assert.equal(typeof other, 'string', `${path} other type`);
    return;
  }
  if (Array.isArray(en) || Array.isArray(other)) {
    assert.ok(Array.isArray(en) && Array.isArray(other), `${path} array`);
    assert.equal(en.length, other.length, `${path} length`);
    en.forEach((item, index) => shapeEqual(`${path}[${index}]`, item, other[index]));
    return;
  }
  assert.ok(en && typeof en === 'object', `${path} en object`);
  assert.ok(other && typeof other === 'object', `${path} other object`);
  assert.deepEqual(Object.keys(other).sort(), Object.keys(en).sort(), `${path} keys`);
  for (const key of Object.keys(en)) shapeEqual(`${path}.${key}`, en[key], other[key]);
}

function collectStrings(value, out = []) {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) for (const item of value) collectStrings(item, out);
  else if (value && typeof value === 'object') for (const item of Object.values(value)) collectStrings(item, out);
  return out;
}

test('verification copy keeps identical structure in en/fa/ps and localizes fa/ps', () => {
  assert.deepEqual(Object.keys(verificationCopy).sort(), ['en', 'fa', 'ps']);
  shapeEqual('verificationCopy', verificationCopy.en, verificationCopy.fa);
  shapeEqual('verificationCopy', verificationCopy.en, verificationCopy.ps);
  for (const language of ['fa', 'ps']) {
    for (const value of collectStrings(verificationCopy[language])) {
      assert.ok(value.trim().length > 0, `${language} empty string`);
      assert.match(value, ARABIC, `${language}: ${value.slice(0, 48)}`);
    }
    assert.deepEqual(
      Object.keys(verificationCopy[language].routes).sort(),
      Object.keys(verificationCopy.en.routes).sort(),
      `${language} route copy keys`
    );
  }
  assert.equal(verificationCopy.fa.action, 'استعلام از مرجع صادرکننده');
  assert.ok(verificationCopy.ps.action.includes('صادرونکي'));
});

test('every reviewed route records exact test, issuer, kind, actor, action, URL and review date', () => {
  const ids = new Set();
  const variants = new Set();
  for (const route of officialVerificationRoutes) {
    assert.ok(!ids.has(route.id), `duplicate route id ${route.id}`);
    ids.add(route.id);
    assert.ok(Object.values(verificationRouteKinds).includes(route.routeKind), `${route.id} kind`);
    assert.equal(typeof route.issuer, 'string');
    assert.ok(route.issuer.length > 0, `${route.id} issuer`);
    assert.equal(typeof route.intendedActor, 'string');
    assert.ok(route.intendedActor.length > 0, `${route.id} actor`);
    assert.equal(typeof route.action, 'string');
    assert.equal(route.reviewedAt, officialVerificationReviewedAt, `${route.id} review date`);
    assert.ok(reviewedOfficialUrl(route.sourceUrl), `${route.id} source URL`);
    assert.ok(route.variants.length > 0, `${route.id} variants`);
    for (const variant of route.variants) {
      assert.ok(!variants.has(variant.toLowerCase()), `duplicate variant ${variant}`);
      variants.add(variant.toLowerCase());
      assert.equal(routeForExactTest(variant).id, route.id, `${variant} resolves to ${route.id}`);
    }
  }
  for (const institution of myCredsInstitutions) {
    assert.equal(institution.reviewedAt, officialVerificationReviewedAt);
    assert.ok(reviewedOfficialUrl(institution.sourceUrl));
    assert.ok(institution.documentTypes.length > 0);
  }
});

test('IELTS resolves to the student sharing route and names the receiving organisation as verifier', () => {
  for (const variant of ['IELTS Academic', 'IELTS General Training']) {
    const route = resolveOfficialVerificationRoute({ test: variant });
    assert.equal(route.id, 'ielts');
    assert.equal(route.routeKind, verificationRouteKinds.officialDelivery);
    assert.equal(route.intendedActor, 'receiving_institution');
    assert.equal(route.sourceUrl, 'https://ielts.org/take-a-test/your-results/getting-and-sharing-your-results');
    assert.equal(route.organisationUrl, 'https://ielts.org/organisations/ielts-for-organisations/verifying-ielts-results');
    assert.notEqual(route.sourceUrl, route.organisationUrl);
    assert.match(verificationCopy.en.routes.ielts.who, /receiving university or organisation/i);
    assert.match(verificationCopy.en.routes.ielts.summary, /receiving university or organisation/i);
  }
});

test('MyCreds is offered only for a reviewed institution and document type', () => {
  const supported = resolveOfficialVerificationRoute({
    documentType: 'official_transcript',
    institutionId: 'university-of-manitoba'
  });
  assert.equal(supported.id, 'mycreds');
  assert.equal(supported.institution, 'University of Manitoba');
  assert.equal(supported.sourceUrl, myCredsShareRoute.sourceUrl);
  assert.equal(supported.institutionSourceUrl, 'https://umanitoba.ca/registrar/mycreds');
  assert.match(verificationCopy.en.routes.mycreds.next, /share link/i);

  const unsupportedType = resolveOfficialVerificationRoute({
    documentType: 'degree_certificate',
    institutionId: 'university-of-manitoba'
  });
  assert.equal(unsupportedType.id, 'registrar');
  assert.equal(unsupportedType.confirmed, false);

  const unknownInstitution = resolveOfficialVerificationRoute({
    documentType: 'official_transcript',
    institutionId: 'unknown-university'
  });
  assert.equal(unknownInstitution.id, 'registrar');
  assert.equal(unknownInstitution.confirmed, false);
  assert.equal(unknownInstitution.sourceUrl, null);

  assert.equal(resolveOfficialVerificationRoute({ documentType: 'official_transcript' }).id, 'registrar');
  assert.equal(resolveOfficialVerificationRoute({}), null);
});

test('wrong exams and variants never reuse another route', () => {
  const unsupported = [
    'TOEFL Essentials',
    'IELTS Life Skills',
    'Goethe-Test PRO',
    'TCF DAP',
    'TEF Canada',
    'DELF Prim',
    'TestDaF digital (other product)'
  ];
  for (const test of unsupported) {
    const route = resolveOfficialVerificationRoute({ test });
    assert.equal(routeForExactTest(test), null, `${test} must not map to a variant`);
    assert.equal(route.confirmed, false, `${test} must be unconfirmed`);
    assert.equal(route.id, 'unconfirmed', `${test} fallback id`);
    assert.equal(route.sourceUrl, null, `${test} must not link another route`);
    assert.notEqual(route.id, 'tef_etudes');
    assert.notEqual(route.id, 'tcf');
    assert.notEqual(route.id, 'toefl_ibt');
  }
  assert.equal(routeForExactTest('TCF Canada').id, 'tcf');
  assert.equal(routeForExactTest('TEF Études').id, 'tef_etudes');
  assert.notEqual(routeForExactTest('TEF Études').sourceUrl, routeForExactTest('TCF Canada').sourceUrl);
});

test('TCF uses FEI’s real authentication page, never a lookalike domain', () => {
  const route = resolveOfficialVerificationRoute({ test: 'TCF Canada' });
  assert.equal(route.id, 'tcf');
  assert.equal(route.routeKind, verificationRouteKinds.issuerVerification);
  assert.equal(route.action, 'verify_attestation_on_issuer_site');
  assert.equal(route.intendedActor, 'student_or_institution');
  assert.equal(route.sourceUrl, 'https://controle.france-education-international.fr/');
  const { hostname } = new URL(route.sourceUrl);
  assert.equal(hostname, 'controle.france-education-international.fr');
  for (const lookalike of [
    'control-france-education-international.fr',
    'controle.france-educations-international.fr',
    'contolfranceeducationinternationle.fr',
    'france-education-internationals.fr'
  ]) {
    assert.notEqual(hostname, lookalike, `must not use ${lookalike}`);
  }
  for (const language of ['en', 'fa', 'ps']) {
    const copy = verificationCopy[language].routes.tcf;
    assert.match(copy.summary, /France Éducation international|فرانس/, `${language} names FEI`);
    assert.match(copy.next, /controle\.france-education-international\.fr/, `${language} names the official domain`);
    assert.match(copy.next, /QR/, `${language} warns about copied QR links`);
  }
});

test('program acceptance is confirmed only by an exact test and variant in the official requirements', () => {
  assert.equal(
    programAcceptanceStatus({ test: 'IELTS', variant: 'IELTS Academic', requirements: 'IELTS Academic with overall 6.5' }),
    'confirmed'
  );
  assert.equal(
    programAcceptanceStatus({ test: 'IELTS', variant: 'IELTS Academic', requirements: 'IELTS with overall 6.5' }),
    'not_confirmed',
    'ambiguous IELTS wording must not confirm the Academic variant'
  );
  assert.equal(
    programAcceptanceStatus({ test: 'IELTS', variant: 'IELTS Academic', requirements: 'TOEFL iBT 90 accepted' }),
    'not_confirmed',
    'another exam must not confirm IELTS'
  );
  assert.equal(
    programAcceptanceStatus({ test: 'TEF Études', requirements: 'TEF Canada accepted for immigration' }),
    'not_confirmed',
    'TEF Canada must not confirm TEF Études'
  );
  assert.equal(
    programAcceptanceStatus({ test: 'TOEFL iBT', requirements: 'TOEFL iBT 90' }),
    'confirmed'
  );
  assert.equal(programAcceptanceStatus({ test: 'TOEFL iBT', requirements: '' }), 'not_confirmed');
  assert.equal(programAcceptanceStatus({}), 'not_confirmed');
});

test('request markers and link openings never promote credential or identity verification', () => {
  const initial = createVerificationState();
  assert.equal(initial.credential, 'not_verified');
  assert.equal(initial.identity, 'not_verified');
  assert.equal(initial.requestMarked, false);

  const marked = markRequestedByStudent(initial);
  assert.equal(marked.requestMarked, true);
  assert.equal(marked.credential, 'not_verified');
  assert.equal(marked.identity, 'not_verified');

  assert.deepEqual(noteOfficialLinkOpened(marked), marked);
  assert.equal(noteOfficialLinkOpened(marked).credential, 'not_verified');

  assert.deepEqual(issuerVerificationEvidenceFields, [
    'credential',
    'verifyingAuthority',
    'method',
    'verificationDate',
    'reference'
  ]);
  const source = readFileSync(new URL('../src/official-verification.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /issuer_verified/);
  assert.doesNotMatch(source, /credential:\s*'verified'/);
  assert.doesNotMatch(source, /authenticity:\s*'verified'/);
  assert.match(source, /credential: 'not_verified'/);
});

test('outbound destinations reject query strings, fragments, credentials and non-HTTPS URLs', () => {
  assert.equal(reviewedOfficialUrl('https://www.ets.org/toefl'), 'https://www.ets.org/toefl');
  for (const url of [
    'http://www.ets.org/toefl',
    'https://www.ets.org/toefl?trf=123456',
    'https://www.ets.org/toefl#score',
    'https://user:pass@www.ets.org/toefl',
    'javascript:alert(1)',
    '/relative',
    null
  ]) {
    assert.equal(reviewedOfficialUrl(url), null, String(url));
  }
  for (const route of [...officialVerificationRoutes, myCredsShareRoute]) {
    for (const url of [route.sourceUrl, route.organisationUrl]) {
      if (url) assert.ok(reviewedOfficialUrl(url), `${route.id} has an unsafe URL`);
    }
  }
});

test('verification UI is local-only and announces external official links', () => {
  const panel = readFileSync(new URL('../src/document-verification.js', import.meta.url), 'utf8');
  assert.doesNotMatch(panel, /fetch\s*\(/);
  assert.doesNotMatch(panel, /XMLHttpRequest|sendBeacon|navigator\.clipboard\.readText/);
  assert.match(panel, /reviewedOfficialUrl\(/);
  assert.match(panel, /link\.target = '_blank'/);
  assert.match(panel, /link\.rel = 'noopener noreferrer'/);
  assert.match(panel, /link\.referrerPolicy = 'no-referrer'/);
  assert.match(panel, /aria-describedby/);
  assert.match(panel, /markRequestedByStudent/);
  assert.doesNotMatch(panel, /issuer_verified/);
});

test('documents dashboard wires the entry point without changing review or status APIs', () => {
  const documents = readFileSync(new URL('../src/documents.js', import.meta.url), 'utf8');
  assert.match(documents, /import \{mountDocumentVerification\}/);
  assert.match(documents, /import \{verificationCopy\}/);
  assert.match(documents, /verifyList/);
  assert.match(documents, /mountDocumentVerification\(verifyPanel/);
  assert.doesNotMatch(documents, /issuer_verified/);
  assert.doesNotMatch(documents, /authenticity\s*=\s*'verified'/);
});

test('generic request template carries no identifier, attachment, or personal data', () => {
  for (const language of ['en', 'fa', 'ps']) {
    const template = verificationCopy[language].templateBody;
    assert.doesNotMatch(template, /\b\d{6,}\b/, `${language} template must not prefill identifiers`);
    assert.doesNotMatch(template, /TRF|passport|date of birth|Candidate Number/i, `${language} template identifiers`);
    assert.match(template, /attach|پیوست|ضمیمه/i, `${language} template states nothing is attached`);
  }
});
