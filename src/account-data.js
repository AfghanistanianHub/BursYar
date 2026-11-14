import {getInferenceToken} from './auth.js';
import {documentRequest} from './document-request.js';

const copy={
 en:{
  title:'Stored profile and documents',
  note:'Download or delete the profile and documents stored by BursYar for your signed-in account.',
  download:'Download profile and documents (JSON)', erase:'Delete stored profile and documents',
  confirm:'Permanently delete my stored profile and documents', cancel:'Cancel',
  warning:'This deletion cannot be undone. Your sign-in account and bookmarks saved in this browser stay available.',
  downloaded:'Your download is ready.', deleted:'Your stored profile and documents were deleted.',
  signIn:'Sign in with an approved account to manage your data.',
  error:'The data request could not be completed.',
  uncertain:'Deletion could not be confirmed. Download your stored data to check what remains.'
 },
 fa:{
  title:'پروفایل و مدارک ذخیره‌شده',
  note:'پروفایل و مدارکی را که بورس‌یار برای حساب فعلی ذخیره کرده دریافت یا حذف کنید.',
  download:'دریافت پروفایل و مدارک (JSON)', erase:'حذف پروفایل و مدارک ذخیره‌شده',
  confirm:'حذف دائمی پروفایل و مدارک من', cancel:'انصراف',
  warning:'این حذف قابل بازگشت نیست. حساب ورود و نشانک‌های ذخیره‌شده در این مرورگر در دسترس می‌مانند.',
  downloaded:'فایل برای دریافت آماده شد.', deleted:'پروفایل و مدارک ذخیره‌شدهٔ شما حذف شد.',
  signIn:'برای مدیریت داده‌ها با حساب مجاز وارد شوید.',
  error:'درخواست داده انجام نشد.',
  uncertain:'حذف تأیید نشد. داده‌های ذخیره‌شده را دریافت کنید تا ببینید چه چیزی باقی مانده است.'
 },
 ps:{
  title:'ساتل شوی پروفایل او اسناد',
  note:'هغه پروفایل او اسناد ښکته یا ړنګ کړئ چې بورس‌یار ستاسو اوسني حساب ته ساتلي دي.',
  download:'پروفایل او اسناد ښکته کړئ (JSON)', erase:'ساتل شوی پروفایل او اسناد ړنګ کړئ',
  confirm:'زما ساتل شوی پروفایل او اسناد د تل لپاره ړنګ کړئ', cancel:'لغوه کول',
  warning:'دا ړنګول بېرته نه راګرځي. د ننوتلو حساب او په دې براوزر کې ساتل شوې نښې پاتې کېږي.',
  downloaded:'ستاسو فایل ښکته کولو ته چمتو دی.', deleted:'ستاسو ساتل شوی پروفایل او اسناد ړنګ شول.',
  signIn:'د معلوماتو د سمبالولو لپاره له مجاز حساب سره ننوځئ.',
  error:'د معلوماتو غوښتنه بشپړه نه شوه.',
  uncertain:'ړنګول تایید نه شول. ساتل شوي معلومات ښکته کړئ او وګورئ چې څه پاتې دي.'
 }
};

let identityVersion=0;
let resetAccountData;
document.addEventListener('bursyar:identity',()=>{
 identityVersion++;
 resetAccountData?.();
});

export function mountAccountData(root,language='en'){
 const t=copy[language]??copy.en;
 const add=(tag,text,parent=root)=>{
  const element=document.createElement(tag);
  element.textContent=text;
  parent.append(element);
  return element;
 };
 add('h3',t.title);
 add('p',t.note);
 const download=add('button',t.download);
 const erase=add('button',t.erase);
 const confirmation=add('dialog','');
 const warning=add('p',t.warning,confirmation);
 warning.id='account-data-delete-warning';
 confirmation.setAttribute('aria-label',t.erase);
 confirmation.setAttribute('aria-describedby',warning.id);
 const cancel=add('button',t.cancel,confirmation);
 cancel.autofocus=true;
 const confirm=add('button',t.confirm,confirmation);
 const status=add('p','');
 status.setAttribute('role','status');
 let confirmationVersion;
 resetAccountData=()=>{
  if(confirmation.open)confirmation.close();
  status.textContent='';
  download.disabled=erase.disabled=false;
 };
 erase.addEventListener('click',()=>{confirmationVersion=identityVersion;confirmation.showModal();});
 cancel.addEventListener('click',()=>confirmation.close());

 async function run(deleting){
  if(download.disabled)return;
  const version=identityVersion;
  const active=()=>root.isConnected&&identityVersion===version;
  download.disabled=erase.disabled=true;
  status.textContent='';
  let token;
  try{token=await getInferenceToken();}
  catch{if(active())status.textContent=t.signIn;}
  try{
   if(!token||!active())return;
   if(deleting){
    const result=await documentRequest('/api/erase',{token,method:'DELETE'});
    if(result?.deleted!==true)throw Error('Deletion unconfirmed');
    if(identityVersion===version){
     document.dispatchEvent(new Event('bursyar:identity'));
     document.dispatchEvent(new CustomEvent('bursyar:profile',{detail:{}}));
    }
    if(root.isConnected&&identityVersion===version+1)status.textContent=t.deleted;
   }else{
    const data=await documentRequest('/api/export',{token});
    if(!active())return;
    const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
    const link=document.createElement('a');
    link.href=url;
    link.download='BursYar-profile-and-documents.json';
    link.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    status.textContent=t.downloaded;
   }
  }catch(error){
   if(active())status.textContent=error.code==='signInRequired'?t.signIn:deleting?t.uncertain:t.error;
  }finally{
   if(active())download.disabled=erase.disabled=false;
  }
 }
 download.addEventListener('click',()=>run(false));
 confirm.addEventListener('click',()=>{
  confirmation.close();
  if(confirmationVersion===identityVersion)run(true);
 });
}
