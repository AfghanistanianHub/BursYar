import {manualProfileUpdates,validProfileValue} from './profile-schema.js';
import {DatabaseSync} from 'node:sqlite';
import {randomUUID,createHash} from 'node:crypto';
import {isAbsolute,dirname} from 'node:path';
import {lstatSync,openSync,closeSync,constants} from 'node:fs';
import {prepareClaims,reviewClaims,mergeProfile} from './profile-staging.js';
export class DocumentError extends Error {constructor(status){super('Document request unavailable');this.status=status;}}
// Local-only UTF-8 text document workflow. No external inference or authenticity check.
// Require a dedicated private directory; never re-use the quota database.
const DOCUMENT_SCHEMA=`PRAGMA busy_timeout=5000; PRAGMA secure_delete=ON; CREATE TABLE IF NOT EXISTS documents(id TEXT PRIMARY KEY, owner TEXT NOT NULL, data TEXT NOT NULL); CREATE TABLE IF NOT EXISTS profiles(owner TEXT PRIMARY KEY,data TEXT NOT NULL); CREATE TABLE IF NOT EXISTS profile_history(owner TEXT NOT NULL,data TEXT NOT NULL); CREATE TABLE IF NOT EXISTS majority_transfers(source_owner TEXT PRIMARY KEY,target_owner TEXT NOT NULL, transferred_at TEXT NOT NULL);`;
export class DocumentStore {
 constructor(path){
  if(!isAbsolute(path))throw Error('Absolute document database path required');
  const parent=lstatSync(dirname(path));
  if(parent.uid!==process.getuid()||!parent.isDirectory()||parent.isSymbolicLink()||(parent.mode&0o077))throw Error('Private document directory required');
  const fd=openSync(path,constants.O_CREAT|constants.O_RDWR|constants.O_NOFOLLOW,0o600);closeSync(fd);
  const file=lstatSync(path);if(file.uid!==process.getuid()||!file.isFile()||(file.mode&0o077))throw Error('Private document file required');
  this.db=new DatabaseSync(path);
  this.db.exec(DOCUMENT_SCHEMA);
 }
 // A request-scoped working copy; never a persistence fallback.
 static memory(){const store=Object.create(DocumentStore.prototype);store.db=new DatabaseSync(':memory:');store.db.exec(DOCUMENT_SCHEMA);return store;}
 restore(uid,state){
  if(state===null)return;
  if(!state||!Array.isArray(state.documents)||state.documents.length>10||!Array.isArray(state.history)||state.history.length>20||(state.profile!==null&&typeof state.profile!=='string'))throw new DocumentError(503);
  const owner=this.owner(uid);
  for(const row of state.documents){if(!row||typeof row.id!=='string'||!/^[a-f0-9-]{36}$/.test(row.id)||typeof row.data!=='string'||JSON.parse(row.data).id!==row.id)throw new DocumentError(503);this.db.prepare('INSERT INTO documents VALUES(?,?,?)').run(row.id,owner,row.data);}
  if(state.profile!==null){const profile=JSON.parse(state.profile);if(!profile||typeof profile!=='object'||Array.isArray(profile))throw new DocumentError(503);this.db.prepare('INSERT INTO profiles VALUES(?,?)').run(owner,state.profile);}
  for(const item of state.history){if(typeof item!=='string')throw new DocumentError(503);JSON.parse(item);this.db.prepare('INSERT INTO profile_history VALUES(?,?)').run(owner,item);}
 }
 snapshot(uid){const owner=this.owner(uid);return {documents:this.db.prepare('SELECT id,data FROM documents WHERE owner=? ORDER BY rowid').all(owner).map(r=>({...r})),profile:this.db.prepare('SELECT data FROM profiles WHERE owner=?').get(owner)?.data??null,history:this.db.prepare('SELECT data FROM profile_history WHERE owner=? ORDER BY rowid').all(owner).map(r=>r.data)};}
 export(uid){return {profile:this.profile(uid),documents:this.list(uid).map(d=>this.get(uid,d.id)),issuerAuthenticated:false};}
 isTransferred(uid){return !!this.db.prepare('SELECT 1 FROM majority_transfers WHERE source_owner=?').get(this.owner(uid));}
 owner(uid){if(typeof uid!=='string'||!uid||uid.length>128)throw new DocumentError(400);return createHash('sha256').update(uid).digest('hex');}
 assertWritable(uid){if(this.isTransferred(uid))throw new DocumentError(403);}

