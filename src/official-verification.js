// Official document verification pathways.
//
// This module is the reviewed configuration and the pure logic behind the
// dashboard's "Verify with the issuer" panel. Nothing here contacts a network,
// reads a document, or accepts a destination from document text. Every outbound
// link is an absolute HTTPS URL reviewed on the date recorded on the route.
//
// Three concepts stay independent everywhere:
//   * the student reviewed extracted information (documents.js),
//   * the issuer verified the document (authenticity),
//   * the document holder's identity was verified (identity, not offered here).
// No route, link, request marker, or scholarship match changes either status.
// fa/ps strings are UNREVIEWED pending fluent human review (see
// docs/TRANSLATION-REVIEW.json and docs/OFFICIAL-VERIFICATION-PATHWAYS.md).

export const officialVerificationReviewedAt = '2026-11-14';

export const verificationRouteKinds = Object.freeze({
  officialDelivery: 'official_delivery',
  issuerVerification: 'issuer_verification',
  issuerContact: 'issuer_contact'
});

// Exact test/variant names only. A route never covers a different exam, a
// different variant, or a Home Edition / Essentials / PRO product that the
// reviewed source did not confirm.
export const officialVerificationRoutes = Object.freeze([
  Object.freeze({
    id: 'ielts',
    test: 'IELTS',
    variants: Object.freeze(['IELTS Academic', 'IELTS General Training']),
    issuer: 'IELTS (British Council, IDP IELTS, Cambridge University Press & Assessment)',
    documentType: 'language_test',
    routeKind: verificationRouteKinds.officialDelivery,
    intendedActor: 'receiving_institution',
    action: 'share_official_result',
    sourceUrl: 'https://ielts.org/take-a-test/your-results/getting-and-sharing-your-results',
    organisationUrl: 'https://ielts.org/organisations/ielts-for-organisations/verifying-ielts-results',
    reviewedAt: officialVerificationReviewedAt,
    confirmed: true
  }),
  Object.freeze({
    id: 'toefl_ibt',
    test: 'TOEFL iBT',
    variants: Object.freeze(['TOEFL iBT']),
    issuer: 'ETS',
    documentType: 'language_test',
    routeKind: verificationRouteKinds.officialDelivery,
    intendedActor: 'receiving_institution',
    action: 'send_official_scores',
    sourceUrl: 'https://www.ets.org/toefl/test-takers/ibt/scores/send-scores.html',
    reviewedAt: officialVerificationReviewedAt,
    confirmed: true
  }),
  Object.freeze({
    id: 'duolingo',
    test: 'Duolingo English Test',
    variants: Object.freeze(['Duolingo English Test']),
    issuer: 'Duolingo',
    documentType: 'language_test',
    routeKind: verificationRouteKinds.officialDelivery,
    intendedActor: 'receiving_institution',
    action: 'share_official_result',
    sourceUrl: 'https://englishtest.duolingo.com/sharing',
    reviewedAt: officialVerificationReviewedAt,
    confirmed: true
  }),
  Object.freeze({
    id: 'testdaf',
    test: 'TestDaF',
    variants: Object.freeze(['TestDaF']),
    issuer: 'g.a.s.t. (TestDaF-Institut)',
    documentType: 'language_test',
    routeKind: verificationRouteKinds.issuerVerification,
    intendedActor: 'student_or_institution',
    action: 'verify_on_issuer_site',
    sourceUrl: 'https://www.testdaf.de/de/hochschulen/der-testdaf-und-hochschulen/verifikation-des-testdaf-zertifikats',
    reviewedAt: officialVerificationReviewedAt,
    confirmed: true
  }),
  Object.freeze({
    id: 'goethe_zertifikat',
    test: 'Goethe-Zertifikat',
    variants: Object.freeze(['Goethe-Zertifikat']),
    issuer: 'Goethe-Institut',
    documentType: 'language_test',
    routeKind: verificationRouteKinds.issuerVerification,
    intendedActor: 'student_or_institution',
    action: 'verify_on_issuer_site',
    sourceUrl: 'https://www.goethe.de/verify',
    reviewedAt: officialVerificationReviewedAt,
    confirmed: true
  }),
  Object.freeze({
    id: 'tcf',
    test: 'TCF',
    variants: Object.freeze(['TCF tout public', 'TCF Canada', 'TCF Québec', 'TCF IRN']),
    issuer: 'France Éducation international',
    documentType: 'language_test',
    routeKind: verificationRouteKinds.issuerVerification,
    intendedActor: 'student_or_institution',
    action: 'verify_attestation_on_issuer_site',
    // FEI's authentication site: session date + attestation number only.
    // Lookalike domains exist, so this exact reviewed address is the only link.
    sourceUrl: 'https://controle.france-education-international.fr/',
    reviewedAt: officialVerificationReviewedAt,
    confirmed: true
  }),
  Object.freeze({
    id: 'delf',
    test: 'DELF',
    variants: Object.freeze(['DELF']),
    issuer: 'France Éducation international / DELF examination centre',
    documentType: 'language_test',
    routeKind: verificationRouteKinds.issuerContact,
    intendedActor: 'exam_centre',
    action: 'contact_exam_centre',
    sourceUrl: 'https://www.france-education-international.fr/article/informations-pratiques-pour-les-candidats-au-delf-dalf',
    reviewedAt: officialVerificationReviewedAt,
    confirmed: true
  }),
  Object.freeze({
    id: 'dalf',
    test: 'DALF',
    variants: Object.freeze(['DALF']),
    issuer: 'France Éducation international / DALF examination centre',
    documentType: 'language_test',
    routeKind: verificationRouteKinds.issuerContact,
    intendedActor: 'exam_centre',
    action: 'contact_exam_centre',
    sourceUrl: 'https://www.france-education-international.fr/article/informations-pratiques-pour-les-candidats-au-delf-dalf',
    reviewedAt: officialVerificationReviewedAt,
    confirmed: true
  }),
  Object.freeze({
    id: 'tef_etudes',
    test: 'TEF Études',
    variants: Object.freeze(['TEF Études']),
    issuer: 'Le français des affaires (CCI Paris Île-de-France)',
    documentType: 'language_test',
    routeKind: verificationRouteKinds.issuerContact,
    intendedActor: 'exam_centre',
    action: 'contact_exam_centre',
    sourceUrl: 'https://www.lefrancaisdesaffaires.fr/candidat/test-evaluation-francais/tef-etudes/attestation',
    reviewedAt: officialVerificationReviewedAt,
    confirmed: true
  })
]);

