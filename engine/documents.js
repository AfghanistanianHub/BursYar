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
  if(!state||!Array.isArray(state.documents)||state.documents.length>10||!Array.isArray(state.history)||state.history.length>20||(state.profile!==null&&typeof state.profile!=='string')||(typeof state.profile==='string'&&Buffer.byteLength(state.profile)>131072))throw new DocumentError(503);
  const owner=this.owner(uid);
  // Validate the entire untrusted snapshot before mutating the request-scoped store.
  let documents,profile,history;
  try{
   documents=state.documents.map(row=>{
    if(!row||typeof row.id!=='string'||!/^[a-f0-9-]{36}$/.test(row.id)||typeof row.data!=='string'||Buffer.byteLength(row.data)>131072)throw Error('Invalid document');
    const value=JSON.parse(row.data);
    if(!value||typeof value!=='object'||Array.isArray(value)||value.id!==row.id||typeof value.text!=='string'||typeof value.sha256!=='string'||!Array.isArray(value.pending)||createHash('sha256').update(value.text).digest('hex')!==value.sha256)throw Error('Invalid document');
    return row;
   });
   if(new Set(documents.map(row=>row.id)).size!==documents.length)throw Error('Duplicate document');
   profile=state.profile===null?null:JSON.parse(state.profile);
   if(profile!==null&&(!profile||typeof profile!=='object'||Array.isArray(profile)))throw Error('Invalid profile');
   history=state.history.map(item=>{if(typeof item!=='string'||Buffer.byteLength(item)>131072)throw Error('Invalid history');const entry=JSON.parse(item);if(!entry||typeof entry!=='object'||Array.isArray(entry)||!Array.isArray(entry.fields)||!entry.previous||typeof entry.previous!=='object'||Array.isArray(entry.previous))throw Error('Invalid history');return item;});
  }catch{throw new DocumentError(503);}
  this.db.exec('BEGIN IMMEDIATE');
  try{
   for(const row of documents)this.db.prepare('INSERT INTO documents VALUES(?,?,?)').run(row.id,owner,row.data);
   if(profile!==null)this.db.prepare('INSERT INTO profiles VALUES(?,?)').run(owner,state.profile);
   for(const item of history)this.db.prepare('INSERT INTO profile_history VALUES(?,?)').run(owner,item);
   this.db.exec('COMMIT');
  }catch{
   this.db.exec('ROLLBACK');
   throw new DocumentError(503);
  }
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
  if(!['utf8_text','local_pdf_text_or_ocr','local_image_ocr','manual_transcription_from_image','manual_transcription_from_pdf'].includes(extractionMethod))throw new DocumentError(400);
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
     // Old records labeled the bounded text parser as the extraction method.
     // Preserve lost-response retry compatibility with the previously deployed API.
     const existingMethod=existing.extractionMethod==='bounded_text_parser'?'utf8_text':existing.extractionMethod;
     if(existing.sha256!==record.sha256||existing.text!==record.text||existingMethod!==record.extractionMethod)throw new DocumentError(409);
     this.db.exec('COMMIT');return existing;
    }
   }
   // An identical upload is kept as its own consent event, but it is marked so the
   // reader and the library can say a copy already exists: ten silent duplicates
   // would fill the whole document quota with indistinguishable rows.
   for(const row of this.db.prepare('SELECT data FROM documents WHERE owner=?').all(owner)){
    const existing=JSON.parse(row.data);
    const existingMethod=existing.extractionMethod==='bounded_text_parser'?'utf8_text':existing.extractionMethod;
    if(existing.sha256===record.sha256&&existingMethod===record.extractionMethod){record.duplicateOf=existing.id;break;}
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
 list(uid){return this.db.prepare('SELECT data FROM documents WHERE owner=?').all(this.owner(uid)).map(row=>{const r=JSON.parse(row.data);return {id:r.id,uploadedAt:r.uploadedAt,reviewed:!!r.reviewedAt,consistency:r.consistency,authenticity:r.authenticity,duplicateOf:r.duplicateOf??null};});}
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
   // Manually transcribed text is a user assertion, never OCR-extracted evidence.
   // Retain sourceDocumentId for deletion, but do not assign document_extracted origin.
   if(['manual_transcription_from_image','manual_transcription_from_pdf'].includes(record.extractionMethod)){
    for(const fact of Object.values(updates)){
     fact.origin='user_declared';
     fact.claimIds=[];
     fact.reviewStatus='corrected_by_user';
    }
   }
   if(Object.entries(updates).some(([key,f])=>!validProfileValue(key,f.value)))throw new DocumentError(400);
   const current=this.profile(uid),history=record.pending.map(c=>({claimId:c.id,decision:decisions[c.id],previousFact:current[c.field]??null}));
   let profile;try{profile=mergeProfile(current,updates);}catch{throw new DocumentError(409);}
   record.reviewedAt=new Date().toISOString();record.reviewHistory=history;
   this.db.prepare('INSERT INTO profiles VALUES(?,?) ON CONFLICT(owner) DO UPDATE SET data=excluded.data').run(this.owner(uid),JSON.stringify(profile));
   this.db.prepare('UPDATE documents SET data=? WHERE id=? AND owner=?').run(JSON.stringify(record),id,this.owner(uid));
   this.db.exec('COMMIT');return profile;
  }catch(e){this.db.exec('ROLLBACK');throw e;}
 }
 // Guided field mapping (BY-12). The bounded parser recognises only exact
 // labels, so a real transcript may produce no claims at all. The student may
 // map a value by hand, but only from a line that exists verbatim in the stored
 // text. The value is their assertion (user_declared); the quoted document line
 // is the evidence it cites. Nothing is inferred, and every mapped fact stays
 // explicitly not verified.
 map(uid,id,input){
  this.assertWritable(uid);
  if(!input||typeof input!=='object'||Array.isArray(input)||!Array.isArray(input.fields)||!input.fields.length||input.fields.length>8)throw new DocumentError(400);
  // Only fields a guided form can label unambiguously; never free-form profile edits.
  const mappedFields=['degree','gpa','languageTest','courseStart','testExpiry'];
  this.db.exec('BEGIN IMMEDIATE');
  try{
   this.assertWritable(uid);
   const record=this.get(uid,id);
   const lines=new Set();
   for(const line of record.text.split(/\r?\n/)){const value=line.trim();if(value)lines.add(value);}
   const seen=new Set(),updates={};
   for(const entry of input.fields){
    if(!entry||typeof entry!=='object'||!mappedFields.includes(entry.field)||seen.has(entry.field))throw new DocumentError(400);
    seen.add(entry.field);
    if(typeof entry.sourceLine!=='string'||!entry.sourceLine.trim()||entry.sourceLine.length>500||!lines.has(entry.sourceLine.trim()))throw new DocumentError(400);
    if(!validProfileValue(entry.field,entry.value))throw new DocumentError(400);
    updates[entry.field]={
     value:structuredClone(entry.value),
     origin:'user_declared',
     claimIds:[],
     verificationStatus:'not_verified',
     sourceDocumentId:id,
     sourceExcerpt:entry.sourceLine.trim(),
     reviewStatus:'mapped_from_document'
    };
   }
   const current=this.profile(uid);
   for(const key of Object.keys(updates))if(current[key]?.origin==='issuer_verified')throw new DocumentError(409);
   let profile;try{profile=mergeProfile(current,updates);}catch{throw new DocumentError(409);}
   const mappedAt=new Date().toISOString();
   record.mapping=[...(record.mapping??[]),...input.fields.map(entry=>({field:entry.field,sourceExcerpt:entry.sourceLine.trim(),mappedAt}))];
   record.mappedAt=mappedAt;
   this.db.prepare('INSERT INTO profile_history VALUES(?,?)').run(this.owner(uid),JSON.stringify({updatedAt:mappedAt,previous:current,fields:Object.keys(updates)}));
   this.db.prepare('DELETE FROM profile_history WHERE owner=? AND rowid NOT IN (SELECT rowid FROM profile_history WHERE owner=? ORDER BY rowid DESC LIMIT 20)').run(this.owner(uid),this.owner(uid));
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
