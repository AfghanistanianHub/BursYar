export const sampleScholarships=[
{id:"demo-01",country:"Canada",level:"Undergraduate",funding:"Unverified",deadline:null,source:"",demo:true},
{id:"demo-02",country:"Germany",level:"Masters",funding:"Unverified",deadline:null,source:"",demo:true},
{id:"demo-03",country:"Japan",level:"PhD",funding:"Unverified",deadline:null,source:"",demo:true}
];
export const languages=["en","fa","ps"];
// Demo explorer display labels. fa/ps strings are UNREVIEWED: no fluent
// reviewer has approved them (see docs/TRANSLATION-REVIEW.json). Canonical
// filter values stay English; these labels only affect display and search.
export const countryLabels={
Canada:{en:"Canada",fa:"کانادا",ps:"کاناډا"},
Germany:{en:"Germany",fa:"آلمان",ps:"جرمني"},
Japan:{en:"Japan",fa:"جاپان",ps:"جاپان"}
};
export const levelLabels={
Undergraduate:{en:"Undergraduate",fa:"لیسانس",ps:"لېسانس"},
Masters:{en:"Masters",fa:"ماستری",ps:"ماسټري"},
PhD:{en:"PhD",fa:"دوکتورا",ps:"دوکتورا"}
};
export function localizedCountry(country,language="en"){
return countryLabels[country]?.[language]??countryLabels[country]?.en??country;
}
export function localizedLevel(level,language="en"){
return levelLabels[level]?.[language]??levelLabels[level]?.en??level;
}
export function filterScholarships(items,{q="",country="all",level="all"}={}){
const query=q.trim().toLocaleLowerCase();
return items.filter(x=>(country==="all"||x.country===country)&&(level==="all"||x.level===level)&&(!query||[x.country,x.level,x.id,localizedCountry(x.country,"fa"),localizedCountry(x.country,"ps"),localizedLevel(x.level,"fa"),localizedLevel(x.level,"ps")].some(s=>s.toLocaleLowerCase().includes(query))));
}
export function safeWebUrl(url){
try{const u=new URL(url);return (u.protocol==="https:"||u.protocol==="http:")?u.href:null}catch{return null}
}
