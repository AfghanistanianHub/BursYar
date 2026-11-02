import {researchData} from './research-data.js';
export const researchScholarships = Object.freeze(researchData.map(row => Object.freeze({...row,degrees:Object.freeze([...row.degrees])})));
// Explicit mappings preserve the original display metadata. Regional coverage
// is deliberately not expanded into an invented complete country list.
const destinations = {
 'United States or Canada':['United States','Canada'],
 'Austria, Sweden, United Kingdom':['Austria','Sweden','United Kingdom'],
 'Afghanistan (online, international accreditation)':['Afghanistan'],
 'Asia and the Pacific (17 of the 27 designated institutions are in Japan)':[]
};
export function researchDestinations(row){return destinations[row.country]??(row.country?[row.country]:[]);}
export function researchCountries(rows=researchScholarships){return [...new Set(rows.flatMap(researchDestinations))].sort();}
const countryNames = {
 'Canada':['کانادا','کاناډا'],
 'United States':['ایالات متحده','متحده ایالات'],
 'Austria':['اتریش','اتریش'],
 'Sweden':['سوئد','سویډن'],
 'Afghanistan':['افغانستان','افغانستان'],
 'Germany': ['آلمان','جرمني'],
 'United Kingdom': ['بریتانیا','بریتانیا'],
 'United Arab Emirates': ['امارات متحدهٔ عربی','متحده عربي امارات'],
 'Bangladesh': ['بنگلادش','بنګله دېش'],
 'Saudi Arabia': ['عربستان سعودی','سعودي عربستان'],
 'China': ['چین','چین'],
 'Netherlands': ['هلند','هالنډ'],
 'United States or Canada': ['ایالات متحده یا کانادا','متحده ایالات یا کاناډا'],
 'Austria, Sweden, United Kingdom': ['اتریش، سوئد، بریتانیا','اتریش، سویډن، بریتانیا'],
 'Afghanistan (online, international accreditation)': ['افغانستان (آنلاین، اعتبار بین‌المللی)','افغانستان (انلاین، نړیوال اعتبار)'],
 'Asia and the Pacific (17 of the 27 designated institutions are in Japan)': ['آسیا و اقیانوسیه (۱۷ نهاد از ۲۷ نهاد در جاپان)','اسیا او ارام سمندر (له ۲۷ ادارو ۱۷ په جاپان کې دي)']
};
const degreeNames={bachelor:['لیسانس','لېسانس'],master:['ماستری','ماسټري'],phd:['دوکتورا','دوکتورا']};
export function researchLabel(value,language='en') {
 const pair=countryNames[value]??degreeNames[value];
 return pair&&['fa','ps'].includes(language)?pair[language==='fa'?0:1]:value;
}
export function researchSourceUrl(value) {
 try {const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password?url.href:null;} catch {return null;}
}
export function researchDeadlineState(row,now=new Date()) {
 const value=row.deadline;
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return 'unknown';
 const date=new Date(value+'T00:00:00Z');
 if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==value)return 'unknown';
 return value<now.toISOString().slice(0,10)?'past':'unconfirmed';
}
// Pure discovery filters; no student data, eligibility score, or exclusion for
// missing credentials. "No IELTS" never means no English requirement.
export function filterResearch(rows,{q='',country='all',degree='all',funding='all',noFee=false,noIelts=false,hidePast=false}={},now=new Date()) {
 const words=q.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
 return rows.filter(row=>{
  if(country!=='all'&&!researchDestinations(row).includes(country))return false;
  if(funding!=='all'&&(row.funding??'unknown')!==funding)return false;
  if(degree!=='all'&&!row.degrees.includes(degree))return false;
  if(noFee&&!(row.feeVerified===true&&row.applicationFee===0))return false;
  if(noIelts&&!(row.englishVerified===true&&row.ieltsRequired===false))return false;
  if(hidePast&&researchDeadlineState(row,now)==='past')return false;
  const haystack=[row.id,row.title,row.provider,row.country,...row.degrees,...['fa','ps'].flatMap(lang=>[researchLabel(row.country,lang),...row.degrees.map(d=>researchLabel(d,lang))])].join(' ').toLocaleLowerCase();
  return words.every(word=>haystack.includes(word));
 });
}
const SAVED_KEY='bursyar:research-saved:v1';
const knownIds=(ids,rows)=>[...new Set(Array.isArray(ids)?ids.filter(id=>typeof id==='string'&&rows.some(row=>row.id===id)):[])];
export function loadResearchSaved(storage,rows=researchScholarships) {
 try{return knownIds(JSON.parse(storage.getItem(SAVED_KEY)??'[]'),rows);}catch{return [];}
}
export function saveResearchIds(storage,ids,rows=researchScholarships) {
 try{storage.setItem(SAVED_KEY,JSON.stringify(knownIds(ids,rows)));return true;}catch{return false;}
}
export function exportResearchSaved(ids,rows=researchScholarships,now=new Date()) {
 const known=new Set(knownIds(ids,rows));
 return {format:'bursyar-public-research-v1',exportedAt:now.toISOString(),verification:'needs_reverification',entries:rows.filter(row=>known.has(row.id)).map(row=>({
  id:row.id,title:row.title,provider:row.provider,country:row.country,degrees:[...row.degrees],sourceUrl:researchSourceUrl(row.sourceUrl),lastCheckedAt:row.lastCheckedAt??null,deadline:row.deadline??null,reviewStatus:'needs_reverification'
 }))};
}
