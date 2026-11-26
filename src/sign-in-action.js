import {signIn,setKeepSignedIn,keepSignedIn,getAccountCapability} from './auth.js';
// A visible, in-place sign-in recovery action for panels whose data is private.
// The panel is responsible for remounting after 'bursyar:identity'; this control
// never renders or stores any account detail.
// fa/ps strings are UNREVIEWED pending fluent human review (see docs/TRANSLATION-REVIEW.json).
export const signInActionCopy={
 en:{action:'Sign in to continue',busy:'Opening sign-in…',failed:'Sign-in unavailable. Check the account configuration, then try again.',note:'This section is private to your account. You can keep browsing and assessing without signing in.',keepSignedIn:'Keep me signed in on this device',keepSignedInNote:'Only tick this on a device you control. It stores a refresh token in this browser until you sign out.',popupClosed:'Sign-in was cancelled. Try again when you are ready.',closedPilot:'This is an invitation-only pilot',notEnrolled:'This Google account is valid, but it has not been enrolled for private storage yet. Ask the person who invited you to enrol this exact address, then press “Check again”.',checkAgain:'Check again',requestAccess:'Request access',enrolled:'Signed in and enrolled.',checking:'Checking this account…'},
 fa:{action:'برای ادامه وارد شوید',busy:'در حال باز کردن ورود…',failed:'ورود ممکن نیست. تنظیمات حساب را بررسی و دوباره تلاش کنید.',note:'این بخش خصوصی و مربوط به حساب شماست. می‌توانید بدون ورود به مرور و ارزیابی ادامه دهید.',keepSignedIn:'مرا در این دستگاه وارد نگه دار',keepSignedInNote:'این گزینه را فقط در دستگاهی که کنترل می‌کنید انتخاب کنید. تا خروج، نشانهٔ تازه‌سازی در این مرورگر ذخیره می‌شود.',popupClosed:'ورود لغو شد. هر زمان آماده بودید دوباره تلاش کنید.',closedPilot:'این برنامهٔ آزمایشی فقط با دعوت است',notEnrolled:'این حساب گوگل معتبر است، اما هنوز برای ذخیرهٔ خصوصی مجاز نشده است. از کسی که شما را دعوت کرده بخواهید همین نشانی را مجاز کند و سپس «بررسی دوباره» را بزنید.',checkAgain:'بررسی دوباره',requestAccess:'درخواست دسترسی',enrolled:'وارد شدید و حساب مجاز است.',checking:'در حال بررسی این حساب…'},
 ps:{action:'د دوام لپاره ننوځئ',busy:'ننوتل پرانیستل کېږي…',failed:'ننوتل ممکن نه دي. د حساب تنظیمات وګورئ او بیا هڅه وکړئ.',note:'دا برخه ستاسو حساب ته ځانګړې ده. پرته له ننوتلو هم کولای شئ وګورئ او ارزونه وکړئ.',keepSignedIn:'په دې وسیله ننوتلی وساتئ',keepSignedInNote:'دا یوازې په هغه وسیله وټاکئ چې کنټرول یې لرئ. تر وتلو پورې په دې براوزر کې د تازه کولو ټوکن ساتل کېږي.',popupClosed:'ننوتل لغوه شول. کله چې چمتو یاست بیا هڅه وکړئ.',closedPilot:'دا یوازې د بلنې له مخې ازموینه ده',notEnrolled:'دا ګوګل حساب سم دی، خو لا د شخصي ساتنې لپاره نه دی منل شوی. له هغه چا وغواړئ چې تاسو یې بللي دي همدا پته ومني، بیا «بیا کتنه» وټاکئ.',checkAgain:'بیا کتنه',requestAccess:'د لاسرسي غوښتنه',enrolled:'ننوتل شول او حساب منل شوی دی.',checking:'دا حساب کتنل کېږي…'}
};
// Optional owner-configurable request path (for example a short form URL).
function accessRequestUrl(){
 const value=import.meta.env.VITE_ACCESS_REQUEST_URL;
 try{const url=new URL(value);return url.protocol==='https:'?url.href:null;}catch{return null;}
}
export function mountSignInAction(language='en'){
 const t=signInActionCopy[language]??signInActionCopy.en;
 const wrap=document.createElement('div');wrap.className='sign-in-action';
 const note=document.createElement('p');note.textContent=t.note;
 const keepLabel=document.createElement('label');keepLabel.className='sign-in-keep';
 const keep=document.createElement('input');keep.type='checkbox';keep.checked=keepSignedIn();
 const keepText=document.createElement('span');keepText.textContent=t.keepSignedIn;
 const keepHint=document.createElement('small');keepHint.textContent=t.keepSignedInNote;
 keepLabel.append(keep,keepText,keepHint);
 const button=document.createElement('button');button.type='button';button.className='primary-link';button.dataset.action='sign-in';button.textContent=t.action;
 const status=document.createElement('p');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const enrolment=document.createElement('div');enrolment.className='sign-in-enrolment';enrolment.hidden=true;
 const enrolmentTitle=document.createElement('strong');enrolmentTitle.textContent=t.closedPilot;
 const enrolmentText=document.createElement('p');enrolmentText.textContent=t.notEnrolled;
 const actions=document.createElement('div');actions.className='secondary-actions';
 const again=document.createElement('button');again.type='button';again.className='primary-link secondary';again.dataset.action='check-enrolment';again.textContent=t.checkAgain;
 const request=document.createElement('a');request.className='text-button';request.textContent=t.requestAccess;
 const requestUrl=accessRequestUrl();
 if(requestUrl){request.href=requestUrl;request.target='_blank';request.rel='noopener noreferrer';}else request.hidden=true;
 actions.append(again,request);
 enrolment.append(enrolmentTitle,enrolmentText,actions);
 wrap.append(note,keepLabel,button,status,enrolment);
 async function verify(){
  status.textContent=t.checking;
  const capability=await getAccountCapability();
  if(capability.enrolled){
   enrolment.hidden=true;button.hidden=true;status.textContent=t.enrolled;
   document.dispatchEvent(new Event('bursyar:identity'));
  }else{
   enrolment.hidden=false;status.textContent='';
  }
 }
 again.addEventListener('click',()=>{again.disabled=true;verify().catch(()=>{status.textContent=t.failed;}).finally(()=>{again.disabled=false;});});
 button.addEventListener('click',async()=>{
  button.disabled=true;status.textContent=t.busy;
  try{
   setKeepSignedIn(keep.checked);
   const mode=await signIn();
   // A redirect leaves the page; state is restored on return.
   if(mode==='redirect')return;
   await verify();
  }catch(error){
   status.textContent=error?.code==='auth/popup-closed-by-user'||error?.code==='auth/cancelled-popup-request'?t.popupClosed:t.failed;
  }finally{button.disabled=false;}
 });
 return wrap;
}
