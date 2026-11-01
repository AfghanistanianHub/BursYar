import {DocumentError} from './documents.js';

// Trusted administrative handoff only. No HTTP entry point exists.
// verifyAuthority must independently validate legal majority, identity,
// recipient consent, guardian authority and any jurisdiction-specific rules.
// It must never trust an attestation supplied by an untrusted web client.
export function createMajorityTransferService({documents,verifyAuthority,now=()=>new Date().toISOString()}){
 if(!documents?.db||typeof documents.owner!=='function'||typeof verifyAuthority!=='function')throw Error('Trusted transfer service configuration required');
 return Object.freeze({async transfer({sourceScope,targetUid}){
  if(typeof sourceScope!=='string'||!sourceScope.startsWith('family:')||typeof targetUid!=='string'||!targetUid||targetUid.startsWith('family:'))throw new DocumentError(400);
  const decision=await verifyAuthority({sourceScope,targetUid});
  if(decision?.approved!==true||decision.sourceScope!==sourceScope||decision.targetUid!==targetUid||
     decision.recipientAdultVerified!==true||decision.recipientIdentityVerified!==true||
     decision.recipientConsentVerified!==true||decision.guardianAuthorityVerified!==true||
     decision.guardianRevocationAuthorized!==true)throw new DocumentError(403);
  const from=documents.owner(sourceScope),to=documents.owner(targetUid);
  if(from===to)throw new DocumentError(400);
  const db=documents.db;
  db.exec('BEGIN IMMEDIATE');
  try{
   const prior=db.prepare('SELECT target_owner FROM majority_transfers WHERE source_owner=?').get(from);
   if(prior){
    if(prior.target_owner!==to)throw new DocumentError(409);
    db.exec('COMMIT');return {transferred:true,alreadyTransferred:true};
   }
   for(const table of ['profiles','documents','profile_history'])
    if(db.prepare(`SELECT 1 FROM ${table} WHERE owner=? LIMIT 1`).get(to))throw new DocumentError(409);
   const profile=db.prepare('SELECT data FROM profiles WHERE owner=?').get(from);
   const docCount=db.prepare('SELECT COUNT(*) AS n FROM documents WHERE owner=?').get(from).n;
   const historyCount=db.prepare('SELECT COUNT(*) AS n FROM profile_history WHERE owner=?').get(from).n;
   if(!profile&&docCount===0&&historyCount===0)throw new DocumentError(404);
   for(const table of ['profiles','documents','profile_history'])
    db.prepare(`UPDATE ${table} SET owner=? WHERE owner=?`).run(to,from);
   // Verify all rows are now in destination before durably recording revocation.
   if(db.prepare('SELECT 1 FROM profiles WHERE owner=?').get(from)||
      db.prepare('SELECT COUNT(*) AS n FROM documents WHERE owner=?').get(from).n!==0||
      db.prepare('SELECT COUNT(*) AS n FROM profile_history WHERE owner=?').get(from).n!==0||
      db.prepare('SELECT COUNT(*) AS n FROM documents WHERE owner=?').get(to).n!==docCount||
      db.prepare('SELECT COUNT(*) AS n FROM profile_history WHERE owner=?').get(to).n!==historyCount||
      !!db.prepare('SELECT data FROM profiles WHERE owner=?').get(to)!==!!profile)
      throw new DocumentError(500);
   db.prepare('INSERT INTO majority_transfers(source_owner,target_owner,transferred_at) VALUES(?,?,?)').run(from,to,now());
   db.exec('COMMIT');
   return {transferred:true,alreadyTransferred:false};
  }catch(error){db.exec('ROLLBACK');throw error;}
 }});
}
