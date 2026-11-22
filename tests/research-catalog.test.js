import test from 'node:test';
import assert from 'node:assert/strict';
import * as catalog from '../src/research-catalog.js';
const NOW = new Date('2026-11-01T12:00:00Z');
const listing = (patch = {}) => ({id:'test',title:'Award',country:'Germany',degrees:['master'],reviewStatus:'needs_reverification',deadline:null,...patch});

test('CTO inventory stays outside the trusted eligibility catalog', () => {
 assert.equal(catalog.researchScholarships.length,12);
 assert.equal(new Set(catalog.researchScholarships.map(x=>x.id)).size,12);
 for(const x of catalog.researchScholarships){
  assert.equal(x.reviewStatus,'needs_reverification');
  assert.equal(x.feeVerified,false);assert.equal(x.englishVerified,false);
  assert.ok(catalog.researchSourceUrl(x.sourceUrl));
  assert.ok(!('rules' in x));assert.ok(!('review' in x));
 }
});
test('verified fee and IELTS filters never make promises from unknowns', () => {
 const rows=[listing(),listing({id:'free',feeVerified:true,applicationFee:0}),listing({id:'paid',feeVerified:true,applicationFee:30})];
 assert.deepEqual(catalog.filterResearch(rows,{noFee:true},NOW).map(x=>x.id),['free']);
 const english=[listing(),listing({id:'alternative',englishVerified:true,ieltsRequired:false}),listing({id:'required',englishVerified:true,ieltsRequired:true})];
 assert.deepEqual(catalog.filterResearch(english,{noIelts:true},NOW).map(x=>x.id),['alternative']);
});
test('past date overrides stale open status; unknown dates remain unknown', () => {
 const rows=[listing({id:'past',deadline:'2026-10-31',status:'open'}),listing({id:'today',deadline:'2026-11-01'}),listing({id:'unknown'}),listing({id:'invalid',deadline:'2026-02-30'})];
 assert.equal(catalog.researchDeadlineState(rows[0],NOW),'past');
 assert.equal(catalog.researchDeadlineState(rows[2],NOW),'unknown');
 assert.equal(catalog.researchDeadlineState(rows[3],NOW),'unknown');
 assert.deepEqual(catalog.filterResearch(rows,{hidePast:true},NOW).map(x=>x.id),['today','unknown','invalid']);
});
test('multilingual multiword search combines country, degree and title', () => {
 const rows=[listing({title:'Science Fellowship'}),listing({id:'uk',country:'United Kingdom',degrees:['phd']})];
 for(const q of ['Germany science','آلمان ماستری','جرمني ماسټري'])assert.deepEqual(catalog.filterResearch(rows,{q},NOW).map(x=>x.id),['test']);
 assert.equal(catalog.filterResearch(rows,{degree:'phd'},NOW)[0].id,'uk');
 assert.equal(catalog.filterResearch(rows,{country:'Germany',degree:'phd'},NOW).length,0);
});
test('research links reject credentials and executable or insecure schemes', () => {
 for(const url of ['javascript:alert(1)','http://example.org','https://user:pass@example.org','data:text/html,hi'])assert.equal(catalog.researchSourceUrl(url),null);
 assert.equal(catalog.researchSourceUrl('https://example.edu/award'),'https://example.edu/award');
});
test('bookmarks retain only known public IDs and report storage failure', () => {
 let raw='["test","test","removed",{"profile":"private"}]';
 const storage={getItem:()=>raw,setItem:(_key,value)=>{raw=value;}};
 assert.deepEqual(catalog.loadResearchSaved(storage,[listing()]),['test']);
 assert.equal(catalog.saveResearchIds(storage,['test','removed'],[listing()]),true);
 assert.equal(raw,'["test"]');
 raw='{broken';assert.deepEqual(catalog.loadResearchSaved(storage,[listing()]),[]);
 const blocked={getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}};
 assert.deepEqual(catalog.loadResearchSaved(blocked,[listing()]),[]);
 assert.equal(catalog.saveResearchIds(blocked,['test'],[listing()]),false);
});
test('export contains only public metadata with honest verification labels', () => {
 const data=catalog.exportResearchSaved(['test'],[listing({profile:'SECRET',documentText:'SECRET',sourceUrl:'https://example.edu',lastCheckedAt:'2026-10-11'})],NOW);
 assert.equal(data.verification,'needs_reverification');
 assert.equal(data.entries.length,1);
 assert.ok(!JSON.stringify(data).includes('SECRET'));
 assert.equal(data.entries[0].title,'Award');
 assert.equal(data.entries[0].lastCheckedBy,null); // Unknown provenance is dropped, never guessed.
});

