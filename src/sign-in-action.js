import {signIn} from './auth.js';
// A visible, in-place sign-in recovery action for panels whose data is private.
// The panel is responsible for remounting after 'bursyar:identity'; this control
// never renders or stores any account detail.
export const signInActionCopy={
 en:{action:'Sign in to continue',busy:'Opening sign-in…',failed:'Sign-in unavailable. Check the account configuration, then try again.',note:'This section is private to your account. You can keep browsing and assessing without signing in.'},
 fa:{action:'برای ادامه وارد شوید',busy:'در حال باز کردن ورود…',failed:'ورود ممکن نیست. تنظیمات حساب را بررسی و دوباره تلاش کنید.',note:'این بخش خصوصی و مربوط به حساب شماست. می‌توانید بدون ورود به مرور و ارزیابی ادامه دهید.'},
 ps:{action:'د دوام لپاره ننوځئ',busy:'ننوتل پرانیستل کېږي…',failed:'ننوتل ممکن نه دي. د حساب تنظیمات وګورئ او بیا هڅه وکړئ.',note:'دا برخه ستاسو حساب ته ځانګړې ده. پرته له ننوتلو هم کولای شئ وګورئ او ارزونه وکړئ.'}
};
export function mountSignInAction(language='en'){
 const t=signInActionCopy[language]??signInActionCopy.en;
 const wrap=document.createElement('div');wrap.className='sign-in-action';
 const note=document.createElement('p');note.textContent=t.note;
 const button=document.createElement('button');button.type='button';button.className='primary-link';button.textContent=t.action;
 const status=document.createElement('p');status.setAttribute('role','status');
 button.addEventListener('click',async()=>{
  button.disabled=true;status.textContent=t.busy;
  try{await signIn();document.dispatchEvent(new Event('bursyar:identity'));}
  catch{status.textContent=t.failed;}
  finally{button.disabled=false;}
 });
 wrap.append(note,button,status);
 return wrap;
}