// MyCreds is suggested only for an institution whose own reviewed page confirms
// that it issues this document type through MyCreds. The learner still shares
// from their own account; BursYar never receives a share link.
export const myCredsShareRoute = Object.freeze({
  id: 'mycreds',
  test: null,
  issuer: 'MyCreds',
  documentType: null,
  routeKind: verificationRouteKinds.officialDelivery,
  intendedActor: 'receiving_institution',
  action: 'share_official_credential',
  sourceUrl: 'https://mycreds.ca/wp-content/uploads/2025/06/How-to-share-a-document-to-a-registered-organization.pdf',
  reviewedAt: officialVerificationReviewedAt,
  confirmed: true
});

export const myCredsInstitutions = Object.freeze([
  Object.freeze({
    id: 'university-of-manitoba',
    name: 'University of Manitoba',
    documentTypes: Object.freeze(['official_transcript', 'enrolment_verification_letter']),
    sourceUrl: 'https://umanitoba.ca/registrar/mycreds',
    reviewedAt: officialVerificationReviewedAt
  }),
  Object.freeze({
    id: 'saint-marys-university',
    name: "Saint Mary's University",
    documentTypes: Object.freeze(['official_transcript']),
    sourceUrl: 'https://www.smu.ca/academics/mycreds',
    reviewedAt: officialVerificationReviewedAt
  }),
  Object.freeze({
    id: 'university-of-waterloo',
    name: 'University of Waterloo',
    documentTypes: Object.freeze(['official_transcript']),
    sourceUrl: 'https://uwaterloo.ca/the-centre/forms-and-official-documents/official-documents/official-transcripts/mycreds-university-waterloo',
    reviewedAt: officialVerificationReviewedAt
  })
]);

export const academicDocumentTypes = Object.freeze([
  'official_transcript',
  'enrolment_verification_letter',
  'degree_certificate'
]);

export const registrarFallbackRoute = Object.freeze({
  id: 'registrar',
  test: null,
  issuer: null,
  routeKind: verificationRouteKinds.issuerContact,
  intendedActor: 'issuing_office',
  action: 'request_from_registrar',
  sourceUrl: null,
  reviewedAt: officialVerificationReviewedAt,
  confirmed: false
});

export const unconfirmedTestRoute = Object.freeze({
  id: 'unconfirmed',
  test: null,
  issuer: null,
  routeKind: verificationRouteKinds.issuerContact,
  intendedActor: 'issuer',
  action: 'contact_issuer',
  sourceUrl: null,
  reviewedAt: officialVerificationReviewedAt,
  confirmed: false
});

const variantIndex = new Map();
for (const route of officialVerificationRoutes) {
  for (const variant of route.variants) {
    const key = variant.trim().toLowerCase();
    if (variantIndex.has(key)) throw new Error(`Duplicate verification variant: ${variant}`);
    variantIndex.set(key, route);
  }
}

export function routeForExactTest(test) {
  if (typeof test !== 'string' || !test.trim()) return null;
  return variantIndex.get(test.trim().toLowerCase()) ?? null;
}

// Returns a confirmed reviewed route, an explicit fallback (confirmed: false),
// or null when the learner has not selected anything yet. A test that is not in
// the reviewed configuration never falls through to another exam's route.
export function resolveOfficialVerificationRoute({ test, documentType, institutionId } = {}) {
  if (typeof test === 'string' && test.trim()) {
    return routeForExactTest(test) ?? { ...unconfirmedTestRoute, requestedTest: test.trim() };
  }
  if (!documentType || documentType === 'language_test') return null;
  if (!academicDocumentTypes.includes(documentType)) {
    return { ...unconfirmedTestRoute, requestedDocumentType: documentType };
  }
  const institution = myCredsInstitutions.find(item => item.id === institutionId);
  if (institution?.documentTypes.includes(documentType)) {
    return {
      ...myCredsShareRoute,
      institution: institution.name,
      institutionSourceUrl: institution.sourceUrl,
      documentType,
      reviewedAt: institution.reviewedAt
    };
  }
  return {
    ...registrarFallbackRoute,
    institution: institution?.name ?? null,
    documentType
  };
}