test('an automated read expires sooner than a human check and unknown provenance gets no human window',()=>{
 const now=new Date('2026-11-20T00:00:00Z');
 assert.equal(catalog.RESEARCH_RECHECK_DAYS.human_source_check,30);
 assert.equal(catalog.RESEARCH_RECHECK_DAYS.automated_source_read,14);
 assert.deepEqual(catalog.RESEARCH_CHECK_SOURCES,[...Object.keys(catalog.RESEARCH_RECHECK_DAYS)]);
 assert.equal(catalog.researchCheckedOn({lastCheckedAt:'2026-10-21'}),'2026-10-21');
 const human={lastCheckedAt:'2026-10-21',lastCheckedBy:'human_source_check'};
 assert.equal(catalog.researchFreshness(human,now),'fresh'); // 30 days.
 assert.equal(catalog.researchFreshness({...human,lastCheckedAt:'2026-10-20'},now),'stale'); // 31 days.
 const automated={lastCheckedAt:'2026-11-06',lastCheckedBy:'automated_source_read'};
 assert.ok(catalog.researchRecheckDays(automated)<catalog.researchRecheckDays(human));
 assert.equal(catalog.researchFreshness(automated,now),'fresh'); // 14 days.
 assert.equal(catalog.researchFreshness({...automated,lastCheckedAt:'2026-11-05'},now),'stale'); // 15 days.
 // A check with no recorded provenance is never granted the longer human window.
 assert.equal(catalog.researchRecheckDays({lastCheckedAt:'2026-10-21'}),14);
 assert.equal(catalog.researchFreshness({lastCheckedAt:'2026-10-21'},now),'stale');
 for(const value of [undefined,null,'','2026-02-30','not a date','2026-12-01'])assert.equal(catalog.researchFreshness({lastCheckedAt:value},now),'unknown',String(value));
 assert.equal(catalog.researchCheckedOn({}),null);
 assert.equal(catalog.researchCheckedBy({lastCheckedBy:'human_source_check'}),'human_source_check');
 assert.equal(catalog.researchCheckedBy({lastCheckedBy:'automated_source_read'}),'automated_source_read');
 for(const value of [undefined,null,'','someone','AUTOMATED_SOURCE_READ',42])assert.equal(catalog.researchCheckedBy({lastCheckedBy:value}),null,String(value));
});

test('the shipped export records an automated re-check that ages out inside the shorter window',()=>{
 for(const row of catalog.researchScholarships){
  assert.equal(row.lastCheckedAt,'2026-11-22',row.id);
  assert.equal(catalog.researchCheckedBy(row),'automated_source_read',row.id);
  assert.equal(catalog.researchRecheckDays(row),14,row.id);
  assert.equal(catalog.researchFreshness(row,new Date('2026-11-22T00:00:00Z')),'fresh',row.id);
  assert.equal(catalog.researchFreshness(row,new Date('2026-12-06T00:00:00Z')),'fresh',row.id); // 14 days.
  assert.equal(catalog.researchFreshness(row,new Date('2026-12-07T00:00:00Z')),'stale',row.id); // 15 days, before a human check would expire.
 }
});

