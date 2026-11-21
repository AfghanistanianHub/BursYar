import {documentRequest} from './document-request.js';
import {getInferenceToken} from './auth.js';
// fa/ps strings are UNREVIEWED pending fluent human review (docs/TRANSLATION-REVIEW.json).
// A request is never a verification: only the issuing organisation can confirm a
// credential, and this UI never shows a verified result it did not receive.
export const verificationCopy = {
 en: {
  title: 'Credential verification',
  intro: 'Ask the organisation that issued your certificate to confirm your result. BursYar records your request and its outcome; it never decides authenticity itself.',
  notice: 'Uploading a document, reading its text or matching an issuer name on a public page never proves a credential is genuine. Only the issuing organisation can confirm it.',
  requestTitle: 'Request a verification',
  documentLabel: 'Which document is this about?',
  providerLabel: 'Issuing organisation',
  referenceLabel: 'Certificate or reference number (optional)',
  referenceHint: 'Only if the issuer needs it. It is stored with this request so you do not have to enter it again.',
  consent: 'I consent to BursYar storing this request, the reference number and the issuer’s decision in my account.',
  consentRequired: 'Tick the consent box before recording a verification request.',
  statusLegend: 'What each status means',
  submit: 'Record verification request',
  submitting: 'Recording request…',
  documentsEmpty: 'No documents saved yet. Add and review a document first.',
  requestsTitle: 'Your verification requests',
  refresh: 'Refresh requests',
  empty: 'No verification requests yet.',
  withdraw: 'Withdraw',
  withdrawn: 'Request withdrawn.',
  uncertain: 'The response was lost. Your request may have been recorded. Refresh the list before trying again.',
  verifiedLocked: 'A result confirmed by the issuer cannot be withdrawn.',
  requested: 'Requested',
  confirmedOn: 'Confirmed on',
  autoNote: 'This release has no authorized direct connection to issuer systems, so every request stays pending until the issuer answers.',
  official: 'Open the issuer’s official verification page',
  loading: 'Loading verification details…',
  refreshing: 'Refreshing verification requests…',
  error: 'Verification details are unavailable. Sign in and try again.',
  signIn: 'Sign in to request credential verification.',
  access: {
   institution_account: 'Only the issuing organisation can confirm this. BursYar has no authorized access yet, so you must complete it with them.',
   public_lookup: 'The issuer publishes a lookup page you can use yourself.',
   qr_app: 'The issuer checks this certificate with a QR code in its own app.',
   issuer_contact: 'The issuer confirms on request; contact them or your examination centre.',
   signed_document: 'The issuer sends a digitally signed document to the verifying organisation.'
  },
  statuses: {
   NOT_REQUESTED: 'Not requested',
   PENDING: 'Request recorded — awaiting the issuer’s response',
   VERIFIED_BY_ISSUER: 'Confirmed by the issuing organisation',
   REJECTED_BY_ISSUER: 'Rejected by the issuing organisation',
   MANUAL_REVIEW_REQUIRED: 'Needs manual review',
   UNAVAILABLE: 'Verification unavailable'
  }
 },
 fa: {
  title: 'تأیید اصالت مدارک',
  intro: 'از سازمانی که مدرک شما را صادر کرده بخواهید نتیجه را تأیید کند. بورس‌یار درخواست و پاسخ را ثبت می‌کند و خودش دربارهٔ اصالت تصمیم نمی‌گیرد.',
  notice: 'بارگذاری مدرک، خواندن متن آن یا یافتن نام صادرکننده در یک صفحهٔ عمومی هرگز اصالت مدرک را ثابت نمی‌کند. فقط سازمان صادرکننده می‌تواند آن را تأیید کند.',
  requestTitle: 'درخواست تأیید',
  documentLabel: 'این درخواست دربارهٔ کدام مدرک است؟',
  providerLabel: 'سازمان صادرکننده',
  referenceLabel: 'شمارهٔ مدرک یا مرجع (اختیاری)',
  referenceHint: 'فقط اگر فرایند تأیید صادرکننده به آن نیاز دارد. همراه درخواست ذخیره می‌شود تا دوباره وارد نکنید.',
  consent: 'موافقم که بورس‌یار این درخواست، شمارهٔ مرجع و پاسخ صادرکننده را در حساب من ذخیره کند.',
  consentRequired: 'پیش از ثبت درخواست تأیید، کادر رضایت را علامت بزنید.',
  statusLegend: 'معنی هر وضعیت',
  submit: 'ثبت درخواست تأیید',
  submitting: 'در حال ثبت درخواست…',
  documentsEmpty: 'هنوز مدرکی ذخیره نشده است. ابتدا یک مدرک اضافه و بازبینی کنید.',
  requestsTitle: 'درخواست‌های تأیید شما',
  refresh: 'تازه‌سازی درخواست‌ها',
  empty: 'هنوز درخواست تأییدی ثبت نشده است.',
  withdraw: 'انصراف از درخواست',
  withdrawn: 'درخواست لغو شد.',
  uncertain: 'پاسخ سرور دریافت نشد؛ ممکن است درخواست ثبت شده باشد. پیش از تلاش دوباره، فهرست را تازه کنید.',
  verifiedLocked: 'نتیجهٔ تأییدشده توسط صادرکننده قابل لغو نیست.',
  requested: 'تاریخ درخواست',
  confirmedOn: 'تاریخ تأیید',
  autoNote: 'در این نسخه هیچ اتصال مجاز مستقیمی به سامانه‌های صادرکننده وجود ندارد؛ بنابراین هر درخواست تا پاسخ صادرکننده در حالت انتظار می‌ماند.',
  official: 'باز کردن صفحهٔ رسمی تأیید صادرکننده',
  loading: 'در حال بارگذاری جزئیات تأیید…',
  refreshing: 'در حال تازه‌سازی درخواست‌های تأیید…',
  error: 'جزئیات تأیید در دسترس نیست. وارد حساب شوید و دوباره تلاش کنید.',
  signIn: 'برای درخواست تأیید مدرک وارد حساب شوید.',
  access: {
   institution_account: 'فقط سازمان صادرکننده می‌تواند این را تأیید کند. بورس‌یار هنوز دسترسی مجاز ندارد؛ باید خودتان با آن‌ها پیگیری کنید.',
   public_lookup: 'صادرکننده صفحهٔ بررسی عمومی دارد که می‌توانید خودتان از آن استفاده کنید.',
   qr_app: 'صادرکننده این مدرک را با کد QR در برنامهٔ خود بررسی می‌کند.',
   issuer_contact: 'صادرکننده به درخواست پاسخ می‌دهد؛ با آن‌ها یا مرکز آزمون تماس بگیرید.',
   signed_document: 'صادرکننده سند دیجیتال امضاشده را برای سازمان تأییدکننده ارسال می‌کند.'
  },
  statuses: {
   NOT_REQUESTED: 'درخواست نشده',
   PENDING: 'درخواست ثبت شد؛ در انتظار پاسخ صادرکننده',
   VERIFIED_BY_ISSUER: 'تأییدشده توسط سازمان صادرکننده',
   REJECTED_BY_ISSUER: 'ردشده توسط سازمان صادرکننده',
   MANUAL_REVIEW_REQUIRED: 'نیازمند بررسی دستی',
   UNAVAILABLE: 'تأیید در دسترس نیست'
  }
 },
 ps: {
  title: 'د سند اصالت تایید',
  intro: 'له هغې ادارې وغواړئ چې ستاسو سند یې صادر کړی، ستاسو پایله تایید کړي. بورس‌یار غوښتنه او ځواب ثبتوي او پخپله د اصالت په اړه پریکړه نه کوي.',
  notice: 'د سند پورته کول، د هغه متن لوستل یا په عامه پاڼه کې د صادرونکي نوم موندل هېڅکله د سند اصالت نه ثابتوي. یوازې صادرونکې اداره یې تاییدولی شي.',
  requestTitle: 'د تایید غوښتنه',
  documentLabel: 'دا غوښتنه د کوم سند په اړه ده؟',
  providerLabel: 'صادرونکې اداره',
  referenceLabel: 'د سند یا مرجع شمېره (اختیاري)',
  referenceHint: 'یوازې که د صادرونکي تایید بهیر ورته اړتیا ولري. له غوښتنې سره ساتل کېږي تر څو بیا یې ولیکئ.',
  consent: 'منم چې بورس‌یار دا غوښتنه، مرجع شمېره او د صادرونکي ځواب زما په حساب کې وساتي.',
  consentRequired: 'د تایید غوښتنې ثبتولو مخکې د رضایت چوکاټ وټاکئ.',
  statusLegend: 'د هر حالت مانا',
  submit: 'د تایید غوښتنه ثبت کړئ',
  submitting: 'غوښتنه ثبتېږي…',
  documentsEmpty: 'تر اوسه کوم سند نه دی ساتل شوی. لومړی سند زیات او بیاکتنه یې کړئ.',
  requestsTitle: 'ستاسو د تایید غوښتنې',
  refresh: 'غوښتنې تازه کړئ',
  empty: 'تر اوسه د تایید غوښتنه نشته.',
  withdraw: 'غوښتنه پرېږدئ',
  withdrawn: 'غوښتنه لغوه شوه.',
  uncertain: 'د سرور ځواب ترلاسه نه شو؛ ښايي غوښتنه ثبت شوې وي. تر بیا هڅې مخکې لړ تازه کړئ.',
  verifiedLocked: 'د صادرونکي تاییدشوی پایله لغوه کېدلی نشي.',
  requested: 'د غوښتنې نېټه',
  confirmedOn: 'د تایید نېټه',
  autoNote: 'په دې نسخه کې د صادرونکو سامانه‌و ته هېڅ مجاز مستقیم اړیکه نشته؛ نو هر ه غوښتنه تر ځواب پورې په تمه پاتې کېږي.',
  official: 'د صادرونکي رسمي تایید پاڼه پرانیزئ',
  loading: 'د تایید جزئیات راځي…',
  refreshing: 'د تایید غوښتنې تازه کېږي…',
  error: 'د تایید جزئیات نه دي لاسرسی وړ. ننوځئ او بیا هڅه وکړئ.',
  signIn: 'د سند د تایید غوښتنې لپاره ننوځئ.',
  access: {
   institution_account: 'یوازې صادرونکې اداره دا تاییدولی شي. بورس‌یار لا مجاز لاسرسی نه لري؛ باید پخپله ورسره تعقیب وکړئ.',
   public_lookup: 'صادرونکي عامه کتنپاڼه لري چې پخپله یې کارولی شئ.',
   qr_app: 'صادرونکی دا سند په خپل اپ کې د QR کوډ په مرسته کتنه کوي.',
   issuer_contact: 'صادرونکی پر غوښتنه ځواب وایي؛ ورسره یا له ازموینې مرکز سره اړیکه ونیسئ.',
   signed_document: 'صادرونکی تاییدوونکې ادارې ته ډیجیټل لاسلیک شوی سند لېږي.'
  },
  statuses: {
   NOT_REQUESTED: 'نه ده غوښتل شوې',
   PENDING: 'غوښتنه ثبت شوه؛ د صادرونکي ځواب ته په تمه',
   VERIFIED_BY_ISSUER: 'د صادرونکې ادارې لخوا تایید شوی',
   REJECTED_BY_ISSUER: 'د صادرونکې ادارې لخوا رد شوی',
   MANUAL_REVIEW_REQUIRED: 'لاسي بیاکتنې ته اړتیا لري',
   UNAVAILABLE: 'تایید نه دی لاسرسی وړ'
  }
 }
};
export const verificationStatuses = ['NOT_REQUESTED', 'PENDING', 'VERIFIED_BY_ISSUER', 'REJECTED_BY_ISSUER', 'MANUAL_REVIEW_REQUIRED', 'UNAVAILABLE'];
const localeFor = language => language === 'fa' ? 'fa-AF' : language === 'ps' ? 'ps-AF' : 'en';

