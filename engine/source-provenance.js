import {createHash} from 'node:crypto';

// A local, offline evidence audit. This module NEVER asserts issuer authenticity.
// URL/domain matching alone cannot establish official institutional provenance.
const sha256 = value => createHash('sha256').update(value).digest('hex');
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
function safeUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password ||
        url.hash || !url.hostname.includes('.') ||
        url.hostname === 'localhost' || url.hostname.endsWith('.localhost') ||
        /^[0-9.]+$/.test(url.hostname) || url.hostname.includes('%'))
      return null;
    return url;
  } catch { return null; }
}
function day(value) {
  if (typeof value !== 'string' || !ISO_DAY.test(value)) return null;
  const d = new Date(value + 'T00:00:00Z');
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0,10) === value ? d : null;
}
export function auditScholarshipEvidence({sourceUrl, sourceText, excerpt, expectedDigest, capturedOn, checkedOn, maxAgeDays=90, contradictions=[]} = {}) {
  const issues = [];
  const url = safeUrl(sourceUrl);
  if (!url) issues.push('invalid_source_url');
  if (typeof sourceText !== 'string' || !sourceText.trim()) issues.push('missing_source_text');
  if (typeof excerpt !== 'string' || !excerpt.trim() ||
      typeof sourceText !== 'string' ||
      !sourceText.split(/\r?\n/u).some(line => line.trim() === excerpt))
    issues.push('excerpt_not_exact_complete_line');
  const sourceDigest = typeof sourceText === 'string' ? sha256(sourceText) : null;
  if (typeof expectedDigest !== 'string' || !/^[0-9a-f]{64}$/.test(expectedDigest) ||
      sourceDigest !== expectedDigest)
    issues.push('source_digest_mismatch');
  const captured = day(capturedOn), checked = day(checkedOn);
  if (!captured || !checked || captured > checked ||
      !Number.isSafeInteger(maxAgeDays) || maxAgeDays < 0 || maxAgeDays > 365)
    issues.push('invalid_freshness_metadata');
  else if (Math.floor((checked.getTime() - captured.getTime()) / 86400000) > maxAgeDays)
    issues.push('source_outdated');
  if (!Array.isArray(contradictions) || contradictions.length > 0)
    issues.push('unresolved_contradiction');
  return Object.freeze({
    sourceUrl: url?.href ?? null, sourceDigest,
    excerptMatched: !issues.includes('excerpt_not_exact_complete_line'),
    metadataConsistent: issues.length === 0,
    issues: Object.freeze(issues),
    sourceAuthenticity: 'unverified',
    institutionalAcceptance: 'unknown',
    requiresHumanReview: true,
    translationStatus: 'UNREVIEWED'
  });
}
