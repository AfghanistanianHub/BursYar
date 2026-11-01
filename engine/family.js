import {createHash} from 'node:crypto';
// Grant management is a trusted administrative workflow. Self-declared browser
// guardian status never confers access to a student or external model route.
export async function resolveFamilyScope({uid,subjectId,loadGrant,now=Date.now}){
 if(typeof uid!=='string'||!uid||typeof subjectId!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(subjectId)||typeof loadGrant!=='function')throw Error('Family unavailable');
 const grant=await loadGrant(uid,subjectId);
 if(!grant||grant.guardianUid!==uid||grant.subjectId!==subjectId||grant.authorityVerified!==true||grant.consentActive!==true||grant.subjectAgeBand!=='under_18'||!Number.isSafeInteger(grant.expiresAt)||grant.expiresAt<=now())throw Error('Family unavailable');
 return Object.freeze({storageOwner:'family:'+createHash('sha256').update(JSON.stringify([uid,subjectId])).digest('hex'),processing:'deterministic'});
}