export async function mountVerifications(root, language = 'en') {
 if (!root) return;
 const t = verificationCopy[language] ?? verificationCopy.en;
 const locale = localeFor(language);
 const date = new Intl.DateTimeFormat(locale, {dateStyle: 'medium'});
 const safeDate = value => { const parsed = new Date(value); return Number.isFinite(parsed.getTime()) ? date.format(parsed) : '—'; };
 const safeOfficialUrl = value => {
  if (typeof value !== 'string') return null;
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : null; }
  catch { return null; }
 };
 root.replaceChildren();
 const section = document.createElement('section');
 section.className = 'section verification-center';
 root.append(section);
 const element = (tag, text, parent = section) => { const node = document.createElement(tag); if (text) node.textContent = text; parent.append(node); return node; };
 element('h2', t.title);
 element('p', t.intro);
 const notice = element('p', t.notice, element('aside'));
 notice.className = 'verification-notice';
 const formSection = element('section');
 formSection.className = 'verification-request';
 element('h3', t.requestTitle, formSection);
 const form = element('form', '', formSection);
 let documents = [], providers = [], inFlight = false;
 const field = (labelText, control, parent = form) => { const label = element('label', labelText, parent); label.append(control); return label; };
 const documentSelect = document.createElement('select');
 documentSelect.required = true;
 const documentField = field(t.documentLabel, documentSelect);
 const providerSelect = document.createElement('select');
 providerSelect.required = true;
 const providerField = field(t.providerLabel, providerSelect);
 const reference = document.createElement('input');
 reference.type = 'text';
 reference.maxLength = 120;
 reference.autocomplete = 'off';
 reference.dir = 'auto';
 const referenceField = field(t.referenceLabel, reference);
 element('p', t.referenceHint, referenceField).className = 'verification-hint';
 const providerNote = element('p', '', formSection);
 providerNote.className = 'verification-provider-note';
 providerNote.setAttribute('role', 'note');
 const accessText = document.createElement('span');
 providerNote.append(accessText);
 const official = document.createElement('a');
 official.target = '_blank';
 official.rel = 'noopener noreferrer';
 official.textContent = t.official;
 official.className = 'verification-official';
 official.hidden = true;
 providerNote.append(official);
 const consentLabel = element('label', '', form);
 const consent = document.createElement('input');
 consent.type = 'checkbox';
 consentLabel.prepend(consent);
 consentLabel.append(t.consent);
 const submit = element('button', t.submit, form);
 submit.type = 'submit';
 submit.disabled = true; // Remain unavailable until both issuer and document lists load.
 element('p', t.autoNote, formSection).className = 'verification-auto-note';
 const status = element('p', t.loading);
 status.setAttribute('role', 'status');
 const listSection = element('section');
 listSection.className = 'verification-list';
 element('h3', t.requestsTitle, listSection);
 const refresh = element('button', t.refresh, listSection);
 refresh.type = 'button';
 const list = element('ul', '', listSection);
 list.className = 'verification-requests';
 const legend = element('details', '', listSection);
 legend.className = 'verification-legend';
 element('summary', t.statusLegend, legend);
 for (const key of verificationStatuses) element('p', t.statuses[key], legend).dataset.status = key;

 function paintProvider() {
  const selected = providers.find(provider => provider.id === providerSelect.value);
  if (!selected) { official.hidden = true; accessText.textContent = ''; reference.placeholder = ''; submit.disabled = true; return; }
  const officialUrl = safeOfficialUrl(selected.officialUrl);
  official.hidden = !officialUrl;
  if (officialUrl) official.href = officialUrl;
  else official.removeAttribute('href');
  accessText.textContent = `${t.access[selected.access] ?? ''} `;
  reference.placeholder = selected.referenceLabel ?? '';
  submit.disabled = inFlight || !documents.length || !providers.length || !documentSelect.value;
  referenceField.hidden = false;
 }
 async function api(path, method = 'GET', body) {
  const token = await getInferenceToken();
  return documentRequest(path, {token, method, body});
 }
 function renderRequests(requests) {
  list.replaceChildren();
  if (!requests.length) { element('li', t.empty, list); return; }
  for (const request of requests) {
   const item = element('li', '', list);
   item.dataset.status = request.status;
   const heading = element('p', `${request.provider?.name ?? '—'} · ${request.provider?.issuer ?? '—'}`, item);
   heading.className = 'verification-provider';
   heading.dir = 'auto';
   const badge = element('span', t.statuses[request.status] ?? request.status, item);
   badge.className = 'verification-status';
   const meta = element('p', `${t.requested}: ${safeDate(request.createdAt)}`, item);
   meta.className = 'verification-meta';
   if (request.reference) {
    const ref = element('p', `${request.reference}`, item);
    ref.className = 'verification-reference';
    ref.dir = 'ltr';
   }
   if (request.issuerEvidence?.decidedAt) {
    const decided = element('p', `${t.confirmedOn}: ${safeDate(request.issuerEvidence.decidedAt)}`, item);
    decided.className = 'verification-meta';
    if (request.issuerEvidence.statement) element('blockquote', request.issuerEvidence.statement, item).dir = 'auto';
   }
   if (['PENDING', 'MANUAL_REVIEW_REQUIRED', 'UNAVAILABLE', 'REJECTED_BY_ISSUER'].includes(request.status)) {
    const withdraw = element('button', t.withdraw, item);
    withdraw.type = 'button';
    withdraw.addEventListener('click', () => busy(async () => {
     await api(`/api/verifications/${encodeURIComponent(request.id)}`, 'DELETE');
     status.textContent = t.withdrawn;
     await loadRequests();
     refresh.focus({preventScroll:true});
    }));
   }
  }
 }
 async function loadRequests() {
  const data = await api('/api/verifications');
  if (!Array.isArray(data?.requests)) throw new Error('Invalid verification response');
  renderRequests(data.requests);
 }
 async function loadProviders() {
  const data = await api('/api/verifications/providers');
  if (!Array.isArray(data?.providers)) throw new Error('Invalid provider response');
  providers = data.providers;
  providerSelect.replaceChildren();
  for (const provider of providers) {
   const option = document.createElement('option');
   option.value = provider.id;
   option.textContent = `${provider.name} — ${provider.issuer}`;
   providerSelect.append(option);
  }
  paintProvider();
 }
 async function loadDocuments() {
  const result = await api('/api/documents');
  if (!Array.isArray(result)) throw new Error('Invalid document response');
  documents = result;
  documentSelect.replaceChildren();
  if (!documents.length) {
   const option = document.createElement('option');
   option.value = '';
   option.textContent = t.documentsEmpty;
   documentSelect.append(option);
   submit.disabled = true;
   documentField.hidden = false;
   return;
  }
  const format = new Intl.DateTimeFormat(locale, {dateStyle: 'medium', timeStyle: 'short'});
  documents.forEach((item, index) => {
   const option = document.createElement('option');
   option.value = item.id;
   const uploaded = new Date(item.uploadedAt);
   option.textContent = `${index + 1} · ${Number.isFinite(uploaded.getTime()) ? format.format(uploaded) : '—'}`;
   documentSelect.append(option);
  });
  submit.disabled = !providers.length || !documentSelect.value || !providerSelect.value;
 }
 async function busy(action) {
  if (inFlight) return;
  inFlight = true;
  section.setAttribute('aria-busy', 'true');
  for (const button of section.querySelectorAll('button')) button.disabled = true;
  try { await action(); }
  catch (error) { status.textContent = error.code === 'mutationUncertain' ? t.uncertain : (t[error.code] ?? t.error); }
  finally {
   inFlight = false;
   section.removeAttribute('aria-busy');
   for (const button of section.querySelectorAll('button')) button.disabled = false;
   submit.disabled = !documents.length || !providers.length || !documentSelect.value || !providerSelect.value;
  }
 }
 providerSelect.addEventListener('change', paintProvider);
 documentSelect.addEventListener('change', () => { submit.disabled = inFlight || !documentSelect.value || !providerSelect.value; });
 consent.addEventListener('change', () => {
  if (!consent.checked) return;
  consent.removeAttribute('aria-invalid');
  if (status.textContent === t.consentRequired) status.textContent = '';
 });
 form.addEventListener('submit', event => {
  event.preventDefault();
  busy(async () => {
   if (!documentSelect.value || !providerSelect.value) { status.textContent = t.error; return; }
   if (!consent.checked) {
    consent.setAttribute('aria-invalid', 'true');
    status.textContent = t.consentRequired;
    consent.focus();
    return;
   }
   consent.removeAttribute('aria-invalid');
   await api('/api/verifications', 'POST', {
    documentId: documentSelect.value,
    providerId: providerSelect.value,
    consent: true,
    reference: reference.value
   });
   reference.value = '';
   consent.checked = false;
   status.textContent = t.statuses.PENDING;
   await loadRequests();
  });
 });
 async function reloadAll() {
  // A failed initial load may leave provider/document selectors empty; refreshing
  // requests alone cannot recover the form after the network returns.
  status.textContent = t.refreshing;
  const previousProvider = providerSelect.value;
  const previousDocument = documentSelect.value;
  await loadProviders();
  if (previousProvider && providers.some(item => item.id === previousProvider)) providerSelect.value = previousProvider;
  paintProvider();
  await loadDocuments();
  if (previousDocument && documents.some(item => item.id === previousDocument)) documentSelect.value = previousDocument;
  submit.disabled = !documents.length || !providers.length || !documentSelect.value || !providerSelect.value;
  await loadRequests();
  status.textContent = '';
 }
 refresh.addEventListener('click', () => busy(reloadAll));
 try { await reloadAll(); }
 catch { status.textContent = t.error; }
 return {refresh: loadRequests};
}
