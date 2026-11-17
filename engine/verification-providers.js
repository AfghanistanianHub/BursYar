// Issuer credential-verification capability registry.
//
// Every entry was checked on 2026-11-17 against the issuer's own published
// verification documentation (officialUrl). None of these issuers has granted
// BursYar authorized API access, so no provider can be verified automatically:
// `canAutoVerify` is false for all of them and this module can never create an
// issuer-verified status by itself. A request recorded here is a student's
// consent-gated request, not evidence that a credential is genuine.
export const VERIFICATION_STATUSES = Object.freeze([
  'NOT_REQUESTED',
  'PENDING',
  'VERIFIED_BY_ISSUER',
  'REJECTED_BY_ISSUER',
  'MANUAL_REVIEW_REQUIRED',
  'UNAVAILABLE'
]);

// How the issuer confirms a result to a third party.
export const VERIFICATION_ACCESS = Object.freeze([
  'institution_account', // issuer-run portal/API for registered organisations
  'public_lookup',       // anyone can check a reference on the issuer's page
  'qr_app',              // issuer's own QR-code checker
  'issuer_contact',      // issuer/centre confirms on request
  'signed_document'      // issuer-signed digital credential delivered to a verifier
]);

// Evidence kinds that may support an issuer decision. Extraction of any kind is
// deliberately absent: OCR, text parsing and public-web name matching are not
// authenticity evidence and can never promote a credential.
export const ISSUER_EVIDENCE_KINDS = Object.freeze([
  'issuer_portal_confirmation',
  'issuer_api_response',
  'issuer_signed_document',
  'issuer_letter'
]);
const REJECTED_EVIDENCE_KINDS = new Set([
  'ocr', 'text_extraction', 'user_declaration', 'public_web_mention',
  'screenshot', 'model_interpretation'
]);

const provider = entry => Object.freeze({
  ...entry,
  verification: Object.freeze(entry.verification),
  canAutoVerify: false
});