// Only the target program's official requirements can confirm acceptance.
// This helper requires the exact test name and, when the route has a variant,
// the exact variant text. It never maps one exam or variant to another.
export function programAcceptanceStatus({ test, variant, requirements } = {}) {
  if (typeof requirements !== 'string' || !requirements.trim()) return 'not_confirmed';
  const needles = [test, variant].filter(value => typeof value === 'string' && value.trim());
  if (!needles.length) return 'not_confirmed';
  const haystack = requirements.toLowerCase().replace(/\s+/g, ' ');
  const matched = needles.every(needle => {
    const escaped = needle.toLowerCase().replace(/\s+/g, ' ').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`).test(haystack);
  });
  return matched ? 'confirmed' : 'not_confirmed';
}

// A learner-visible request marker. It is not verification, is never persisted
// as issuer evidence, and opening a link does not set it.
export function createVerificationState() {
  return Object.freeze({
    credential: 'not_verified',
    identity: 'not_verified',
    requestMarked: false
  });
}

export function markRequestedByStudent(state) {
  if (state.requestMarked) return state;
  return Object.freeze({ ...state, requestMarked: true });
}

// Explicitly a no-op: opening an official link is not a sent request.
export function noteOfficialLinkOpened(state) {
  return state;
}

// Evidence a future trusted integration would have to record before any
// "verified by issuer" status could exist. No API in this release accepts it.
export const issuerVerificationEvidenceFields = Object.freeze([
  'credential',
  'verifyingAuthority',
  'method',
  'verificationDate',
  'reference'
]);

// Only absolute HTTPS URLs with no credentials, query string, or fragment are
// safe to open. Config URLs are the only source of outbound destinations.
export function reviewedOfficialUrl(url) {
  if (typeof url !== 'string') return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.search || parsed.hash) return null;
    return parsed.href;
  } catch {
    return null;
  }
}

export const verificationCopy = {
  en: {
    action: 'Verify with the issuer',
    panelTitle: 'Official verification and sharing',
    intro: 'This panel helps you find the official way to verify or send a document. BursYar does not send your document to any external service and never asks for a test identifier or a private share link.',
    recordsNote: 'Open the official route for a saved record. Choosing a route does not send the document anywhere.',
    docTypeLabel: 'Select your test or document type',
    docTypePlaceholder: 'Choose one…',
    groupLanguage: 'Language tests',
    groupAcademic: 'Academic documents',
    groupOther: 'Other',
    testOther: 'Another test, or not listed',
    docTranscript: 'Official transcript',
    docEnrolment: 'Enrolment verification letter',
    docDegree: 'Degree certificate',
    issuerLabel: 'Select the issuing institution',
    issuerUnknown: 'My institution is not listed, or I am not sure',
    statusTitle: 'Status',
    authenticity: 'Credential authenticity',
    authenticityValue: 'Not yet verified by the issuer.',
    identity: 'Holder identity',
    identityValue: 'Not verified. BursYar does not check identity in this release.',
    request: 'Your request progress',
    requestValue: 'No request marked.',
    requestMarked: 'Marked as requested by you',
    requestNote: 'This marker only records your own note. It is not issuer verification or identity verification.',
    acceptance: 'Program acceptance',
    acceptanceValue: 'Acceptance not confirmed',
    acceptanceNote: 'Only the target program’s official requirements decide whether this test or variant is accepted. This route does not confirm acceptance.',
    programLabel: 'Target scholarship or program (optional)',
    programNone: 'No target program selected',
    programAcceptanceConfirmed: 'Confirmed by the selected program’s reviewed requirements',
    programAcceptanceMismatch: 'The selected program’s reviewed requirements do not name this exact test and variant.',
    programAcceptanceSource: 'Reviewed program requirement',
    programAcceptanceNote: 'This confirms only that the program’s reviewed wording names this exact test and variant. It is not admission, issuer verification, identity verification, or a score check. Catalog details may still need re-verification.',
    openProgramSource: 'Open official program requirements',
    routeKindLabel: 'Route type',
    kindOfficialDelivery: 'Official score or credential delivery',
    kindIssuerVerification: 'Issuer-side verification',
    kindIssuerContact: 'Issuer contact and certificate guidance',
    whoLabel: 'Who performs the official check',
    nextLabel: 'What you should do next',
    reviewedLabel: 'Reviewed on',
    sourceLabel: 'Official source',
    openOfficial: 'Open official instructions',
    organisationGuide: 'Open the guide for receiving organisations',
    externalNote: 'This link opens an external official service in a new tab. BursYar does not send your document, identifiers, or share links.',
    myCredsCaution: 'Share only to the intended registered receiver from your own MyCreds account. Do not paste a MyCreds share link into BursYar; BursYar does not fetch, store, or log it, and sharing is not issuer verification.',
    choosePrompt: 'Choose a test or document type to see the reviewed official route.',
    templateTitle: 'Request template',
    templateNote: 'This template is generic and contains no identifiers or personal data. Copy it into your own email service and send it yourself; BursYar does not send email for you.',
    templateBody: 'Subject: Request for official verification process\n\nDear Registrar,\n\nI am an applicant and would like to ask how your office verifies the academic document I hold for admission or scholarship purposes.\n\nPlease tell me:\n1. the official verification process you accept;\n2. the information you need from me;\n3. whether you can verify the document directly with the issuing institution;\n4. the expected response time and any fee.\n\nI have not attached the document to this message. I can provide it through your official channel if required.\n\nThank you.',
    copyTemplate: 'Copy template',
    copied: 'Copied',
    noRoute: 'No reviewed official route is confirmed for this case.',
    noRouteNext: 'Contact the registrar or issuing office through its official contact page and ask for its verification process. If you cannot find a route, ask the admissions office which method it accepts.',
    stillUsable: 'A missing route, a delayed reply, or an unanswered request does not mean your document is invalid. You can still use BursYar’s scholarship and document-review features.',
    unconfirmedTest: 'BursYar has no reviewed official route for this exact test or variant. Do not assume another exam’s or variant’s route applies.',
    markRequested: 'Mark as requested by you',
    markNote: 'Opening a link or sending a document does not record a request automatically. This marker is not issuer verification.',
    independenceNote: 'Reviewing extracted information, issuer verification, and holder identity are three separate things; none proves another. Matching a scholarship rule does not prove that a document is authentic.',
    routes: {
      ielts: {
        name: 'IELTS Academic or IELTS General Training',
        summary: 'Share your official Test Report Form with the receiving university or organisation. The organisation verifies the result through the IELTS Results Service when it has authorised access.',
        who: 'The receiving university or organisation, through the IELTS Results Service.',
        next: 'Follow the official IELTS instructions for sharing your result with the organisation. A forwarded PDF is not official verification.'
      },
      toefl_ibt: {
        name: 'TOEFL iBT',
        summary: 'Send your official TOEFL iBT scores from your own ETS account to the institution or agency that should receive them.',
        who: 'The receiving institution or agency, through the official score report or the ETS verification service.',
        next: 'Sign in to your own ETS account and select the score recipients. BursYar never asks for ETS credentials or score-report identifiers.'
      },
      duolingo: {
        name: 'Duolingo English Test',
        summary: 'Share each certified result with the institution from My Tests → Share Score in your Duolingo English Test account.',
        who: 'The receiving institution, through the Duolingo English Test platform.',
        next: 'Use My Tests → Share Score for a certified result. A PDF, a public certificate link, or telling BursYar that you sent it is not official delivery.'
      },
      testdaf: {
        name: 'TestDaF',
        summary: 'The authenticity of a TestDaF certificate is checked on the official g.a.s.t. verification form.',
        who: 'The student or the receiving institution, on the official g.a.s.t. verification form.',
        next: 'Open the reviewed g.a.s.t. page and enter the certificate details there. Do not open QR links taken from uploaded or forwarded files.'
      },
      goethe_zertifikat: {
        name: 'Goethe-Zertifikat',
        summary: 'Goethe-Zertifikate are checked on the Goethe-Institut verification page.',
        who: 'The student or the receiving institution, on the official Goethe-Institut verification page.',
        next: 'Open the reviewed Goethe-Institut page and enter the certificate data there. This route does not cover Goethe-Test PRO.'
      },
      tcf: {
        name: 'TCF (exact variant you took)',
        summary: 'France Éducation international authenticates TCF attestations on its official authentication site. You or the receiving institution enter the session date and attestation number there.',
        who: 'The student or the receiving institution, on the official France Éducation international authentication site.',
        next: 'Open the reviewed FEI authentication page directly and enter the details printed on your attestation there. If you scan the QR code printed on your own attestation, check that it opens exactly controle.france-education-international.fr before typing anything. Never use a link or address copied from an uploaded, emailed, or forwarded document.'
      },
      delf: {
        name: 'DELF',
        summary: 'DELF results and diplomas are issued through your examination centre. France Éducation international publishes the official candidate guidance.',
        who: 'Your DELF examination centre, or France Éducation international for diploma questions.',
        next: 'Contact the examination centre that registered you and ask how it verifies your DELF diploma for a receiving institution.'
      },
      dalf: {
        name: 'DALF',
        summary: 'DALF results and diplomas are issued through your examination centre. France Éducation international publishes the official candidate guidance.',
        who: 'Your DALF examination centre, or France Éducation international for diploma questions.',
        next: 'Contact the examination centre that registered you and ask how it verifies your DALF diploma for a receiving institution.'
      },
      tef_etudes: {
        name: 'TEF Études',
        summary: 'TEF Études results are delivered as an official attestation through a secure online vault. Your test centre handles questions about the attestation.',
        who: 'The receiving institution checks the official attestation with the candidate; your TEF test centre handles verification questions.',
        next: 'Open the reviewed TEF Études certificate page, then contact your test centre if the receiving institution needs confirmation. TEF Canada instructions do not apply to TEF Études.'
      },
      mycreds: {
        name: 'MyCreds',
        summary: 'This institution issues this type of document through MyCreds. Share the official credential from your MyCreds account to the intended registered receiver when it is available.',
        who: 'The registered receiving organisation, through the MyCreds network.',
        next: 'Share only to the intended registered receiver from your own MyCreds account. Do not paste a MyCreds share link into BursYar; a share is not issuer verification.'
      },
      registrar: {
        name: 'Issuer or registrar request',
        summary: 'No reviewed official verification route is confirmed for this institution and document type.',
        who: 'The issuing institution’s registrar or issuing office.',
        next: 'Ask the registrar or issuing office for its verification process through its official contact page. If you cannot find a route, ask the admissions office which method it accepts.'
      },
      unconfirmed: {
        name: 'Route not confirmed',
        summary: 'BursYar has no reviewed official route for this exact test or variant.',
        who: 'The issuer or the test centre.',
        next: 'Check the test provider’s official site or contact the test centre. Do not assume that another exam’s route applies.'
      }
    }
  },
  fa: {
    action: 'استعلام از مرجع صادرکننده',
    panelTitle: 'تأیید و اشتراک‌گذاری رسمی',
    intro: 'این بخش کمک می‌کند راه رسمی تأیید یا ارسال مدرک را پیدا کنید. بورس‌یار مدرک شما را به هیچ سرویس بیرونی نمی‌فرستد و هرگز شمارهٔ آزمون یا لینک اشتراک خصوصی نمی‌خواهد.',
    recordsNote: 'برای هر مدرک ذخیره‌شده مسیر رسمی را باز کنید. انتخاب مسیر، مدرک را به جایی نمی‌فرستد.',
    docTypeLabel: 'نوع آزمون یا مدرک خود را انتخاب کنید',
    docTypePlaceholder: 'یکی را انتخاب کنید…',
    groupLanguage: 'آزمون‌های زبان',
    groupAcademic: 'مدارک تحصیلی',
    groupOther: 'سایر',
    testOther: 'آزمون دیگر یا در فهرست نیست',
    docTranscript: 'ریزنمرات رسمی',
    docEnrolment: 'گواهی اشتغال به تحصیل',
    docDegree: 'گواهی مدرک تحصیلی',
    issuerLabel: 'مؤسسهٔ صادرکننده را انتخاب کنید',
    issuerUnknown: 'مؤسسهٔ من در فهرست نیست یا مطمئن نیستم',
    statusTitle: 'وضعیت',
    authenticity: 'اصالت مدرک',
    authenticityValue: 'هنوز توسط مرجع صادرکننده تأیید نشده است.',
    identity: 'هویت دارندهٔ مدرک',
    identityValue: 'تأیید نشده است. بورس‌یار در این نسخه هویت را بررسی نمی‌کند.',
    request: 'پیشرفت درخواست شما',
    requestValue: 'هیچ درخواستی علامت‌گذاری نشده است.',
    requestMarked: 'به‌عنوان درخواست‌شده توسط شما علامت خورد',
    requestNote: 'این علامت فقط یادداشت خود شماست و تأیید صادرکننده یا تأیید هویت نیست.',
    acceptance: 'پذیرش در برنامه',
    acceptanceValue: 'پذیرش تأیید نشده است',
    acceptanceNote: 'فقط شرایط رسمی برنامهٔ مقصد مشخص می‌کند این آزمون یا نسخهٔ آن پذیرفته می‌شود. وجود این مسیر به معنای پذیرش نیست.',
    programLabel: 'بورسیه یا برنامهٔ هدف (اختیاری)',
    programNone: 'هیچ برنامهٔ هدفی انتخاب نشده است',
    programAcceptanceConfirmed: 'بر اساس شرایط بازبینی‌شدهٔ برنامهٔ انتخاب‌شده تأیید شد',
    programAcceptanceMismatch: 'شرایط بازبینی‌شدهٔ برنامهٔ انتخاب‌شده این آزمون و نسخهٔ دقیق را نام نبرده است.',
    programAcceptanceSource: 'شرایط بازبینی‌شدهٔ برنامه',
    programAcceptanceNote: 'این تأیید فقط نشان می‌دهد که متن بازبینی‌شدهٔ برنامه دقیقاً همین آزمون و نسخه را نام برده است. این تأیید به معنای پذیرش، تأیید صادرکننده، تأیید هویت یا بررسی نمره نیست. جزئیات کاتالوگ ممکن است هنوز نیازمند بازبینی باشند.',
    openProgramSource: 'بازکردن شرایط رسمی برنامه',
    routeKindLabel: 'نوع مسیر',
    kindOfficialDelivery: 'ارسال رسمی نمره یا مدرک',
    kindIssuerVerification: 'تأیید از سوی مرجع صادرکننده',
    kindIssuerContact: 'تماس با صادرکننده و راهنمای گواهی',
    whoLabel: 'چه کسی بررسی رسمی را انجام می‌دهد',
    nextLabel: 'قدم بعدی شما',
    reviewedLabel: 'بازبینی‌شده در',
    sourceLabel: 'منبع رسمی',
    openOfficial: 'بازکردن راهنمای رسمی',
    organisationGuide: 'راهنمای سازمان‌های دریافت‌کننده',
    externalNote: 'این پیوند یک سرویس رسمی بیرونی را در زبانهٔ تازه باز می‌کند. بورس‌یار مدرک، شناسه‌ها یا لینک اشتراک شما را ارسال نمی‌کند.',
    myCredsCaution: 'فقط از حساب MyCreds خودتان و برای دریافت‌کنندهٔ ثبت‌شدهٔ موردنظر به اشتراک بگذارید. لینک اشتراک را در بورس‌یار جای‌گذاری نکنید؛ بورس‌یار آن را دریافت، ذخیره یا ثبت نمی‌کند و اشتراک‌گذاری به معنای تأیید صادرکننده نیست.',
    choosePrompt: 'برای دیدن مسیر رسمی بازبینی‌شده، یک آزمون یا نوع مدرک انتخاب کنید.',
    templateTitle: 'متن نمونهٔ درخواست',
    templateNote: 'این متن عمومی است و هیچ شناسه یا اطلاعات شخصی ندارد. آن را در سرویس ایمیل خودتان کپی و ارسال کنید؛ بورس‌یار ایمیلی نمی‌فرستد.',
    templateBody: 'موضوع: درخواست روش رسمی تأیید\n\nبا سلام،\n\nمن متقاضی هستم و می‌خواهم بدانم دفتر شما مدرک تحصیلی من را برای پذیرش یا بورسیه چگونه تأیید می‌کند.\n\nلطفاً بفرمایید:\n۱. روش رسمی تأییدی که می‌پذیرید چیست؛\n۲. چه اطلاعاتی از من لازم دارید؛\n۳. آیا می‌توانید مدرک را مستقیماً با مؤسسهٔ صادرکننده بررسی کنید؛\n۴. زمان پاسخ و هزینهٔ احتمالی چقدر است.\n\nمن مدرکی به این پیام پیوست نکرده‌ام و در صورت نیاز آن را از مسیر رسمی شما ارائه می‌کنم.\n\nبا سپاس',
    copyTemplate: 'کپی متن',
    copied: 'کپی شد',
    noRoute: 'هیچ مسیر رسمی بازبینی‌شده‌ای برای این مورد تأیید نشده است.',
    noRouteNext: 'از طریق صفحهٔ تماس رسمی با دفتر ثبت یا دفتر صدور تماس بگیرید و روش تأیید را بپرسید. اگر مسیری نیافتید، از دفتر پذیرش بپرسید کدام روش را می‌پذیرد.',
    stillUsable: 'نبود مسیر، تأخیر در پاسخ یا بی‌پاسخ ماندن درخواست به معنای نامعتبر بودن مدرک نیست. می‌توانید از امکانات بورسیه و بازبینی مدرک بورس‌یار استفاده کنید.',
    unconfirmedTest: 'بورس‌یار برای این آزمون یا نسخهٔ دقیق آن مسیر رسمی بازبینی‌شده‌ای ندارد. فرض نکنید مسیر آزمون یا نسخهٔ دیگری برای این مورد کار می‌کند.',
    markRequested: 'علامت‌گذاری به‌عنوان درخواست‌شده توسط من',
    markNote: 'بازکردن پیوند یا ارسال مدرک، درخواست را به‌طور خودکار ثبت نمی‌کند. این علامت تأیید صادرکننده نیست.',
    independenceNote: 'بازبینی اطلاعات استخراج‌شده، تأیید صادرکننده و تأیید هویت دارنده سه موضوع جدا هستند و هیچ‌کدام دیگری را ثابت نمی‌کند. تطابق با شرایط بورسیه هم نشانهٔ اصالت مدرک نیست.',
    routes: {
      ielts: {
        name: 'آیلتس آکادمیک یا آیلتس جنرال',
        summary: 'فرم رسمی نتایج آیلتس خود را با دانشگاه یا سازمان دریافت‌کننده به اشتراک بگذارید. سازمان در صورت داشتن دسترسی مجاز، نتیجه را از طریق سرویس نتایج آیلتس بررسی می‌کند.',
        who: 'دانشگاه یا سازمان دریافت‌کننده، از طریق سرویس نتایج آیلتس.',
        next: 'دستورالعمل رسمی آیلتس برای اشتراک‌گذاری نتیجه با سازمان را دنبال کنید. ارسال یک PDF به‌تنهایی تأیید رسمی نیست.'
      },
      toefl_ibt: {
        name: 'تافل آی‌بی‌تی (TOEFL iBT)',
        summary: 'نمره‌های رسمی تافل آی‌بی‌تی را از حساب ETS خود به مؤسسه یا سازمان مقصد بفرستید.',
        who: 'مؤسسه یا سازمان دریافت‌کننده، از طریق گزارش رسمی نمره یا سرویس بررسی ETS.',
        next: 'به حساب ETS خودتان وارد شوید و دریافت‌کنندگان نمره را انتخاب کنید. بورس‌یار هرگز اطلاعات ورود ETS یا شناسهٔ گزارش نمره را نمی‌خواهد.'
      },
      duolingo: {
        name: 'آزمون زبان انگلیسی دولینگو',
        summary: 'هر نتیجهٔ تأییدشده را از بخش «آزمون‌های من ← اشتراک نمره» در حساب دولینگو برای مؤسسه بفرستید.',
        who: 'مؤسسهٔ دریافت‌کننده، از طریق سکوی آزمون دولینگو.',
        next: 'برای نتیجهٔ تأییدشده از «آزمون‌های من ← اشتراک نمره» استفاده کنید. PDF، لینک عمومی گواهی یا اعلام ارسال به بورس‌یار، ارسال رسمی نیست.'
      },
      testdaf: {
        name: 'تست‌داف (TestDaF)',
        summary: 'اصالت گواهی تست‌داف در فرم رسمی بررسی g.a.s.t. کنترل می‌شود.',
        who: 'خود دانشجو یا مؤسسهٔ دریافت‌کننده، در فرم رسمی بررسی g.a.s.t.',
        next: 'صفحهٔ بازبینی‌شدهٔ g.a.s.t. را باز کنید و اطلاعات گواهی را همان‌جا وارد کنید. لینک‌های QR موجود در فایل‌های بارگذاری‌شده یا ارسال‌شده را باز نکنید.'
      },
      goethe_zertifikat: {
        name: 'گواهی گوته (Goethe-Zertifikat)',
        summary: 'گواهی‌های گوته در صفحهٔ بررسی مؤسسهٔ گوته کنترل می‌شوند.',
        who: 'خود دانشجو یا مؤسسهٔ دریافت‌کننده، در صفحهٔ رسمی بررسی مؤسسهٔ گوته.',
        next: 'صفحهٔ بازبینی‌شدهٔ مؤسسهٔ گوته را باز کنید و اطلاعات گواهی را همان‌جا وارد کنید. این مسیر شامل Goethe-Test PRO نیست.'
      },
      tcf: {
        name: 'تی‌سی‌اف (نسخهٔ دقیق آزمون شما)',
        summary: 'فرانس ادوکاسیون اینترناسیونال اصالت گواهی‌های TCF را در سایت رسمی تأیید خود بررسی می‌کند. خود دانشجو یا مؤسسهٔ دریافت‌کننده تاریخ جلسه و شمارهٔ گواهی را همان‌جا وارد می‌کند.',
        who: 'خود دانشجو یا مؤسسهٔ دریافت‌کننده، در سایت رسمی تأیید فرانس ادوکاسیون اینترناسیونال.',
        next: 'صفحهٔ بازبینی‌شدهٔ تأیید فرانس ادوکاسیون اینترناسیونال را مستقیم باز کنید و اطلاعات چاپ‌شده روی گواهی را همان‌جا وارد کنید. اگر QR چاپ‌شده روی گواهی خودتان را اسکن می‌کنید، پیش از وارد کردن هر چیزی مطمئن شوید که دقیقاً به controle.france-education-international.fr باز می‌شود. هرگز از لینک یا نشانی کپی‌شده از سند بارگذاری‌شده، ایمیلی یا ارسال‌شده استفاده نکنید.'
      },
      delf: {
        name: 'دلف (DELF)',
        summary: 'نتایج و دیپلم DELF از طریق مرکز آزمون شما صادر می‌شود. فرانس ادوکاسیون اینترناسیونال راهنمای رسمی داوطلبان را منتشر می‌کند.',
        who: 'مرکز آزمون DELF شما، یا فرانس ادوکاسیون اینترناسیونال برای پرسش‌های دیپلم.',
        next: 'با مرکز آزمونی که در آن ثبت‌نام کرده‌اید تماس بگیرید و بپرسید دیپلم DELF شما را برای مؤسسهٔ دریافت‌کننده چگونه تأیید می‌کند.'
      },
      dalf: {
        name: 'دالف (DALF)',
        summary: 'نتایج و دیپلم DALF از طریق مرکز آزمون شما صادر می‌شود. فرانس ادوکاسیون اینترناسیونال راهنمای رسمی داوطلبان را منتشر می‌کند.',
        who: 'مرکز آزمون DALF شما، یا فرانس ادوکاسیون اینترناسیونال برای پرسش‌های دیپلم.',
        next: 'با مرکز آزمونی که در آن ثبت‌نام کرده‌اید تماس بگیرید و بپرسید دیپلم DALF شما را برای مؤسسهٔ دریافت‌کننده چگونه تأیید می‌کند.'
      },
      tef_etudes: {
        name: 'تف اتود (TEF Études)',
        summary: 'نتایج TEF Études به‌صورت گواهی رسمی در یک گاوصندوق دیجیتال تحویل می‌شود. پرسش‌های مربوط به گواهی را مرکز آزمون پاسخ می‌دهد.',
        who: 'مؤسسهٔ دریافت‌کننده گواهی رسمی را با داوطلب بررسی می‌کند؛ پرسش‌های تأیید را مرکز آزمون TEF شما پاسخ می‌دهد.',
        next: 'صفحهٔ بازبینی‌شدهٔ گواهی TEF Études را باز کنید و اگر مؤسسهٔ دریافت‌کننده تأیید می‌خواهد با مرکز آزمون خود تماس بگیرید. دستورالعمل TEF Canada برای TEF Études کاربرد ندارد.'
      },
      mycreds: {
        name: 'مای‌کردز (MyCreds)',
        summary: 'این مؤسسه این نوع مدرک را از طریق MyCreds صادر می‌کند. در صورت وجود دریافت‌کنندهٔ ثبت‌شده، مدرک رسمی را از حساب MyCreds خود برای او به اشتراک بگذارید.',
        who: 'سازمان دریافت‌کنندهٔ ثبت‌شده، از طریق شبکهٔ MyCreds.',
        next: 'فقط برای دریافت‌کنندهٔ ثبت‌شدهٔ موردنظر و از حساب MyCreds خودتان به اشتراک بگذارید. لینک اشتراک MyCreds را در بورس‌یار جای‌گذاری نکنید؛ اشتراک به معنای تأیید صادرکننده نیست.'
      },
      registrar: {
        name: 'درخواست از صادرکننده یا دفتر ثبت',
        summary: 'برای این مؤسسه و این نوع مدرک، هیچ مسیر رسمی بازبینی‌شده‌ای ثبت نشده است.',
        who: 'دفتر ثبت یا دفتر صدور مؤسسهٔ صادرکننده.',
        next: 'از طریق صفحهٔ تماس رسمی، از دفتر ثبت یا دفتر صدور روش تأیید را بپرسید. اگر مسیری نیافتید، از دفتر پذیرش بپرسید کدام روش را می‌پذیرد.'
      },
      unconfirmed: {
        name: 'مسیر تأییدنشده',
        summary: 'بورس‌یار برای این آزمون یا نسخهٔ دقیق آن مسیر رسمی بازبینی‌شده‌ای ندارد.',
        who: 'مرجع صادرکننده یا مرکز آزمون.',
        next: 'سایت رسمی ارائه‌دهندهٔ آزمون را بررسی کنید یا با مرکز آزمون تماس بگیرید. فرض نکنید مسیر آزمون دیگری برای این مورد هم کار می‌کند.'
      }
    }
  },
  ps: {
    action: 'د صادرونکي له مرجع څخه پوښتنه',
    panelTitle: 'رسمي تایید او شریکول',
    intro: 'دا برخه ستاسو سره د سند د رسمي تایید یا لېږلو لار موندلو کې مرسته کوي. بورس‌یار ستاسو سند کوم بهرني خدمت ته نه لېږي او هیڅکله د ازموینې شمېره یا خصوصي شریکولو لینک نه غواړي.',
    recordsNote: 'د هر ساتل شوي سند لپاره رسمي لار پرانیزئ. د لار ټاکل سند چېرې هم نه لېږي.',
    docTypeLabel: 'خپل د ازموینې یا سند ډول وټاکئ',
    docTypePlaceholder: 'یو وټاکئ…',
    groupLanguage: 'ژبې ازموینې',
    groupAcademic: 'تحصیلي اسناد',
    groupOther: 'نور',
    testOther: 'بله ازموینه یا په لړ کې نه ده',
    docTranscript: 'رسمي نمرې پاڼه',
    docEnrolment: 'د زده‌کړې د دوام تصدیق',
    docDegree: 'د سند تصدیق',
    issuerLabel: 'د صادرونکې ادارې ټاکل',
    issuerUnknown: 'زما اداره په لړ کې نه ده یا ډاډه نه یم',
    statusTitle: 'حالت',
    authenticity: 'د سند اصالت',
    authenticityValue: 'تر اوسه د صادرونکي مرجع لخوا نه دی تایید شوی.',
    identity: 'د سند لرونکي هویت',
    identityValue: 'نه دی تایید شوی. بورس‌یار په دې نسخه کې هویت نه څېړي.',
    request: 'ستاسو د غوښتنې پرمختګ',
    requestValue: 'هیڅ غوښتنه نه ده نښه شوې.',
    requestMarked: 'ستاسو لخوا د غوښتل شوې په توګه نښه شوه',
    requestNote: 'دا نښه یوازې ستاسو یادښت دی؛ د صادرونکي تایید یا د هویت تایید نه دی.',
    acceptance: 'په پروګرام کې منل',
    acceptanceValue: 'منل نه دي تایید شوي',
    acceptanceNote: 'یوازې د موخې پروګرام رسمي شرایط ټاکي چې دا ازموینه یا نسخه منل کېږي که نه. د دې لار شتون منل نه ثابتوي.',
    programLabel: 'هدف بورس یا پروګرام (اختیاري)',
    programNone: 'هیڅ هدف پروګرام نه دی ټاکل شوی',
    programAcceptanceConfirmed: 'د ټاکل شوي پروګرام د بیاکتل شوو شرایطو له مخې تایید شو',
    programAcceptanceMismatch: 'د ټاکل شوي پروګرام بیاکتل شوو شرایطو دا دقیقه ازموینه او نسخه نه ده نومولې.',
    programAcceptanceSource: 'د پروګرام بیاکتل شوې شرط',
    programAcceptanceNote: 'دا تایید یوازې ښیي چې د پروګرام بیاکتل شوي متن همدا دقیقه ازموینه او نسخه نومولې ده. دا د داخلې، د صادرونکي تایید، د هویت تایید یا د نمرې کتنه نه ده. د کتلاګ جزئیات ممکن لا بیاکتنې ته اړتیا ولري.',
    openProgramSource: 'د پروګرام رسمي شرایط پرانیستل',
    routeKindLabel: 'د لار ډول',
    kindOfficialDelivery: 'رسمي نمرې یا سند لېږل',
    kindIssuerVerification: 'د صادرونکي مرجع لخوا تایید',
    kindIssuerContact: 'له صادرونکي سره اړیکه او د سند لارښود',
    whoLabel: 'رسمي څېړنه څوک کوي',
    nextLabel: 'ستاسو راتلونکی ګام',
    reviewedLabel: 'بیاکتنه شوې په',
    sourceLabel: 'رسمي سرچینه',
    openOfficial: 'رسمي لارښود پرانیستل',
    organisationGuide: 'د ترلاسه کوونکو سازمانونو لارښود',
    externalNote: 'دا تړون یو رسمي بهرنی خدمت په نوي ټب کې پرانیزي. بورس‌یار ستاسو سند، شناسه یا شریکولو لینک نه لېږي.',
    myCredsCaution: 'یوازې له خپل MyCreds حساب څخه او یوازې ټاکل شوي ثبت‌شوي ترلاسه کوونکي ته شریک کړئ. شریکولو لینک په بورس‌یار کې مه ږدئ؛ بورس‌یار هغه نه ترلاسه کوي، نه ذخیره کوي او نه ثبتوي، او شریکول د صادرونکي تایید نه دی.',
    choosePrompt: 'د بیاکتل شوې رسمي لارې د لیدلو لپاره یوه ازموینه یا د سند ډول وټاکئ.',
    templateTitle: 'د غوښتنې بېلګه متن',
    templateNote: 'دا متن عمومي دی او هیڅ شناسه یا شخصي معلومات نلري. هغه په خپل ایمیل خدمت کې کاپي او ولېږئ؛ بورس‌یار ایمیل نه لېږي.',
    templateBody: 'موضوع: د رسمي تایید کړنلارې غوښتنه\n\nسلام،\n\nزه غوښتونکی یم او غواړم پوه شم چې ستاسو دفتر زما تحصیلي سند د داخلې یا بورس لپاره څنګه تاییدوي.\n\nمهرباني وکړئ ووایاست:\n۱. کومه رسمي تایید طریقه منئ؛\n۲. زما څخه کوم معلومات ته اړتیا لرئ؛\n۳. آیا سند کولی شئ مستقیم له صادرونکې مؤسسې سره وڅېړئ؛\n۴. د ځواب وخت او احتمالي لګښت څومره دی.\n\nما دا پیغام ته کوم سند نه دی ضمیمه کړی او که اړتیا وي به یې ستاسو د رسمي لارې له مخې وړاندې کړم.\n\nمننه',
    copyTemplate: 'متن کاپي کړئ',
    copied: 'کاپي شو',
    noRoute: 'د دې مورد لپاره کومه بیاکتل شوې رسمي لار نه ده تایید شوې.',
    noRouteNext: 'د ثبت دفتر یا د صدور دفتر له رسمي اړیکې پاڼې څخه د تایید بهیر وپوښتئ. که لار ونه موندل شي، د داخلې دفتر وپوښتئ چې کومه طریقه مني.',
    stillUsable: 'د لار نه شتون، ځنډ یا بې ځوابه غوښتنه د دې معنا نه ده چې سند ناسم دی. تاسو کولی شئ د بورس‌یار بورس او د سند بیاکتنې ځانګړنې وکاروئ.',
    unconfirmedTest: 'بورس‌یار د دې دقیقې ازموینې یا نسخې لپاره بیاکتل شوې رسمي لار نه لري. دې ته مه فکر کوئ چې د بلې ازموینې یا بلې نسخې لار به هم پلي شي.',
    markRequested: 'زما لخوا د غوښتل شوې په توګه نښه کړه',
    markNote: 'د تړون پرانیستل یا سند لېږل غوښتنه په اوتومات ډول نه ثبتوي. دا نښه د صادرونکي تایید نه دی.',
    independenceNote: 'ایستل شوي معلوماتو بیاکتنه، د صادرونکي تایید او د سند لرونکي هویت درې بېلې موضوعګانې دي او یوه بله نه ثابتوي. د بورس شرایطو سره سمون هم د سند د اصالت نښه نه ده.',
    routes: {
      ielts: {
        name: 'آیلتس اکاډمیک یا آیلتس جنرال',
        summary: 'خپل رسمي د آیلتس د پایلو فورم له ترلاسه کوونکي پوهنتون یا سازمان سره شریک کړئ. سازمان د اجازې لرلو په صورت کې پایله د آیلتس د پایلو خدمت له لارې څېړي.',
        who: 'ترلاسه کوونکی پوهنتون یا سازمان، د آیلتس د پایلو خدمت له لارې.',
        next: 'د آیلتس رسمي لارښوونې تعقیب کړئ چې پایله له سازمان سره شریکه کړئ. یوازې PDF لېږل رسمي تایید نه دی.'
      },
      toefl_ibt: {
        name: 'تافل آی‌بي‌ټي (TOEFL iBT)',
        summary: 'خپلې رسمي د تافل آی‌بي‌ټي نمرې د خپل ETS حساب څخه هغه ادارې یا سازمان ته ولېږئ چې باید ترلاسه کړي.',
        who: 'ترلاسه کوونکې اداره یا سازمان، د رسمي نمرې راپور یا د ETS د څېړنې خدمت له لارې.',
        next: 'خپل ETS حساب ته ننوځئ او د نمرې ترلاسه کوونکي وټاکئ. بورس‌یار هیڅکله د ETS معلومات یا د نمرې راپور شناسه نه غواړي.'
      },
      duolingo: {
        name: 'د دولینګو انګلیسي ازموینه',
        summary: 'هره تایید شوې پایله د «زما ازموینې ← نمره شریکول» له برخې له مؤسسې سره شریکه کړئ.',
        who: 'ترلاسه کوونکې مؤسسه، د دولینګو د انګلیسي ازموینې سکې له لارې.',
        next: 'د تایید شوې پایلې لپاره «زما ازموینې ← نمره شریکول» وکاروئ. PDF، عامه سند لینک یا بورس‌یار ته د لېږلو خبر ورکول رسمي لېږل نه دي.'
      },
      testdaf: {
        name: 'ټسټداف (TestDaF)',
        summary: 'د ټسټداف د سند اصالت د g.a.s.t. په رسمي فورم کې کتل کېږي.',
        who: 'په خپله زده کوونکی یا ترلاسه کوونکې مؤسسه، د g.a.s.t. په رسمي فورم کې.',
        next: 'بیاکتل شوې g.a.s.t. پاڼه پرانیزئ او د سند معلومات هماغه ځای ولیکئ. د پورته شویو یا لېږل شویو فایلونو QR لینکونه مه پرانیزئ.'
      },
      goethe_zertifikat: {
        name: 'د ګوته سند (Goethe-Zertifikat)',
        summary: 'د ګوته سندونه د ګوته انسټیټیوټ په څېړنې پاڼه کې کتل کېږي.',
        who: 'په خپله زده کوونکی یا ترلاسه کوونکې مؤسسه، د ګوته انسټیټیوټ په رسمي پاڼه کې.',
        next: 'بیاکتل شوې د ګوته انسټیټیوټ پاڼه پرانیزئ او د سند معلومات هماغه ځای ولیکئ. دا لار Goethe-Test PRO نه رانغاړي.'
      },
      tcf: {
        name: 'ټي‌سي‌اف (ستاسو دقیقه نسخه)',
        summary: 'فرانس ایډوکیشن اینټرنیشنال د TCF د سندونو اصالت په خپل رسمي تایید وېبځای کې څېړي. زده کوونکی یا ترلاسه کوونکې مؤسسه د غونډې نېټه او د سند شمېره هماغه ځای ولیکي.',
        who: 'په خپله زده کوونکی یا ترلاسه کوونکې مؤسسه، د فرانس ایډوکیشن اینټرنیشنال په رسمي تایید وېبځای کې.',
        next: 'د فرانس ایډوکیشن اینټرنیشنال بیاکتل شوې رسمي تایید پاڼه مستقیم پرانیزئ او پر سند چاپ شوي معلومات هماغه ځای ولیکئ. که پر خپل سند چاپ شوی QR سکن کوئ، تر لیکلو مخکې ډاډه شئ چې هغه ریښتینې controle.france-education-international.fr ته رسوي. هغه لینک یا پته چې له پورته شوي، ایمیل شوي یا لېږل شوي سند څخه کاپي شوې وي هیڅکله مه کاروئ.'
      },
      delf: {
        name: 'ډیلف (DELF)',
        summary: 'د DELF پایلې او دیپلوم ستاسو د ازموینې مرکز له لارې صادرېږي. فرانس ایډوکیشن اینټرنیشنال د کاندیدانو رسمي لارښود خپروي.',
        who: 'ستاسو د DELF ازموینې مرکز، یا د دیپلوم پوښتنو لپاره فرانس ایډوکیشن اینټرنیشنال.',
        next: 'له هغه ازموینې مرکز سره اړیکه ونیسئ چې تاسو یې ثبت کړی و او وپوښتئ ستاسو DELF دیپلوم د ترلاسه کوونکې مؤسسې لپاره څنګه تاییدوي.'
      },
      dalf: {
        name: 'ډالف (DALF)',
        summary: 'د DALF پایلې او دیپلوم ستاسو د ازموینې مرکز له لارې صادرېږي. فرانس ایډوکیشن اینټرنیشنال د کاندیدانو رسمي لارښود خپروي.',
        who: 'ستاسو د DALF ازموینې مرکز، یا د دیپلوم پوښتنو لپاره فرانس ایډوکیشن اینټرنیشنال.',
        next: 'له هغه ازموینې مرکز سره اړیکه ونیسئ چې تاسو یې ثبت کړی و او وپوښتئ ستاسو DALF دیپلوم د ترلاسه کوونکې مؤسسې لپاره څنګه تاییدوي.'
      },
      tef_etudes: {
        name: 'ټي‌ای‌اف اتود (TEF Études)',
        summary: 'د TEF Études پایلې د یوې رسمي سند په بڼه په خوندي ډیجیټل بکس کې درکول کېږي. د سند پوښتنې ازموینې مرکز ځوابوي.',
        who: 'ترلاسه کوونکې مؤسسه رسمي سند له کاندید سره ګوري؛ د تایید پوښتنې ستاسو د TEF ازموینې مرکز ځوابوي.',
        next: 'بیاکتل شوې د TEF Études د سند پاڼه پرانیزئ او که ترلاسه کوونکې مؤسسه تایید غواړي له خپل ازموینې مرکز سره اړیکه ونیسئ. د TEF Canada لارښوونې د TEF Études لپاره نه پلي کېږي.'
      },
      mycreds: {
        name: 'مای‌کریډز (MyCreds)',
        summary: 'دا مؤسسه دې ډول سند د MyCreds له لارې صادروي. رسمي سند د خپل MyCreds حساب څخه هغه ټاکل شوي ثبت‌شوي ترلاسه کوونکي ته شریک کړئ چې شتون لري.',
        who: 'ثبت‌شوې ترلاسه کوونکې اداره، د MyCreds شبکې له لارې.',
        next: 'یوازې ټاکل شوي ثبت‌شوي ترلاسه کوونکي ته او یوازې له خپل MyCreds حساب څخه شریک کړئ. د MyCreds شریکولو لینک په بورس‌یار کې مه ږدئ؛ شریکول د صادرونکي تایید نه دی.'
      },
      registrar: {
        name: 'له صادرونکي یا ثبت دفتر غوښتنه',
        summary: 'د دې مؤسسې او دې ډول سند لپاره هېڅ بیاکتل شوې رسمي لار نه ده ثبت شوې.',
        who: 'د صادرونکې مؤسسې ثبت دفتر یا د سند د صدور دفتر.',
        next: 'د رسمي اړیکې پاڼې له لارې له ثبت دفتر یا د صدور دفتر سره اړیکه ونیسئ او د تایید بهیر وپوښتئ. که لار ونه موندل شي، د داخلې دفتر وپوښتئ چې کومه طریقه مني.'
      },
      unconfirmed: {
        name: 'نه تایید شوې لار',
        summary: 'بورس‌یار د دې دقیقې ازموینې یا نسخې لپاره بیاکتل شوې رسمي لار نه لري.',
        who: 'صادرونکې مرجع یا ازموینې مرکز.',
        next: 'د ازموینې د وړاندې کوونکي رسمي وېب پاڼه وګورئ یا له ازموینې مرکز سره اړیکه ونیسئ. دې ته مه فکر کوئ چې د بلې ازموینې لار به هم دا مورد پوښي.'
      }
    }
  }
};
