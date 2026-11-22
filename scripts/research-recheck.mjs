#!/usr/bin/env node
// Research source re-read assistant (BY-08).
//
//   npm run research:recheck                       # fetch, draft docs/RESEARCH-RECHECK-<today>.md
//   npm run research:recheck -- --dry-run          # print the draft, write nothing
//   npm run research:recheck -- --date=2026-12-07  # stamp the draft with another date
//   npm run research:recheck -- --only=gates-cambridge-2027,adb-jsp
//   npm run research:recheck -- --force            # overwrite an existing draft
//
// What it does: fetches each shipped `sourceUrl`, extracts the readable page with
// the same parser the app uses for source previews, and looks for the recorded
// deadline printed on the page. What it deliberately does not do: write
// `lastCheckedAt`, `lastCheckedBy` or any file under `src/`. A date is a claim a
// human makes after reading; this script only removes the typing.
import {existsSync,writeFileSync} from 'node:fs';
import {researchScholarships,researchDeadlineOn,researchCheckedOn} from '../src/research-catalog.js';
import {extractArticle,sourceURL,SourceFailure} from '../engine/source-fetch.js';
import {assessRow,renderDraft,draftPath,isIsoDay,isDraftPath} from './research-recheck-lib.mjs';

const args=process.argv.slice(2);
const flag=name=>{const hit=args.find(value=>value===`--${name}`||value.startsWith(`--${name}=`));return hit===undefined?undefined:hit.includes('=')?hit.slice(name.length+3):true;};
const today=new Date().toISOString().slice(0,10);
const date=flag('date')&&flag('date')!==true?flag('date'):today;
if(!isIsoDay(date)){
 console.error(`research:recheck — --date expects YYYY-MM-DD, got ${JSON.stringify(date)}`);
 process.exit(2);
}
const dryRun=Boolean(flag('dry-run'));
const force=Boolean(flag('force'));
const only=flag('only')&&flag('only')!==true?String(flag('only')).split(',').map(value=>value.trim()).filter(Boolean):null;
const out=draftPath(date);
// The assistant writes exactly one kind of file. Refusing anything else keeps a
// typo from landing on source data or on a reviewed record.
if(!isDraftPath(out)){
 console.error(`research:recheck — refusing to write ${out}; only docs/RESEARCH-RECHECK-<date>.md is allowed`);
 process.exit(2);
}
if(existsSync(out)&&!force&&!dryRun){
 console.error(`research:recheck — ${out} already exists. Re-read it, or pass --force if this is a fresh draft.`);
 process.exit(2);
}

const rows=only?researchScholarships.filter(row=>only.includes(row.id)):researchScholarships;
if(!rows.length){
 console.error(`research:recheck — --only matched no shipped row (${only?.join(', ')})`);
 process.exit(2);
}

const UA='BursYar-ResearchRecheck/1.0 (+https://github.com/AfghanistanianHub/BursYar)';
async function readPage(value){
 let url;
 try{url=sourceURL(value).href;}catch(error){return {error:`blocked source URL (${error.code??'invalid'})`};}
 try{
  const response=await fetch(url,{redirect:'follow',headers:{accept:'text/html, text/plain;q=0.8','user-agent':UA},signal:AbortSignal.timeout(20000)});
  if(response.status!==200)return {error:`HTTP ${response.status}`};
  const type=response.headers.get('content-type')??'';
  if(!/^(text\/html|text\/plain)(?:;|$)/i.test(type))return {error:`content-type ${type||'unknown'}`};
  const body=await response.text();
  const extracted=/^text\/plain/i.test(type)?{text:body.trim()}:extractArticle(body,response.url||url,{maxLength:200000});
  return {text:extracted.text,finalUrl:response.url||url};
 }catch(error){
  return {error:error instanceof SourceFailure?`page unavailable (${error.code})`:`fetch failed (${error.name??'error'})`};
 }
}

const results=[];
let cursor=0;
async function worker(){
 while(cursor<rows.length){
  const row=rows[cursor++];
  const page=await readPage(row.sourceUrl);
  const assessed=assessRow(row,page);
  results.push({id:row.id,recordedDeadline:researchDeadlineOn(row)??'none',currentCheckedAt:researchCheckedOn(row)??'none',...assessed});
  const mark=['deadline_found','no_recorded_deadline'].includes(assessed.status)?'OK ':'!! ';
  console.log(`${mark}${row.id.padEnd(30)} ${assessed.status.padEnd(22)} ${assessed.detail}`);
 }
}
// Three at a time: polite to the source sites, still quick.
await Promise.all(Array.from({length:Math.min(3,results.length||3)},()=>worker()));
results.sort((a,b)=>researchScholarships.findIndex(row=>row.id===a.id)-researchScholarships.findIndex(row=>row.id===b.id));

const draft=renderDraft({date,results,fetchedAt:new Date().toISOString()});
const needsWork=results.filter(result=>!['deadline_found','no_recorded_deadline'].includes(result.status));
console.log('');
if(dryRun){
 console.log(draft);
}else{
 writeFileSync(out,draft);
 console.log(`Draft written to ${out} (${results.length} rows, ${needsWork.length} needing a human decision).`);
}
console.log('No check date was written. Update src/research-data.js only after reading the pages yourself.');
process.exit(needsWork.length?1:0);