const PROVIDERS = [
  provider({
    id: 'ielts', name: 'IELTS', category: 'english',
    issuer: 'IELTS Partners (British Council, IDP IELTS, Cambridge University Press & Assessment)',
    referenceLabel: 'Test Report Form (TRF) number',
    verification: {
      mechanism: 'IELTS Results Service (Test Report Form verification and e-delivery)',
      access: 'institution_account', requiresIssuerAuthorization: true, apiAvailable: true,
      officialUrl: 'https://ielts.org/organisations/ielts-for-organisations/verifying-ielts-results',
      note: 'Organisations registered to accept IELTS verify a TRF number or receive results by e-delivery; bulk API import is available to registered organisations.'
    }
  }),
  provider({
    id: 'toefl', name: 'TOEFL iBT', category: 'english',
    issuer: 'ETS',
    referenceLabel: 'ETS appointment number',
    verification: {
      mechanism: 'ETS Online Score Verification System (OSVS) in the ETS Data Manager',
      access: 'institution_account', requiresIssuerAuthorization: true, apiAvailable: true,
      officialUrl: 'https://www.ets.org/toefl/institutions/ibt/report-scores.html',
      note: 'Institutions verify scores in the ETS Data Manager; server-to-server score feeds require a one-time institutional setup.'
    }
  }),
  provider({
    id: 'duolingo_english_test', name: 'Duolingo English Test', category: 'english',
    issuer: 'Duolingo',
    referenceLabel: 'Test date or result reference',
    verification: {
      mechanism: 'Duolingo English Test results dashboard for accepting institutions',
      access: 'institution_account', requiresIssuerAuthorization: true, apiAvailable: true,
      officialUrl: 'https://englishtest.duolingo.com/edu',
      note: 'Candidates share certified results with an accepting institution, which reads them in the free results dashboard; CRM/API integration is documented for institutions.'
    }
  }),
  provider({
    id: 'cambridge_english', name: 'Cambridge English Qualifications', category: 'english',
    issuer: 'Cambridge University Press & Assessment',
    referenceLabel: 'Candidate or statement-of-results reference',
    verification: {
      mechanism: 'Cambridge English Results Verification Service (RVS)',
      access: 'institution_account', requiresIssuerAuthorization: true, apiAvailable: true,
      officialUrl: 'https://www.cambridgeenglish.org/educators-organisations/accept-verify-exams/higher-education-institutions/verify-results-online',
      note: 'The free RVS is for administrators in higher education, business and government; API integration with an institution database is supported.'
    }
  }),
  provider({
    id: 'pte_academic', name: 'PTE Academic', category: 'english',
    issuer: 'Pearson',
    referenceLabel: 'Score Report Code (SRC) or Registration ID',
    verification: {
      mechanism: 'Pearson Score Report Website (SRW)',
      access: 'institution_account', requiresIssuerAuthorization: true, apiAvailable: false,
      officialUrl: 'https://www.pearsonpte.com/accept-pte/scoring/verify-scores',
      note: 'Institutions verify a score in the SRW; Pearson states paper and PDF score reports are not accepted. No public API is documented.'
    }
  }),
  provider({
    id: 'goethe', name: 'Goethe-Zertifikat', category: 'german',
    issuer: 'Goethe-Institut',
    referenceLabel: 'Zeugnisnummer (certificate number)',
    verification: {
      mechanism: 'goethe.de/verify certificate verification',
      access: 'public_lookup', requiresIssuerAuthorization: false, apiAvailable: false,
      officialUrl: 'https://verify.goethe.de/verify/index.html',
      note: 'Certificate number, date of birth and issue date are checked against the Goethe-Institut record; results are archived for ten years.'
    }
  }),
  provider({
    id: 'testdaf', name: 'TestDaF', category: 'german',
    issuer: 'g.a.s.t. (TestDaF-Institut)',
    referenceLabel: 'Teilnehmenden-Nummer (participant number)',
    verification: {
      mechanism: 'g.a.s.t. TestDaF certificate verification form and certificate QR code',
      access: 'public_lookup', requiresIssuerAuthorization: false, apiAvailable: false,
      officialUrl: 'https://www.gast.de/portal/certificate/verification-testdaf-form',
      note: 'The verification form compares participant number, name, birth date, test format and TDN results with the g.a.s.t. record.'
    }
  }),
  provider({
    id: 'telc', name: 'telc', category: 'german',
    issuer: 'telc gGmbH',
    referenceLabel: 'Test taker number',
    verification: {
      mechanism: 'telc certificate verification portal (QR code or test taker number)',
      access: 'public_lookup', requiresIssuerAuthorization: false, apiAvailable: false,
      officialUrl: 'https://www.telc.net/en/language-examinations/verification-of-telc-certificates/',
      note: 'Only certificates printed with a QR code can be checked this way; test taker number, birth date and issue date are required.'
    }
  }),
  provider({
    id: 'osd', name: 'ÖSD', category: 'german',
    issuer: 'Österreichisches Sprachdiplom Deutsch',
    referenceLabel: 'Certificate number',
    verification: {
      mechanism: 'ÖSD Cert Checker QR verification',
      access: 'qr_app', requiresIssuerAuthorization: false, apiAvailable: false,
      officialUrl: 'https://osd.at/links-cert-checker-app/',
      note: 'ÖSD releases results only through the examination centre and issues no results to third parties; passing certificates carry a QR code for the ÖSD Cert Checker app.'
    }
  }),
  provider({
    id: 'delf', name: 'DELF', category: 'french',
    issuer: 'France Éducation international',
    referenceLabel: 'Diploma number',
    verification: {
      mechanism: 'France Éducation international / examination-centre diploma confirmation',
      access: 'issuer_contact', requiresIssuerAuthorization: true, apiAvailable: false,
      officialUrl: 'https://www.france-education-international.fr/en/hub/diplomes-tests',
      note: 'DELF diplomas are issued for life through authorised examination centres; no public third-party lookup is documented, so confirmation is requested from the issuer or centre.'
    }
  }),
  provider({
    id: 'dalf', name: 'DALF', category: 'french',
    issuer: 'France Éducation international',
    referenceLabel: 'Diploma number',
    verification: {
      mechanism: 'France Éducation international / examination-centre diploma confirmation',
      access: 'issuer_contact', requiresIssuerAuthorization: true, apiAvailable: false,
      officialUrl: 'https://www.france-education-international.fr/en/hub/diplomes-tests',
      note: 'DALF diplomas are valid for life; no public third-party lookup is documented, so confirmation is requested from the issuer or centre.'
    }
  }),
  provider({
    id: 'tcf', name: 'TCF', category: 'french',
    issuer: 'France Éducation international',
    referenceLabel: 'Attestation number',
    verification: {
      mechanism: 'France Éducation international attestation confirmation',
      access: 'issuer_contact', requiresIssuerAuthorization: true, apiAvailable: false,
      officialUrl: 'https://www.france-education-international.fr/test/tcf-tout-public',
      note: 'The candidate downloads an attestation from the TCF candidate space; it is valid for two years and third-party confirmation is requested from the issuer.'
    }
  }),
  provider({
    id: 'tef', name: 'TEF', category: 'french',
    issuer: 'CCI Paris Ile-de-France',
    referenceLabel: 'Attestation number',
    verification: {
      mechanism: 'CCI Paris Ile-de-France TEF attestation confirmation',
      access: 'issuer_contact', requiresIssuerAuthorization: true, apiAvailable: false,
      officialUrl: 'https://www.cci-paris-idf.fr/fr/education/formation-continue-valorisation-competences/certification-francais-tef',
      note: 'TEF results are valid for two years; no public third-party lookup is documented, so confirmation is requested from the issuer.'
    }
  }),
  provider({
    id: 'mycreds', name: 'MyCreds digital credential', category: 'academic',
    issuer: 'MyCreds (ARUCC) — issuing institution',
    referenceLabel: 'MyCreds document or share reference',
    verification: {
      mechanism: 'MyCreds digitally signed credential shared with a verifier',
      access: 'signed_document', requiresIssuerAuthorization: true, apiAvailable: false,
      officialUrl: 'https://mycreds.ca/',
      note: 'Officially issued documents carry a digital signature and are shared to a verifier through the MyCreds platform; receiving organisations are onboarded by MyCreds.'
    }
  })
];

