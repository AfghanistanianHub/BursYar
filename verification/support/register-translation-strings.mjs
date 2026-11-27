import {readFileSync, writeFileSync} from 'node:fs';
const file = 'docs/TRANSLATION-REVIEW.json';
const review = JSON.parse(readFileSync(file, 'utf8'));
const entries = [
  {
    source: 'src/documents.js', key: 'readerTitle',
    en: 'Document reader',
    fa: 'خوانش سند',
    ps: 'د سند لوستنه',
    status: 'PENDING'
  },
  {
    source: 'src/verifications.js', key: 'providersEmpty',
    en: 'No issuing organisation is connected yet.',
    fa: 'هنوز سازمان صادرکننده‌ای متصل نشده است.',
    ps: 'تر اوسه کومه صادرونکې اداره نه ده نښلول شوې.',
    status: 'PENDING'
  },
  {
    source: 'src/verifications.js', key: 'unavailable',
    en: 'Verification details could not be loaded. Nothing was lost; try again in a moment.',
    fa: 'جزئیات تأیید بارگذاری نشد. چیزی از دست نرفت؛ لحظه‌ای بعد دوباره تلاش کنید.',
    ps: 'د تایید جزئیات ونه لوستل شول. هېڅ شی له لاسه نه دی ورک شوی؛ لږ وروسته بیا هڅه وکړئ.',
    status: 'PENDING'
  }
];
const seen = new Set(review.pendingStrings.map(item => item.source + '#' + item.key));
for (const entry of entries) if (!seen.has(entry.source + '#' + entry.key)) review.pendingStrings.push(entry);
writeFileSync(file, JSON.stringify(review, null, 2) + '\n');
console.log('pendingStrings:', review.pendingStrings.length);
