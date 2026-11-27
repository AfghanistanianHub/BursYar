// Localized sign-in feedback shared by the header account control and the
// analyzer. One mapping keeps every entry point explaining a Firebase outcome
// the same way, in all three languages, without leaking raw error text.
// fa/ps strings are UNREVIEWED pending fluent human review (see docs/TRANSLATION-REVIEW.json).
export const signInFeedback = {
 en: {
  dismissed: 'Sign-in was cancelled. You can try again when you’re ready.',
  blocked: 'Allow pop-ups for this site, then select “Sign in with Google” again.',
  browser: 'Open BursYar in a full browser window to sign in with Google.',
  host: 'Google sign-in is unavailable at this site address. You can still explore scholarships.',
  configuration: 'Google sign-in is unavailable for this version of BursYar. You can still explore scholarships.',
  retry: 'Google sign-in could not finish. Please try again.'
 },
 fa: {
  dismissed: 'ورود لغو شد. هر وقت آماده بودید، دوباره وارد شوید.',
  blocked: 'اجازه دهید این سایت پنجرهٔ جدید باز کند، سپس دوباره «ورود با گوگل» را انتخاب کنید.',
  browser: 'برای ورود با گوگل، بورس‌یار را در مرورگر دستگاه خود باز کنید.',
  host: 'ورود با گوگل در این نشانی فعال نیست. هنوز می‌توانید بورسیه‌ها را جست‌وجو کنید.',
  configuration: 'ورود با گوگل در این نسخهٔ بورس‌یار در دسترس نیست. هنوز می‌توانید بورسیه‌ها را جست‌وجو کنید.',
  retry: 'ورود با گوگل کامل نشد. لطفاً دوباره تلاش کنید.'
 },
 ps: {
  dismissed: 'ننوتل لغوه شول. کله چې چمتو یاست، بیا هڅه وکړئ.',
  blocked: 'دې وېب‌پاڼې ته د نوې کړکۍ د پرانیستلو اجازه ورکړئ، بیا د ګوګل له لارې د ننوتلو تڼۍ وټاکئ.',
  browser: 'د ګوګل له لارې د ننوتلو لپاره بورس‌یار د خپلې وسیلې په براوزر کې پرانیزئ.',
  host: 'د ګوګل له لارې ننوتل په دې پته فعال نه دي. تاسو لا هم بورسونه لټولی شئ.',
  configuration: 'د بورس‌یار په دې نسخه کې د ګوګل له لارې ننوتل ممکن نه دي. تاسو لا هم بورسونه لټولی شئ.',
  retry: 'د ګوګل له لارې ننوتل بشپړ نه شول. مهرباني وکړئ بیا هڅه وکړئ.'
 }
};

export function signInFailureMessage(error, language) {
 const copy = signInFeedback[language] ?? signInFeedback.en;
 switch (error?.code) {
  case 'auth/popup-closed-by-user':
  case 'auth/cancelled-popup-request': return copy.dismissed;
  case 'auth/popup-blocked': return copy.blocked;
  case 'auth/operation-not-supported-in-this-environment': return copy.browser;
  case 'auth/unauthorized-domain': return copy.host;
  case 'auth/operation-not-allowed':
  case 'auth/auth-domain-config-required':
  case 'auth/invalid-api-key':
  case 'auth/configuration-not-found': return copy.configuration;
  default: return error?.message === 'Firebase sign-in is not configured' ? copy.configuration : copy.retry;
 }
}
