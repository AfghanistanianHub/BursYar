export const PROFILE_FIELDS=['degree','languageTest','academicHistory','languages','targetDegree','deferredOffer','continuingSameDegree','courseStart','testExpiry'];
const date=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
export function validProfileValue(key,value){
 if(key==='degree')return ['secondary','bachelor','master','doctorate'].includes(value);
 if(key==='targetDegree')return ['bachelor','master','doctorate'].includes(value);
 if(['deferredOffer','continuingSameDegree'].includes(key))return typeof value==='boolean';
 if(['courseStart','testExpiry'].includes(key))return date(value);
 if(['academicHistory','languages'].includes(key))return typeof value==='string'&&value.trim().length>0&&value.length<=(key==='languages'?300:1000);
 if(key==='languageTest')return !!value&&Object.keys(value).sort().join(',')==='bands,overall,test'&&!!value.bands&&Object.keys(value.bands).sort().join(',')==='listening,reading,speaking,writing'&&value.test==='IELTS Academic'&&['overall','listening','reading','writing','speaking'].every(k=>{const n=k==='overall'?value.overall:value.bands?.[k];return typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=9&&Number.isInteger(n*2);});
 return false;
}
export function manualProfileUpdates(values){
 if(!values||typeof values!=='object'||Array.isArray(values)||Object.keys(values).some(k=>!PROFILE_FIELDS.includes(k)))throw Error('Invalid profile fields');
 const updates={};
 for(const [key,value]of Object.entries(values)){
  if(value===null){updates[key]=null;continue;}
  if(!validProfileValue(key,value))throw Error('Invalid profile value');
  updates[key]={value:structuredClone(value),origin:'user_declared',verificationStatus:'not_verified',reviewStatus:'confirmed_by_user',claimIds:[]};
 }
 return updates;
}
