import {researchScholarships} from './research-catalog.js';
import {officialVerificationReviewedAt, reviewedOfficialUrl} from './official-verification.js';

// Reviewed program language requirements, separate from the research catalog's
// historical discovery metadata. A requirement is listed only when the official
// source names the exact test and variant. Nothing here implies admission,
// scholarship award, issuer verification, identity verification, or a score check.
export const reviewedProgramRequirements = Object.freeze([
  Object.freeze({
    programId: 'uts-twente-2027',
    test: 'IELTS',
    variant: 'IELTS Academic',
    sourceUrl: 'https://www.utwente.nl/en/education/master/application-admission/admission/language-requirement',
    sourceExcerpt: 'IELTS (academic) certificate, not older than two years, with an overall band score of at least 6.5, and a minimum score on each section of at least 6.0. ... IELTS General Training are not accepted by the University of Twente.',
    reviewedAt: officialVerificationReviewedAt
  }),
  Object.freeze({
    programId: 'uts-twente-2027',
    test: 'TOEFL iBT',
    variant: 'TOEFL iBT',
    sourceUrl: 'https://www.utwente.nl/en/education/master/application-admission/admission/language-requirement',
    sourceExcerpt: 'TOEFL iBT (internet-based) certificate (after January 2026): Not older than two years, with an overall score of 4.5, and a minimum score of 4.5 on reading, listening and writing.',
    reviewedAt: officialVerificationReviewedAt
  }),
  Object.freeze({
    programId: 'nyuad-2027',
    test: 'IELTS',
    variant: 'IELTS Academic',
    sourceUrl: 'https://www.nyu.edu/admissions/undergraduate-admissions/how-to-apply/standardized-tests/english-language-testing.html',
    sourceExcerpt: 'Your application will not be considered complete until you submit results from one of NYU\'s approved English language proficiency tests noted below. ... IELTS Academic (International English Language Testing System)',
    reviewedAt: officialVerificationReviewedAt
  }),
  Object.freeze({
    programId: 'nyuad-2027',
    test: 'TOEFL iBT',
    variant: 'TOEFL iBT',
    sourceUrl: 'https://www.nyu.edu/admissions/undergraduate-admissions/how-to-apply/standardized-tests/english-language-testing.html',
    sourceExcerpt: 'Your application will not be considered complete until you submit results from one of NYU\'s approved English language proficiency tests noted below. ... TOEFL iBT (Test of English as a Foreign Language Internet-Based Test). We will accept results from the in-person version or the iBT Home Edition.',
    reviewedAt: officialVerificationReviewedAt
  }),
  Object.freeze({
    programId: 'nyuad-2027',
    test: 'Duolingo English Test',
    variant: 'Duolingo English Test',
    sourceUrl: 'https://www.nyu.edu/admissions/undergraduate-admissions/how-to-apply/standardized-tests/english-language-testing.html',
    sourceExcerpt: 'Your application will not be considered complete until you submit results from one of NYU\'s approved English language proficiency tests noted below. ... Duolingo English Test',
    reviewedAt: officialVerificationReviewedAt
  }),
  Object.freeze({
    programId: 'yenching-2027',
    test: 'IELTS',
    variant: 'IELTS Academic',
    sourceUrl: 'https://yenchingacademy.pku.edu.cn/ADMISSIONS.htm',
    sourceExcerpt: 'IELTS (Academic): Overall 7.0',
    reviewedAt: officialVerificationReviewedAt
  }),
  Object.freeze({
    programId: 'yenching-2027',
    test: 'TOEFL iBT',
    variant: 'TOEFL iBT',
    sourceUrl: 'https://yenchingacademy.pku.edu.cn/ADMISSIONS.htm',
    sourceExcerpt: 'TOEFL (iBT): Overall 5 (TOEFL scores of 100 or above obtained between September 1, 2025 and January 21, 2026 will also be accepted)',
    reviewedAt: officialVerificationReviewedAt
  })
]);

const normalize = value => typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').toLowerCase() : '';

export function programForId(programId) {
  return researchScholarships.find(row => row.id === programId) ?? null;
}

// Exact test and variant only. An unknown program, a missing credential, a
// different exam, or a different variant all default to "not confirmed".
export function programAcceptance({programId, test, variant} = {}) {
  const program = programForId(programId);
  const requested = {test: test ?? null, variant: variant ?? null};
  if (!program) return {status: 'not_confirmed', reason: 'no_program', program: null, ...requested};
  const base = {
    program: {id: program.id, title: program.title, provider: program.provider},
    ...requested
  };
  if (!normalize(test) || !normalize(variant)) {
    return {...base, status: 'not_confirmed', reason: 'no_credential'};
  }
  const entry = reviewedProgramRequirements.find(item =>
    item.programId === program.id &&
    normalize(item.test) === normalize(test) &&
    normalize(item.variant) === normalize(variant) &&
    reviewedOfficialUrl(item.sourceUrl)
  );
  if (!entry) return {...base, status: 'not_confirmed', reason: 'exact_credential_not_named'};
  return {
    ...base,
    status: 'confirmed',
    sourceUrl: reviewedOfficialUrl(entry.sourceUrl),
    sourceExcerpt: entry.sourceExcerpt,
    reviewedAt: entry.reviewedAt
  };
}
