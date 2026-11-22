// BY-17: the shell needs the localized workspace copy for its aria-label, but
// not the interactive workspace or the assessment engine. Kept in its own tiny
// module so the entry chunk does not pull in analysis-workspace.js.
// fa/ps strings are UNREVIEWED pending fluent human review (see docs/TRANSLATION-REVIEW.json).
export const analysisWorkspaceCopy={
 en:{title:'Analysis workspace',intro:'Follow one scholarship from its official source to your next step. Select any requirement to trace its evidence.',synthetic:'SYNTHETIC DEMONSTRATION — fictional source, documents, and profile. No real data.',
  stages:['Source','Requirements','Evidence','Reasoning','Next steps'],
  sourceTitle:'Official source',retrieved:'Retrieved for review',digest:'Source digest (SHA-256)',openSource:'Open source',
  reqTitle:'Requirements',reqHint:'Select a requirement to trace it across the workspace.',
  evTitle:'Your evidence',docTranscript:'Transcript excerpt',docIelts:'IELTS result',confirm:'Confirm',flag:'Flag',flagged:'Flagged — excluded from reasoning',confirmedNote:'Reviewed — counts toward reasoning',
  reasonTitle:'Eligibility reasoning',decided:'requirements decided',summary:{met:'Listed requirements met (not verified)',not_met:'One requirement is not met',unknown:'Cannot determine yet'},
  words:{met:'Met',not_met:'Not met',unknown:'Unknown'},
  reasons:{degree_comparison:'Bachelor degree meets the stated minimum.',test_thresholds_met:'Overall 7.0 with every band at 6.5+ meets 6.5 / 6.0.',gpa_comparison:'GPA 3.2 is below the stated 3.5 minimum.',missing_exclusion_evidence:'No reviewed statement about continuing enrolment — unknown, not eligible.',exclusion_not_reported:'No continuing enrolment reported.',fallback:'Compared the stated rule against reviewed profile facts.'},
  factOrigin:{document_extracted:'document evidence',user_declared:'your declaration'},
  nextTitle:'PathFinder — next steps',reset:'Reset demo',quotedIn:'Quoted in source'},
 fa:{title:'فضای کاری تحلیل',intro:'یک بورسیه را از منبع رسمی تا گام بعدی دنبال کنید. هر شرط را انتخاب کنید تا شواهد آن مشخص شود.',synthetic:'نمایش فرضی — منبع، اسناد و پروفایل کاملاً ساختگی‌اند. دادهٔ واقعی نیست.',
  stages:['منبع','شرایط','شواهد','استدلال','گام‌های بعدی'],
  sourceTitle:'منبع رسمی',retrieved:'بازیابی‌شده برای بررسی',digest:'اثر منبع (SHA-256)',openSource:'باز کردن منبع',
  reqTitle:'شرایط',reqHint:'یک شرط را انتخاب کنید تا مسیر آن در فضای کاری مشخص شود.',
  evTitle:'شواهد شما',docTranscript:'گزیدهٔ کارنامه',docIelts:'نتیجهٔ آیلتس',confirm:'تأیید',flag:'علامت‌گذاری',flagged:'علامت‌گذاری شد — از استدلال حذف شد',confirmedNote:'بررسی شد — در استدلال لحاظ می‌شود',
  reasonTitle:'استدلال واجد شرایط بودن',decided:'شرایط تعیین‌تکلیف‌شده',summary:{met:'شروط نمونه برآورده شده‌اند (تأیید نشده)',not_met:'یک شرط برآورده نشده است',unknown:'هنوز مشخص نیست'},
  words:{met:'برآورده شد',not_met:'برآورده نشد',unknown:'نامشخص'},
  reasons:{degree_comparison:'مدرک لیسانس، حداقل اعلام‌شده را برآورده می‌کند.',test_thresholds_met:'نمرهٔ ۷ با همهٔ مهارت‌ها بالای ۶٫۵، حد ۶٫۵ / ۶ را برآورده می‌کند.',gpa_comparison:'معدل ۳٫۲ از حداقل ۳٫۵ کمتر است.',missing_exclusion_evidence:'اظهار بررسی‌شده‌ای دربارهٔ ادامهٔ تحصیل نیست — نامشخص است، نه واجد شرایط.',exclusion_not_reported:'ادامهٔ تحصیلی گزارش نشده است.',fallback:'شرط اعلام‌شده با حقایق بررسی‌شدهٔ پروفایل مقایسه شد.'},
  factOrigin:{document_extracted:'سند',user_declared:'اظهار شما'},
  nextTitle:'راه‌یاب — گام‌های بعدی',reset:'شروع مجدد نمایش',quotedIn:'نقل‌شده در منبع'},
 ps:{title:'د تحلیل کاري ځای',intro:'یو بورس له رسمي سرچینې تر بل ګام پورې تعقیب کړئ. هر شرط وټاکئ چې شواهد یې روښانه شي.',synthetic:'فرضي ننداره — سرچینه، اسناد او پروفایل ټول جوړ شوي دي. رښتیني معلومات نه دي.',
  stages:['سرچینه','شرایط','شواهد','استدلال','بل ګامونه'],
  sourceTitle:'رسمي سرچینه',retrieved:'د کتنې لپاره راوړل شوې',digest:'د سرچینې نښه (SHA-256)',openSource:'سرچینه پرانیزئ',
  reqTitle:'شرایط',reqHint:'یو شرط وټاکئ چې په کاري ځای کې یې لاره روښانه شي.',
  evTitle:'ستاسې شواهد',docTranscript:'د نمرو لنډیز',docIelts:'د IELTS پایله',confirm:'تایید',flag:'په نښه کول',flagged:'په نښه شو — له استدلال وویستل شو',confirmedNote:'وکتل شو — په استدلال کې شمېرل کېږي',
  reasonTitle:'د وړتوب استدلال',decided:'ټاکل شوي شرایط',summary:{met:'د بېلګې شرطونه پوره دي (نه دي تایید شوي)',not_met:'یو شرط نه دی پوره شوی',unknown:'لا نه دي څرګند'},
  words:{met:'پوره شو',not_met:'پوره نه شو',unknown:'نامعلوم'},
  reasons:{degree_comparison:'د لېسانس سند ټاکلی حد پوره کوي.',test_thresholds_met:'۷ نمره او ټول مهارتونه تر ۶٫۵ لوړ، د ۶٫۵ / ۶ حد پوره کوي.',gpa_comparison:'۳٫۲ معدل د ۳٫۵ تر حد ټیټ دی.',missing_exclusion_evidence:'د زده کړو د دوام په اړه هېڅ کتل شوی بیان نشته — نامعلوم، نه وړ.',exclusion_not_reported:'د زده کړو دوام نه دی راپور شوی.',fallback:'ټاکلی شرط له کتل شویو حقایقو سره پرتله شو.'},
  factOrigin:{document_extracted:'سند',user_declared:'ستاسې وینا'},
  nextTitle:'لارموند — بل ګامونه',reset:'ننداره له سره پیل کړئ',quotedIn:'په سرچینه کې نقل شوی'}
};;