 upload(uid,input){
  this.assertWritable(uid);
  const owner=this.owner(uid);
  if(input?.consent!==true||input?.mime!=='text/plain'||typeof input.text!=='string'||!input.text.trim()||Buffer.byteLength(input.text)>12000||/[\x00-\x08\x0b\x0c\x0e-\x1f\ufffd]/u.test(input.text))throw new DocumentError(400);
  // Extraction provenance is caller-reported, not an authenticity credential.
  // Reject unknown methods instead of allowing an untrusted 'verified' status.
  const extractionMethod=input.extractionMethod??'utf8_text';
  if(!['utf8_text','local_pdf_text_or_ocr','local_image_ocr'].includes(extractionMethod))throw new DocumentError(400);
  // A client-generated request identifier makes lost-response retries safe.
  // Legacy callers may omit it; malformed identifiers cannot bypass validation.
  if(input.requestId!==undefined&&(typeof input.requestId!=='string'||!/^[a-f0-9-]{36}$/.test(input.requestId)))throw new DocumentError(400);
  const id=randomUUID(),claims=[];
  // Deliberately narrow extraction; preserve full original and exact line evidence.
  // A document must use these explicit field labels: Degree, IELTS Academic,
  // GPA and TOEFL iBT. Other text is retained for review, never parsed.
  for(const line of input.text.split(/\r?\n/)){
   let m=/^Degree: (secondary|bachelor|master|doctorate)$/.exec(line);
   if(m)claims.push({field:'degree',value:m[1],sourceExcerpt:line});
   // Conservative exact-label translations for Afghan academic records.
   // Never infer degree equivalency from layout or an LLM guess.
   const localDegree=/^(?:مدرک تحصیلی|مقطع تحصیلی|درجه تحصیلی|تحصیلي کچه|تحصیلي درجه)\s*[:：]\s*(لیسانس|لېسانس|کارشناسی|ماستری|ماسټري|کارشناسی ارشد|دکترا|دوکتورا|دیپلم|دیپلوم|بکلوریا)$/u.exec(line.trim());
   if(localDegree){
    const degrees={'لیسانس':'bachelor','لېسانس':'bachelor','کارشناسی':'bachelor','ماستری':'master','ماسټري':'master','کارشناسی ارشد':'master','دکترا':'doctorate','دوکتورا':'doctorate','دیپلم':'secondary','دیپلوم':'secondary','بکلوریا':'secondary'};
    claims.push({field:'degree',value:degrees[localDegree[1]],sourceExcerpt:line});
   }
   m=/^IELTS Academic: overall=(\d(?:\.\d)?); listening=(\d(?:\.\d)?); reading=(\d(?:\.\d)?); writing=(\d(?:\.\d)?); speaking=(\d(?:\.\d)?)$/.exec(line);
   if(m&&m.slice(1).every(v=>Number(v)<=9&&Number.isInteger(Number(v)*2)))claims.push({field:'languageTest',value:{test:'IELTS Academic',overall:Number(m[1]),bands:Object.fromEntries(['listening','reading','writing','speaking'].map((n,i)=>[n,Number(m[i+2])]))},sourceExcerpt:line});
   m=/^GPA: (\d(?:\.\d{1,2})?)\/(4(?:\.0)?|5(?:\.0)?)$/.exec(line);
   if(m){const gpa=Number(m[1]),scale=Number(m[2]);if(gpa<=scale)claims.push({field:'gpa',value:{gpa,scale},sourceExcerpt:line});}
   const digits=line.replace(/[۰-۹]/gu,ch=>String(ch.charCodeAt(0)-0x06f0)).replace(/[٠-٩]/gu,ch=>String(ch.charCodeAt(0)-0x0660));
   const localGpa=/^(?:معدل|اوسط نمرات|د نمرو اوسط)\s*[:：]\s*(\d(?:\.\d{1,2})?)\s*\/\s*(4(?:\.0)?|5(?:\.0)?)$/u.exec(digits.trim());
   if(localGpa){const gpa=Number(localGpa[1]),scale=Number(localGpa[2]);if(gpa<=scale)claims.push({field:'gpa',value:{gpa,scale},sourceExcerpt:line});}
   m=/^TOEFL iBT: overall=(\d{1,3}); listening=(\d{1,2}); reading=(\d{1,2}); writing=(\d{1,2}); speaking=(\d{1,2})$/.exec(line);
   if(m){const n=m.slice(1).map(Number);if(n[0]<=120&&n.slice(1).every(v=>v<=30))claims.push({field:'languageTest',value:{test:'TOEFL iBT',overall:n[0],sections:Object.fromEntries(['listening','reading','writing','speaking'].map((k,i)=>[k,n[i+1]]))},sourceExcerpt:line});}
  }
  const duplicate=claims.some((c,i)=>claims.findIndex(x=>x.field===c.field)!==i);
  const record={id,text:input.text,requestId:input.requestId??null,sha256:createHash('sha256').update(input.text).digest('hex'),uploadedAt:new Date().toISOString(),consentVersion:1,extractionMethod,claimParser:'bounded_text_parser',authenticity:'not_verified',translationStatus:'not_assessed',consistency:duplicate?'discrepancy_requires_review':'not_assessed',pending:duplicate?[]:prepareClaims(id,claims)};
  this.db.exec('BEGIN IMMEDIATE');
  try{this.assertWritable(uid);
   if(input.requestId){
    for(const row of this.db.prepare('SELECT data FROM documents WHERE owner=?').all(owner)){
     const existing=JSON.parse(row.data);
     if(existing.requestId!==input.requestId)continue;
     if(existing.sha256!==record.sha256||existing.text!==record.text)throw new DocumentError(409);
     this.db.exec('COMMIT');return existing;
    }
   }
   if(this.db.prepare('SELECT count(*) AS n FROM documents WHERE owner=?').get(owner).n>=10)throw new DocumentError(429);this.db.prepare('INSERT INTO documents VALUES(?,?,?)').run(id,owner,JSON.stringify(record));this.db.exec('COMMIT');}catch(e){this.db.exec('ROLLBACK');throw e;}
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
  this.assertWritable(uid);
  if(input?.consent!==true)throw new DocumentError(400);
  let updates;try{updates=manualProfileUpdates(input.values);}catch{throw new DocumentError(400);}
  const owner=this.owner(uid);this.db.exec('BEGIN IMMEDIATE');
  try{this.assertWritable(uid);
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
 deleteProfile(uid){
  this.assertWritable(uid);const owner=this.owner(uid);this.db.exec('BEGIN IMMEDIATE');try{this.assertWritable(uid);this.db.prepare('DELETE FROM profiles WHERE owner=?').run(owner);this.db.prepare('DELETE FROM profile_history WHERE owner=?').run(owner);for(const row of this.db.prepare('SELECT id,data FROM documents WHERE owner=?').all(owner)){const doc=JSON.parse(row.data);for(const entry of doc.reviewHistory??[])entry.previousFact=null;this.db.prepare('UPDATE documents SET data=? WHERE id=? AND owner=?').run(JSON.stringify(doc),row.id,owner);}this.db.exec('COMMIT');return {deleted:true};}catch(e){this.db.exec('ROLLBACK');throw e;}}
 review(uid,id,decisions){
  this.assertWritable(uid);
  this.db.exec('BEGIN IMMEDIATE');
  try{this.assertWritable(uid);
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
  this.assertWritable(uid);
  this.db.exec('BEGIN IMMEDIATE');
  try{this.assertWritable(uid);this.get(uid,id);const owner=this.owner(uid),profile=this.profile(uid);
   for(const [key,fact]of Object.entries(profile))if(fact.sourceDocumentId===id)delete profile[key];
   this.db.prepare('DELETE FROM documents WHERE owner=? AND id=?').run(owner,id);
   this.db.prepare('DELETE FROM profile_history WHERE owner=?').run(owner);
   for(const row of this.db.prepare('SELECT id,data FROM documents WHERE owner=?').all(owner)){const other=JSON.parse(row.data);if(other.reviewHistory){for(const h of other.reviewHistory)if(h.previousFact?.sourceDocumentId===id)h.previousFact=null;this.db.prepare('UPDATE documents SET data=? WHERE id=? AND owner=?').run(JSON.stringify(other),row.id,owner);}}
   this.db.prepare('INSERT INTO profiles VALUES(?,?) ON CONFLICT(owner) DO UPDATE SET data=excluded.data').run(owner,JSON.stringify(profile));
   this.db.exec('COMMIT');return {deleted:true};
  }catch(e){this.db.exec('ROLLBACK');throw e;}
 }
 eraseOwner(uid){
  this.assertWritable(uid);
  const owner=this.owner(uid);this.db.exec('BEGIN IMMEDIATE');
  try{this.assertWritable(uid);for(const table of ['documents','profiles','profile_history'])this.db.prepare(`DELETE FROM ${table} WHERE owner=?`).run(owner);this.db.exec('COMMIT');}catch(error){this.db.exec('ROLLBACK');throw error;}
 }
 close(){this.db.close();}
}
