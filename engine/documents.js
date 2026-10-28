import {manualProfileUpdates,validProfileValue} from './profile-schema.js';
import {DatabaseSync} from 'node:sqlite';
import {randomUUID,createHash} from 'node:crypto';
import {isAbsolute,dirname} from 'node:path';
import {lstatSync,openSync,closeSync,constants} from 'node:fs';
import {prepareClaims,reviewClaims,mergeProfile} from './profile-staging.js';
export class DocumentError extends Error {constructor(status){super('Document request unavailable');this.status=status;}}
// Local-only UTF-8 text document workflow. No external inference or authenticity check.
// Require a dedicated private directory; never re-use the quota database.
export class DocumentStore {
 constructor(path){
  if(!isAbsolute(path))throw Error('Absolute document database path required');
  const parent=lstatSync(dirname(path));
  if(parent.uid!==process.getuid()||!parent.isDirectory()||parent.isSymbolicLink()||(parent.mode&0o077))throw Error('Private document directory required');
  const fd=openSync(path,constants.O_CREAT|constants.O_RDWR|constants.O_NOFOLLOW,0o600);closeSync(fd);
  const file=lstatSync(path);if(file.uid!==process.getuid()||!file.isFile()||(file.mode&0o077))throw Error('Private document file required');
  this.db=new DatabaseSync(path);
  this.db.exec(`PRAGMA busy_timeout=5000; PRAGMA secure_delete=ON; CREATE TABLE IF NOT EXISTS documents(id TEXT PRIMARY KEY, owner TEXT NOT NULL, data TEXT NOT NULL); CREATE TABLE IF NOT EXISTS profiles(owner TEXT PRIMARY KEY,data TEXT NOT NULL); CREATE TABLE IF NOT EXISTS profile_history(owner TEXT NOT NULL,data TEXT NOT NULL);`);
 }
 owner(uid){if(typeof uid!=='string'||!uid||uid.length>128)throw new DocumentError(400);return createHash('sha256').update(uid).digest('hex');}
 upload(uid,input){
  const owner=this.owner(uid);
  if(input?.consent!==true||input?.mime!=='text/plain'||typeof input.text!=='string'||!input.text.trim()||Buffer.byteLength(input.text)>12000||/[\x00-\x08\x0b\x0c\x0e-\x1f\ufffd]/u.test(input.text))throw new DocumentError(400);
  const id=randomUUID(),claims=[];
  // Deliberately narrow extraction; preserve full original and exact line evidence.
  // A document must use these explicit field labels. Other text is retained for review.
  for(const line of input.text.split(/\r?\n/)){
   let m=/^Degree: (secondary|bachelor|master|doctorate)$/.exec(line);
   if(m)claims.push({field:'degree',value:m[1],sourceExcerpt:line});
   m=/^IELTS Academic: overall=(\d(?:\.\d)?); listening=(\d(?:\.\d)?); reading=(\d(?:\.\d)?); writing=(\d(?:\.\d)?); speaking=(\d(?:\.\d)?)$/.exec(line);
   if(m&&m.slice(1).every(v=>Number(v)<=9&&Number.isInteger(Number(v)*2)))claims.push({field:'languageTest',value:{test:'IELTS Academic',overall:Number(m[1]),bands:Object.fromEntries(['listening','reading','writing','speaking'].map((n,i)=>[n,Number(m[i+2])]))},sourceExcerpt:line});
  }
  const duplicate=claims.some((c,i)=>claims.findIndex(x=>x.field===c.field)!==i);
  const record={id,text:input.text,sha256:createHash('sha256').update(input.text).digest('hex'),uploadedAt:new Date().toISOString(),consentVersion:1,extractionMethod:'bounded_text_parser',authenticity:'not_verified',translationStatus:'not_assessed',consistency:duplicate?'discrepancy_requires_review':'not_assessed',pending:duplicate?[]:prepareClaims(id,claims)};
  this.db.exec('BEGIN IMMEDIATE');
  try{if(this.db.prepare('SELECT count(*) AS n FROM documents WHERE owner=?').get(owner).n>=10)throw new DocumentError(429);this.db.prepare('INSERT INTO documents VALUES(?,?,?)').run(id,owner,JSON.stringify(record));this.db.exec('COMMIT');}catch(e){this.db.exec('ROLLBACK');throw e;}
  return record;
 }
 get(uid,id){
  if(typeof id!=='string'||!/^[a-f0-9-]{36}$/.test(id))throw new DocumentError(404);
  const row=this.db.prepare('SELECT data FROM documents WHERE id=? AND owner=?').get(id,this.owner(uid));
  if(!row)throw new DocumentError(404);return JSON.parse(row.data);
 }
 profile(uid){const row=this.db.prepare('SELECT data FROM profiles WHERE owner=?').get(this.owner(uid));return row?JSON.parse(row.data):{};}
 list(uid){return this.db.prepare('SELECT data FROM documents WHERE owner=?').all(this.owner(uid)).map(row=>{const r=JSON.parse(row.data);return {id:r.id,uploadedAt:r.uploadedAt,reviewed:!!r.reviewedAt,consistency:r.consistency,authenticity:r.authenticity};});}
 updateProfile(uid,input){
  if(input?.consent!==true)throw new DocumentError(400);
  let updates;try{updates=manualProfileUpdates(input.values);}catch{throw new DocumentError(400);}
  const owner=this.owner(uid);this.db.exec('BEGIN IMMEDIATE');
  try{
   const current=this.profile(uid),next=structuredClone(current);
   for(const [key,value]of Object.entries(updates)){
    if(current[key]?.origin==='issuer_verified')throw new DocumentError(409);
    if(value===null)delete next[key];else next[key]=value;
   }
   this.db.prepare('INSERT INTO profile_history VALUES(?,?)').run(owner,JSON.stringify({updatedAt:new Date().toISOString(),previous:current,fields:Object.keys(updates)}));
   // Bound sensitive edit history independently of document count.
   this.db.prepare('DELETE FROM profile_history WHERE owner=? AND rowid NOT IN (SELECT rowid FROM profile_history WHERE owner=? ORDER BY rowid DESC LIMIT 20)').run(owner,owner);
   this.db.prepare('INSERT INTO profiles VALUES(?,?) ON CONFLICT(owner) DO UPDATE SET data=excluded.data').run(owner,JSON.stringify(next));
   this.db.exec('COMMIT');return next;
  }catch(e){this.db.exec('ROLLBACK');throw e;}
 }
 deleteProfile(uid){const owner=this.owner(uid);this.db.exec('BEGIN IMMEDIATE');try{this.db.prepare('DELETE FROM profiles WHERE owner=?').run(owner);this.db.prepare('DELETE FROM profile_history WHERE owner=?').run(owner);for(const row of this.db.prepare('SELECT id,data FROM documents WHERE owner=?').all(owner)){const doc=JSON.parse(row.data);for(const entry of doc.reviewHistory??[])entry.previousFact=null;this.db.prepare('UPDATE documents SET data=? WHERE id=? AND owner=?').run(JSON.stringify(doc),row.id,owner);}this.db.exec('COMMIT');return {deleted:true};}catch(e){this.db.exec('ROLLBACK');throw e;}}
 review(uid,id,decisions){
  this.db.exec('BEGIN IMMEDIATE');
  try{
   const record=this.get(uid,id);
   if(record.reviewedAt||record.consistency==='discrepancy_requires_review'||record.pending.length===0)throw new DocumentError(409);
   let updates;try{updates=reviewClaims(record.pending,decisions);}catch{throw new DocumentError(400);}
   if(Object.entries(updates).some(([key,f])=>!validProfileValue(key,f.value)))throw new DocumentError(400);
   const current=this.profile(uid),history=record.pending.map(c=>({claimId:c.id,decision:decisions[c.id],previousFact:current[c.field]??null}));
   let profile;try{profile=mergeProfile(current,updates);}catch{throw new DocumentError(409);}
   record.reviewedAt=new Date().toISOString();record.reviewHistory=history;
   this.db.prepare('INSERT INTO profiles VALUES(?,?) ON CONFLICT(owner) DO UPDATE SET data=excluded.data').run(this.owner(uid),JSON.stringify(profile));
   this.db.prepare('UPDATE documents SET data=? WHERE id=? AND owner=?').run(JSON.stringify(record),id,this.owner(uid));
   this.db.exec('COMMIT');return profile;
  }catch(e){this.db.exec('ROLLBACK');throw e;}
 }
 delete(uid,id){
  this.db.exec('BEGIN IMMEDIATE');
  try{this.get(uid,id);const owner=this.owner(uid),profile=this.profile(uid);
   for(const [key,fact]of Object.entries(profile))if(fact.sourceDocumentId===id)delete profile[key];
   this.db.prepare('DELETE FROM documents WHERE owner=? AND id=?').run(owner,id);
   this.db.prepare('DELETE FROM profile_history WHERE owner=?').run(owner);
   for(const row of this.db.prepare('SELECT id,data FROM documents WHERE owner=?').all(owner)){const other=JSON.parse(row.data);if(other.reviewHistory){for(const h of other.reviewHistory)if(h.previousFact?.sourceDocumentId===id)h.previousFact=null;this.db.prepare('UPDATE documents SET data=? WHERE id=? AND owner=?').run(JSON.stringify(other),row.id,owner);}}
   this.db.prepare('INSERT INTO profiles VALUES(?,?) ON CONFLICT(owner) DO UPDATE SET data=excluded.data').run(owner,JSON.stringify(profile));
   this.db.exec('COMMIT');return {deleted:true};
  }catch(e){this.db.exec('ROLLBACK');throw e;}
 }
 close(){this.db.close();}
}
