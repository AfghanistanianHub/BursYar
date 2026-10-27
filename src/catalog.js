export const sampleScholarships=[
{id:"demo-01",country:"Canada",level:"Undergraduate",funding:"Unverified",deadline:null,source:"",demo:true},
{id:"demo-02",country:"Germany",level:"Masters",funding:"Unverified",deadline:null,source:"",demo:true},
{id:"demo-03",country:"Japan",level:"PhD",funding:"Unverified",deadline:null,source:"",demo:true}
];
export const languages=["en","fa","ps"];
export function filterScholarships(items,{q="",country="all",level="all"}={}){
 const query=q.trim().toLocaleLowerCase();
 return items.filter(x=>(country==="all"||x.country===country)&&(level==="all"||x.level===level)&&(!query||[x.country,x.level,x.id].some(s=>s.toLocaleLowerCase().includes(query))));
}
export function safeWebUrl(url){
 try{const u=new URL(url);return (u.protocol==="https:"||u.protocol==="http:")?u.href:null}catch{return null}
}
