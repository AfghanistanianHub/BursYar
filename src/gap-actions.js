// No provider referrals are generated from model text or self-reported proficiency.
// Until a dated, program-specific acceptance policy is curated, ask admissions.
export function planGaps(assessment){
 return assessment.results.filter(r=>r.status!=='met').map(r=>({requirementId:r.requirementId,status:r.status,action:r.reason==='missing_language_test'?'confirm_accepted_tests':r.reason==='degree_comparison'?'check_degree_route':'clarify_evidence',source:r.source,providerUrl:null}));
}
export const actionText={
 en:{confirm_accepted_tests:'Ask admissions which official tests, score thresholds, validity dates and exemptions apply to this course before booking a test. Missing a certificate does not establish weak English.',check_degree_route:'Ask whether your existing qualification or an officially documented pathway meets this requirement.',clarify_evidence:'Resolve the missing, ambiguous or conflicting evidence with the institution; do not treat unknown as eligible.'},
 fa:{confirm_accepted_tests:'پیش از ثبت‌نام آزمون، از پذیرش دربارهٔ آزمون‌های رسمی، حد نمره، تاریخ اعتبار و معافیت‌های این دوره بپرسید. نداشتن سند، ضعف انگلیسی را ثابت نمی‌کند.',check_degree_route:'بپرسید آیا مدرک فعلی یا مسیر رسمی مستند، این شرط را برآورده می‌کند.',clarify_evidence:'شواهد ناقص، مبهم یا متناقض را با مؤسسه روشن کنید؛ نامشخص به معنای واجد شرایط نیست.'},
 ps:{confirm_accepted_tests:'د ازموینې تر نوملیکنې مخکې له ادارې د منل شوو رسمي ازموینو، نمرو، اعتبار نېټو او معافیتونو پوښتنه وکړئ. د سند نشتوالی د انګلیسي کمزوري نه ثابتوي.',check_degree_route:'پوښتنه وکړئ چې اوسنی سند یا رسمي مستنده لاره دا شرط پوره کوي که نه.',clarify_evidence:'نیمګړي، مبهم یا متناقض شواهد له ادارې سره روښانه کړئ؛ نامعلوم د وړتیا مانا نه لري.'}
};