const byId = new Map(PROVIDERS.map(p => [p.id, p]));

for (const entry of PROVIDERS) {
  if (!/^[a-z0-9_]{2,40}$/.test(entry.id) || byId.size !== PROVIDERS.length) throw Error('Invalid verification provider registry');
  if (!VERIFICATION_ACCESS.includes(entry.verification.access)) throw Error('Invalid verification access type');
  const url = new URL(entry.verification.officialUrl);
  if (url.protocol !== 'https:' || url.username || url.password) throw Error('Verification sources must be public HTTPS URLs');
}

export function getVerificationProvider(id) {
  return typeof id === 'string' ? byId.get(id) ?? null : null;
}

// Public descriptor list. Contains no secrets, credentials or authorisation
// status that could be mistaken for working access.
export function listVerificationProviders() {
  return PROVIDERS.map(entry => ({
    id: entry.id,
    name: entry.name,
    category: entry.category,
    issuer: entry.issuer,
    referenceLabel: entry.referenceLabel,
    mechanism: entry.verification.mechanism,
    access: entry.verification.access,
    officialUrl: entry.verification.officialUrl,
    requiresIssuerAuthorization: entry.verification.requiresIssuerAuthorization,
    apiAvailable: entry.verification.apiAvailable,
    autoVerificationAvailable: false,
    note: entry.verification.note
  }));
}

// Validates issuer-side evidence for a decided request. Extraction, OCR and
// user declarations are rejected outright, regardless of caller claims.
export function isIssuerEvidenceAllowed(providerId, evidence) {
  const entry = getVerificationProvider(providerId);
  if (!entry || !evidence || typeof evidence !== 'object' || Array.isArray(evidence)) return false;
  if (REJECTED_EVIDENCE_KINDS.has(evidence.kind)) return false;
  if (!ISSUER_EVIDENCE_KINDS.includes(evidence.kind)) return false;
  if (typeof evidence.authenticatedAt !== 'string' || !Number.isFinite(Date.parse(evidence.authenticatedAt))) return false;
  if (typeof evidence.issuerStatement !== 'string' || !evidence.issuerStatement.trim() || evidence.issuerStatement.length > 2000) return false;
  if (typeof evidence.issuer !== 'string' || !evidence.issuer.trim() || evidence.issuer.length > 200) return false;
  if (evidence.reference !== undefined && evidence.reference !== null && typeof evidence.reference !== 'string') return false;
  return true;
}
