const sources = [
  [6, 13, '#a64919', 'M72 95 C80 226 221 164 334 233 S518 172 565 280', 'M8 3h8l4 4v14H8zM11 10h6m-6 4h6m-6 4h4'],
  [18, 27, '#2e7060', 'M216 165 C210 236 280 208 343 245 S507 194 552 280', 'M8 17l-2 4 6-2 6 2-2-4M12 4a6 6 0 1 0 0 12 6 6 0 0 0 0-12Z'],
  [11, 47, '#886519', 'M156 264 C254 258 324 298 409 268 S518 227 539 280', 'M7 4h10v10H7zM9 18h6m-3-4v4M9 8h6'],
  [7, 68, '#296396', 'M114 383 C218 379 213 303 351 307 S468 253 529 283', 'M5 5h14v14H5zM8 9h8m-8 4h8m-8 3h5'],
  [21, 79, '#32755d', 'M276 442 C368 430 356 338 440 330 S488 266 519 294', 'M7 4h10v16H7zM10 8h4m-4 4h4m-4 4h4'],
  [94, 14, '#a64919', 'M1128 103 C1125 236 960 173 865 235 S692 180 639 280', 'M4 5h16v11H4zM9 20h6m-3-4v4'],
  [82, 29, '#2e7060', 'M960 160 C894 163 918 254 827 245 S699 192 652 280', 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 0c-5 5-5 13 0 18m0-18c5 5 5 13 0 18M3 12h18'],
  [90, 47, '#886519', 'M1056 265 C960 252 938 313 835 281 S711 220 665 280', 'M9 6h11M9 12h11M9 18h11M4 6h1m-1 6h1m-1 6h1'],
  [92, 67, '#296396', 'M1080 375 C983 376 964 328 858 323 S741 254 676 283', 'M3 9l9-5 9 5M4 19h16M7 10v7m5-7v7m5-7v7'],
  [80, 80, '#8a4940', 'M936 447 C842 438 839 357 773 344 S723 270 686 294', 'M4 5h16v12H9l-5 4zM8 9h8m-8 4h6'],
];

const copy = {
  en: {
    sources: ['Transcript', 'Degree', 'Language test', 'Passport', 'CV', 'University', 'Official page', 'Scholarships', 'Funding evidence', 'Recommendation'],
    label: 'AI scholarship check', sample: 'Illustrative preview', academic: 'Degree', language: 'Language', grades: 'Grades', met: 'Met', unknown: 'Unknown', notMet: 'Not met',
  },
  fa: {
    sources: ['ریزنمرات', 'مدرک تحصیلی', 'آزمون زبان', 'گذرنامه', 'رزومه', 'دانشگاه', 'صفحهٔ رسمی', 'بورسیه‌ها', 'مدرک مالی', 'توصیه‌نامه'],
    label: 'بررسی بورسیه با هوش مصنوعی', sample: 'پیش‌نمایش نمونه', academic: 'مدرک تحصیلی', language: 'زبان', grades: 'معدل', met: 'برآورده شد', unknown: 'نامشخص', notMet: 'برآورده نشد',
  },
  ps: {
    sources: ['د نمرو لړلیک', 'تحصیلي سند', 'د ژبې ازموینه', 'پاسپورټ', 'ژوندلیک', 'پوهنتون', 'رسمي پاڼه', 'بورسونه', 'مالي سند', 'سپارښت‌لیک'],
    label: 'په مصنوعي ځیرکتیا د بورس ارزونه', sample: 'ازمایښتي بېلګه', academic: 'تحصیلي سند', language: 'ژبه', grades: 'نمرې', met: 'پوره شو', unknown: 'نامعلوم', notMet: 'پوره نه شو',
  },
};

export function heroCables(language) {
  const t = copy[language] ?? copy.en;
  const paths = sources.map(([, , color, path], index) => {
    const start = .17 + index * .30;
    const motion = [0, .13, .26].map(delay => `<circle r="3.4" fill="${color}" stroke="#fffaf4" stroke-width="1.4" opacity="0">
      <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.8;1" begin="${start + delay}s" dur="1.35s"/>
      <animateMotion path="${path}" begin="${start + delay}s" dur="1.35s" calcMode="spline" keySplines=".35 0 .35 1" keyTimes="0;1"/>
    </circle>`).join('');
    return `<path d="${path}" stroke="var(--line)" stroke-width="2"/>${motion}`;
  }).join('');
  const cards = sources.map(([x, y, color, , icon], i) => `
    <div class="cables-source" data-x="${x}" data-y="${y}" data-ink="${color}">
      <span class="cables-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="${icon}"/></svg></span>
      <span>${t.sources[i]}</span>
    </div>`).join('');
  return `<figure class="hero-cables" aria-label="${t.label}">
    <figcaption class="sr-only">${t.sample}</figcaption>
    <div class="cables-diagram">
      <div class="cables-scene">
      <svg class="cables-traces" viewBox="0 0 1200 550" preserveAspectRatio="none" fill="none" aria-hidden="true">
        <ellipse cx="600" cy="348" rx="224" ry="141" fill="var(--brand-ghost)"/>
        <ellipse cx="600" cy="348" rx="171" ry="104" stroke="var(--line)"/>
        <ellipse cx="600" cy="348" rx="130" ry="79" stroke="var(--line)"/>
        ${paths}
      </svg>
      ${cards}
      </div>
      <div class="cables-reader">
        <div class="cables-chip" aria-hidden="true"><span lang="fa">بورس‌یار</span><strong>BursYar</strong><span class="cables-chip-ai">AI</span></div>
      </div>
    </div>
  </figure>`;
}

export function mountHeroCables(root) {
 for (const card of root.querySelectorAll('.cables-source')) {
  card.style.setProperty('--x', card.dataset.x+'%');
  card.style.setProperty('--y', card.dataset.y+'%');
  card.style.setProperty('--ink', card.dataset.ink);
 }
}
