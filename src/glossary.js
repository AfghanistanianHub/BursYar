// Controlled Dari/Pashto terminology for eligibility guidance. UNREVIEWED:
// no fluent reviewer has approved these strings. Do not relabel them as
// reviewed. Reviewer record rule lives in docs/TRANSLATION-REVIEW.json and
// docs/GLOSSARY.md. Every fa/ps term must contain Arabic script.
const terms = {
  appearsToMeet: {en: 'Appears to meet', fa: 'به نظر می‌رسد برآورده شده', ps: 'ښکاري چې پوره شوی'},
  potentialMismatch: {en: 'Potential mismatch', fa: 'ناسازگاری احتمالی', ps: 'احتمالي نه سمون'},
  cannotDetermine: {en: 'Cannot determine', fa: 'قابل تعیین نیست', ps: 'نه شي ټاکل کېدای'},
  requirement: {en: 'requirement', fa: 'شرط', ps: 'شرط'},
  evidence: {en: 'evidence', fa: 'شواهد', ps: 'شواهد'},
  deadline: {en: 'deadline', fa: 'مهلت', ps: 'وروستۍ نېټه'},
  exemption: {en: 'exemption', fa: 'معافیت', ps: 'معافیت'},
  overallScore: {en: 'overall score', fa: 'نمره مجموع', ps: 'عمومي نمره'},
  bandScore: {en: 'band score', fa: 'نمره باند', ps: 'د باند نمره'},
  gpa: {en: 'GPA', fa: 'معدل (GPA)', ps: 'اوسط نمره (GPA)'},
  institution: {en: 'institution', fa: 'مؤسسه', ps: 'اداره'},
  verify: {en: 'verify', fa: 'تأیید کنید', ps: 'تایید کړئ'},
  unknown: {en: 'unknown', fa: 'نامشخص', ps: 'نامعلوم'}
};
for (const term of Object.values(terms)) Object.freeze(term);
export const glossary = Object.freeze({...terms});
