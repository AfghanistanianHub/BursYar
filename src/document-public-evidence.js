// Conservative public-reference cross-check. This never authenticates a student
// document or its holder. It compares ONLY a self-described institution label
// against independently fetched public HTML/text from /api/source.
const normalize=value=>String(value??'').normalize('NFKC').toLocaleLowerCase('en').replace(/[\u200c\u200d]/gu,' ').replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/gu,' ');
export function issuerFromText(text){
 if(typeof text!=='string')return null;
 const entries=text.split(/\r?\n/u);
 for(const line of entries){
  const match=/^(?:issuer|university|institution|issuing institution):\s*(.{3,120})$/iu.exec(line.trim());
  if(match&&/[\p{L}]/u.test(match[1]))return match[1].trim();
 }
 return null;
}
export function publicDocumentReferenceAudit(documentText,source){
 const issuer=issuerFromText(documentText);
 const referenceText=typeof source?.text==='string'?source.text:'';
 const issuerNormalized=normalize(issuer);
 const available=issuerNormalized.length>=5&&referenceText.length>=30&&source?.receipt?.kind==='server_fetched'&&source?.receipt?.trust==='public_web_unverified';
 const matched=Boolean(available&&normalize(referenceText).includes(issuerNormalized));
 return Object.freeze({
  issuerLabel:issuer,
  issuerNameFoundInPublicPage:matched,
  comparisonPossible:Boolean(available),
  publicPageUrl:source?.receipt?.sourceUrl??null,
  retrievedAt:source?.receipt?.retrievedAt??null,
  publicReferenceStatus:!available?'insufficient_public_evidence':matched?'issuer_name_mentioned':'issuer_name_not_found',
  documentAuthenticity:'not_verified',
  holderIdentity:'not_verified',
  registrarConfirmation:false,
  recommendation:'Verify the individual credential with the issuing institution using its official verification process.'
 });
}
