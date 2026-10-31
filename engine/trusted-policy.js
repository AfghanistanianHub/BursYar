// Records are provisioned by a trusted verification/administration process, never
// by a browser endpoint. Read on every request so revocation takes effect at once.
// UA is conservatively denied until a trusted subnational geolocation decision
// can distinguish the restricted Crimea/Donetsk/Luhansk territories.
const metaRestricted=new Set(['AF','BY','KH','CN','HK','MO','CU','ER','ET','HT','IR','IQ','LY','MM','NI','KP','PK','RU','SO','SY','VE','EH','UA']);
export function createTrustedPolicyResolver({loadRecord,providers,now=Date.now}) {
 if(typeof loadRecord!=='function'||!providers)throw Error('Trusted policy configuration required');
 return async({uid,subjectId=null})=>{
  const record=await loadRecord(uid,subjectId);
  const p=providers[record?.provider];
  const current=now();
  if(!record||record.uid!==uid||record.subjectId!==(subjectId??uid)||record.revoked===true||
   !Number.isSafeInteger(record.verifiedAt)||record.verifiedAt>current||
   !Number.isSafeInteger(record.expiresAt)||record.expiresAt<=current||
   record.expiresAt-record.verifiedAt>86400000||!p||p.enabled!==true||
   p.termsReviewed!==true||!Number.isSafeInteger(p.termsValidUntil)||p.termsValidUntil<=current||p.privacyReviewed!==true||p.audience!=='adult_only'&&p.provider!=='self_hosted'||
   !Array.isArray(p.regions)||!p.regions.includes(record.country)||
   !/^[A-Z]{2}$/.test(record.country??'')||p.provider==='meta'&&metaRestricted.has(record.country)||record.jurisdictionDecision!=='allowed'||record.locationVerified!==true||
   record.ageVerified!==true||record.subjectAgeVerified!==true||
   record.consent?.active!==true||record.consent.version!==p.consentVersion||
   record.consent.provider!==p.provider||record.consent.subjectId!==record.subjectId||
   !Array.isArray(p.models)||!p.models.includes(p.model)||p.provider!==record.provider||
   !Number.isSafeInteger(p.maxReservationUnits)||p.maxReservationUnits<1||
   !Array.isArray(p.dataClasses)||!p.dataClasses.includes('user_content'))throw Error('Policy not cleared');
  return Object.freeze({provider:p.provider,model:p.model,userAgeBand:record.userAgeBand,subjectAgeBand:record.subjectAgeBand,
   audience:p.audience,locationDecision:'allowed',consentVerified:true,dataClass:'user_content',
   noTrainingContract:p.noTrainingContract===true,selfHostedLegalReview:p.legalReviewed===true,
   selfHostedSecurityReview:p.securityReviewed===true,maxReservationUnits:p.maxReservationUnits});
 };
}
