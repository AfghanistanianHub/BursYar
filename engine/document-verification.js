// Document-first provenance labels. Three distinct states:
// - officially_verified: ONLY with an authorized issuing-institution response.
// - automated_inspection_only: bounded local parser / AI inspection, never official proof.
// - unverified: default; user-supplied content without verification.
// Never infer identity, age, location or authenticity from filenames or language.
export function verificationLabel(record, issuerResponse = null) {
  if (issuerResponse?.verified === true &&
      typeof issuerResponse.issuer === 'string' && issuerResponse.issuer.length > 0 &&
      issuerResponse.authorized === true) {
    return 'officially_verified';
  }
  if (record?.extractionMethod === 'bounded_text_parser' || record?.authenticity === 'not_verified') {
    if (record?.reviewedAt) return 'automated_inspection_only';
    return 'unverified';
  }
  return 'unverified';
}

export function verificationNote(label) {
  switch (label) {
    case 'officially_verified':
      return 'Verified by the issuing institution through an authorized channel.';
    case 'automated_inspection_only':
      return 'Automated inspection only; not official proof of authenticity.';
    default:
      return 'Unverified user-supplied document; requires review before use.';
  }
}
