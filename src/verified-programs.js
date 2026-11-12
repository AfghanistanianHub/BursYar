// Curated public discovery facts, not a trusted eligibility rule set. Checked
// against the named official page; nationality and admission remain unresolved.
export const checkedPrograms=Object.freeze([Object.freeze({
 id:'eth-esop-2027',title:'ETH Zurich — Excellence Scholarship & Opportunity Programme (ESOP), HS27',
 sourceUrl:'https://ethz.ch/students/en/studies/financial/scholarships/excellencescholarship.html',
 sourceKind:'official_page_read',checkedAt:'2026-11-12T05:47:15Z',
 window:Object.freeze({opens:'2026-11-01',closes:'2026-11-30',timeZone:'Europe/Zurich',cutoffPublished:'11.59h MEZ'}),
 windowExcerpt:'Nov, 1 - Nov, 30 2026, 11.59h, MEZ',
 funding:'Study and living costs plus a tuition waiver; HS27 support is CHF 13,500 per semester for the regular master duration.',
 conditions:'Non-MAS master study only. Bachelor results in the top 10% (self-assessed, per ETH) are required. Applicants already in an ETH master or holding a master degree are excluded. A self-written thesis pre-proposal is required. Check the separate master admission conditions and nationality requirements.',
})]);
const validDate=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;
export function programWindow(row,now=new Date()){
 const checked=Date.parse(row?.checkedAt),time=now.getTime(),w=row?.window;
 let source;try{source=new URL(row.sourceUrl);}catch{return 'recheck';}
 if(row.sourceKind!=='official_page_read'||source.protocol!=='https:'||source.hostname!=='ethz.ch'||source.username||source.password||!Number.isFinite(time)||!Number.isFinite(checked)||time<checked||time-checked>7*86400000||!validDate(w?.opens)||!validDate(w?.closes)||w.opens>w.closes||w.timeZone!=='Europe/Zurich')return 'recheck';
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:w.timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
 const part=key=>parts.find(p=>p.type===key).value;const today=`${part('year')}-${part('month')}-${part('day')}`;
 return today<w.opens?'not_yet':today>w.closes?'past':today===w.closes?'confirm_cutoff':'reported_open';
}
// Localized interface copy remains pending fluent human review.
export const verifiedProgramCopy={
 en:{heading:'Recently checked official program',reported_open:'Within the published application window',recheck:'Recheck the official source',confirm_cutoff:'Closing day — confirm the exact cutoff with the provider',past:'Published window has ended',not_yet:'Published window has not started',note:'These are selected public facts, not a personal eligibility decision. Dates and conditions can change; confirm with the provider.',window:'Published dates',checked:'Source checked',details:'Funding and conditions (original English)',source:'Open official source',prepare:'Review this source'},
 fa:{heading:'برنامهٔ رسمی که اخیراً بررسی شده',reported_open:'در بازهٔ زمانی اعلام‌شده برای درخواست',recheck:'منبع رسمی را دوباره بررسی کنید',confirm_cutoff:'روز پایانی؛ ساعت دقیق را از ارائه‌دهنده تأیید کنید',past:'بازهٔ اعلام‌شده پایان یافته است',not_yet:'بازهٔ اعلام‌شده هنوز شروع نشده است',note:'این‌ها فقط اطلاعات عمومی منتخب‌اند و واجد شرایط بودن شما را تأیید نمی‌کنند. تاریخ‌ها و شرایط ممکن است تغییر کنند؛ از ارائه‌دهنده تأیید بگیرید.',window:'تاریخ‌های اعلام‌شده',checked:'زمان بررسی منبع',details:'حمایت مالی و شرایط (متن انگلیسی)',source:'باز کردن منبع رسمی',prepare:'بررسی این منبع'},
 ps:{heading:'تازه کتل شوی رسمي پروګرام',reported_open:'د غوښتنلیک د اعلان شوې مودې دننه',recheck:'رسمي سرچینه بیا وګورئ',confirm_cutoff:'وروستۍ ورځ؛ دقیق ساعت له ادارې تایید کړئ',past:'اعلان شوې موده پای ته رسېدلې',not_yet:'اعلان شوې موده لا نه ده پیل شوې',note:'دا یوازې ټاکل شوي عامه معلومات دي؛ ستاسو وړتوب نه تاییدوي. نېټې او شرایط بدلېدای شي؛ له ادارې یې تایید کړئ.',window:'اعلان شوې نېټې',checked:'د سرچینې د کتنې وخت',details:'مالي ملاتړ او شرایط (انګلیسي متن)',source:'رسمي سرچینه پرانیزئ',prepare:'دا سرچینه وګورئ'}
};