test('every shipped row is inside the recheck window its provenance earns',()=>{
 // Deliberately the real clock: once a source passes its window this test fails
 // and the suite cannot pass again until the row is re-read and re-dated.
 const overdue=catalog.researchNeedsRecheck(catalog.researchScholarships,new Date());
 assert.deepEqual(overdue.map(row=>row.id),[],`Re-read these sources and set lastCheckedAt to today: ${overdue.map(row=>`${row.id} (lastCheckedAt ${row.lastCheckedAt??'missing'}, ${catalog.researchRecheckDays(row)}-day ${catalog.researchCheckedBy(row)??'unknown-provenance'} window)`).join('; ')}`);
 assert.deepEqual(catalog.researchNeedsRecheck([listing({lastCheckedAt:'2026-11-01'})],new Date('2026-11-22T00:00:00Z')).map(row=>row.id),['test']);
 assert.deepEqual(catalog.researchNeedsRecheck([listing({lastCheckedAt:'2026-11-19',lastCheckedBy:'human_source_check'})],new Date('2026-11-22T00:00:00Z')),[]);
 assert.deepEqual(catalog.researchNeedsRecheck([listing({lastCheckedAt:'2026-02-30'})],new Date('2026-11-22T00:00:00Z')).map(row=>row.id),['test']);
});

test('stale checks are labelled in the explorer and exports keep only validated check dates',async()=>{
 const fs=await import('node:fs');
 const explorer=fs.readFileSync(new URL('../src/research-explorer.js',import.meta.url),'utf8');
 assert.match(explorer,/researchCheckedOn\(row\)/);
 assert.match(explorer,/researchFreshness\(row\)/);
 assert.match(explorer,/data-freshness="stale"/);
 assert.match(explorer,/researchCheckedBy\(row\)/);
 assert.match(explorer,/data-checked-by=/);
 const {researchCopy}=await import('../src/research-copy.js');
 for(const lang of ['en','fa','ps']){assert.ok(researchCopy[lang].checkStale,lang);assert.ok(researchCopy[lang].checkAutomated,lang);assert.ok(researchCopy[lang].checkHuman,lang);}
 const data=catalog.exportResearchSaved(['bad'],[listing({id:'bad',lastCheckedAt:'2026-02-30'})],NOW);
 assert.equal(data.entries[0].lastCheckedAt,null);
});

test('country facets split destinations and keep regional descriptions out of options',()=>{
 const rows=catalog.researchScholarships;
 const countries=catalog.researchCountries(rows);
 for(const value of ['Canada','United States','Austria','Sweden','United Kingdom','Afghanistan'])assert.ok(countries.includes(value));
 assert.ok(countries.every(value=>!/[(),]/.test(value)&&!value.includes(' or ')));
 assert.equal(catalog.filterResearch(rows,{country:'Canada'},NOW)[0].id,'mmeg-us-canada');
 assert.ok(catalog.filterResearch(rows,{country:'Sweden'},NOW).some(row=>row.id==='mespom-2027'));
 assert.deepEqual(catalog.researchDestinations(rows.find(row=>row.id==='adb-jsp')),[]);
 assert.ok(!countries.includes('Japan')); // Regional text is not a complete country list.
});

test('funding facets never promote unknown research funding to confirmed support',()=>{
 const rows=[listing({id:'full',funding:'full'}),listing({id:'partial',funding:'partial'}),listing({id:'unknown'})];
 assert.deepEqual(catalog.filterResearch(rows,{funding:'full'},NOW).map(x=>x.id),['full']);
 assert.deepEqual(catalog.filterResearch(rows,{funding:'partial'},NOW).map(x=>x.id),['partial']);
 assert.deepEqual(catalog.filterResearch(rows,{funding:'unknown'},NOW).map(x=>x.id),['unknown']);
});

test('Farsi and Pashto search tolerates Arabic keyboard forms and diacritics',()=>{
 const rows=[listing({title:'Science Fellowship'}),listing({id:'uk',country:'United Kingdom',degrees:['phd']})];
 for(const q of ['آلمان ماستري','آلمان مَاستَری','جرمني ماسټري','Ｇｅｒｍａｎｙ science']){
  assert.deepEqual(catalog.filterResearch(rows,{q},NOW).map(x=>x.id),['test']);
 }
 // Searching must not change the public metadata or widen confirmed filters.
 assert.equal(rows[0].title,'Science Fellowship');
 assert.deepEqual(catalog.filterResearch(rows,{q:'آلمان ماستري',noFee:true},NOW),[]);
});
