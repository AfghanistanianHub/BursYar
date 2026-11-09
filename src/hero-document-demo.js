const copy = {
  en: {
    sample:'Interactive sample', title:'Master’s scholarship example', source:'Sample transcript', tool:'AI document reader · demo',
    read:'Read sample', field:'Degree level', empty:'Select a degree', bachelor:'Bachelor’s', associate:'Associate', master:'Master’s',
    waiting:'Read the sample to fill this field.', ready:'Suggested from the transcript. Review or edit it.', edited:'Edited by you. The source is unchanged.',
    requirement:'Academic requirement', language:'Language requirement', unknown:'Unknown', met:'Met', notMet:'Not met',
    next:'Next step', choose:'Read the sample transcript.', tests:'Check accepted language tests.', minimum:'Check the program’s minimum degree requirement.',
  },
  fa: {
    sample:'نمونهٔ تعاملی', title:'نمونهٔ بورسیهٔ کارشناسی ارشد', source:'کارنامهٔ نمونه', tool:'خوانش مدرک با هوش مصنوعی · نمونه',
    read:'خواندن نمونه', field:'مقطع تحصیلی', empty:'انتخاب مقطع', bachelor:'کارشناسی', associate:'کاردانی', master:'کارشناسی ارشد',
    waiting:'نمونه را بخوانید تا این فیلد پر شود.', ready:'پیشنهاد از روی کارنامه. می‌توانید آن را اصلاح کنید.', edited:'شما این مقدار را اصلاح کردید. متن کارنامه تغییر نکرد.',
    requirement:'شرط مدرک تحصیلی', language:'شرط زبان', unknown:'نامشخص', met:'برآورده شد', notMet:'برآورده نشد',
    next:'قدم بعدی', choose:'کارنامهٔ نمونه را بخوانید.', tests:'آزمون‌های زبان پذیرفته‌شده را بررسی کنید.', minimum:'حداقل مدرک تحصیلی را در شرایط برنامه بررسی کنید.',
  },
  ps: {
    sample:'ازمایښتي بېلګه', title:'د ماسټرۍ بورس بېلګه', source:'ازمایښتي کارنامه', tool:'په مصنوعي ځیرکتیا د سند لوستل · بېلګه',
    read:'بېلګه ولولئ', field:'د زده‌کړو کچه', empty:'کچه وټاکئ', bachelor:'لیسانس', associate:'دوه کلن سند', master:'ماسټري',
    waiting:'د دې برخې د ډکولو لپاره بېلګه ولولئ.', ready:'له سند څخه وړاندیز شوی. دا ارزښت بدلولی شئ.', edited:'تاسو دا ارزښت بدل کړ. اصلي سند هماغسې پاتې دی.',
    requirement:'د تحصیلي سند شرط', language:'د ژبې شرط', unknown:'نامعلوم', met:'پوره شو', notMet:'پوره نه شو',
    next:'بل ګام', choose:'د نومرو بېلګه ولولئ.', tests:'د ژبې منل شوې ازموینې وګورئ.', minimum:'د پروګرام لږ تر لږه تحصیلي شرط وګورئ.',
  },
};

export function heroDocumentReader(language) {
  const t=copy[language]??copy.en;
  return `<div class="hero-document-reader">
    <div class="hero-reader-heading">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M8 4H4v4m12-4h4v4M4 16v4h4m12-4v4h-4M7 12h10"/><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/></svg>
      <strong>${t.tool}</strong>
    </div>
    <div class="hero-reader-source">
      <div><small>${t.source}</small><p dir="ltr" lang="en">Degree awarded: <mark>Bachelor of Science</mark></p></div>
      <button type="button" data-demo-read aria-controls="document-demo-degree">${t.read} <span aria-hidden="true">→</span></button>
    </div>
  </div>`;
}

export function heroDocumentDemo(language) {
  const t=copy[language]??copy.en;
  return `<aside class="hero-visual document-demo-visual"><section class="document-demo" aria-labelledby="document-demo-title">
    <div><small>${t.sample}</small><h2 id="document-demo-title">${t.title}</h2></div>
    <div class="document-demo-field">
      <label for="document-demo-degree">${t.field}</label>
      <select id="document-demo-degree" aria-describedby="document-demo-hint" disabled>
        <option value="" disabled selected>${t.empty}</option>
        <option value="associate">${t.associate}</option><option value="bachelor">${t.bachelor}</option><option value="master">${t.master}</option>
      </select>
      <span class="document-demo-print-degree"></span>
      <small id="document-demo-hint">${t.waiting}</small>
    </div>
    <div aria-live="polite" aria-atomic="true">
      <div class="document-demo-result"><strong>${t.requirement}</strong><span data-demo-result data-status="unknown">${t.unknown}</span></div>
      <div class="document-demo-result document-demo-language"><strong>${t.language}</strong><span data-status="unknown">${t.unknown}</span></div>
      <div class="document-demo-next"><small>${t.next}</small><p data-demo-next>${t.choose}</p></div>
    </div>
  </section></aside>`;
}

export function mountHeroDocumentDemo(root,language) {
  const t=copy[language]??copy.en;
  const degree=root.querySelector('#document-demo-degree');
  const printDegree=root.querySelector('.document-demo-print-degree');
  const hint=root.querySelector('#document-demo-hint');
  const result=root.querySelector('[data-demo-result]');
  const next=root.querySelector('[data-demo-next]');
  function updateResult(){
    printDegree.textContent=degree.selectedOptions[0].textContent;
    const meets=degree.value==='bachelor'||degree.value==='master';
    result.dataset.status=meets?'met':'not_met';
    result.textContent=meets?t.met:t.notMet;
    next.textContent=meets?t.tests:t.minimum;
  }
  root.querySelector('[data-demo-read]').addEventListener('click',()=>{
    if(degree.disabled){
      degree.disabled=false;
      degree.value='bachelor';
      hint.textContent=t.ready;
      updateResult();
    }
    degree.focus();
  });
  degree.addEventListener('change',()=>{hint.textContent=t.edited;updateResult();});
}
