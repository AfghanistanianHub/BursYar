// The viewBox is cropped to the ink: it starts below the empty band above the hub
// (y=80) and stops just below the arc baseline (y=348). Cropping never rescales the
// emblem because the viewBox width, which sets the scale, is unchanged.
const DESKTOP = {
  viewBox: '0 80 1120 268',
  track: 'M28,346 Q560,-46 1092,346',
  leftWing: 'M28,346 Q266,168 506,152',
  rightWing: 'M1092,346 Q854,168 614,152',
  cx: 560,
  cy: 150,
  glowR: 108,
  hubR: 54,
  innerR: 48,
  enY: 146,
  enSize: 19,
  nodeR: 20,
  iconTransform: 'translate(-9,-9) scale(0.75)',
};

const MOBILE = {
  viewBox: '0 0 560 216',
  track: 'M18,206 Q280,-40 542,206',
  leftWing: 'M18,206 Q124,96 202,132',
  rightWing: 'M542,206 Q436,96 358,132',
  cx: 280,
  cy: 92,
  glowR: 84,
  hubR: 54,
  innerR: 47,
  enY: 89,
  enSize: 19,
  nodeR: 22,
  iconTransform: 'translate(-10.8,-10.8) scale(0.9)',
};

// Exposed so geometry invariants (mobile legibility, band aspect) stay testable.
export const referenceHeroGeometry = Object.freeze({
  desktop: DESKTOP,
  mobile: MOBILE,
});

const NODES = [
  // Left wing (student documents -> BursYar)
  {side: 'left', key: 'transcript', color: '#1E3A5F', mobile: true, svg: '<path d="M7 3h7l4 4v14H7z"/><path d="M10 8h5M10 12h5M10 16h3"/>'},
  {side: 'left', key: 'motivation', color: '#2E4A6D', mobile: false, svg: '<path d="M5 4h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-5 4V5a1 1 0 0 1 1-1z"/>'},
  {side: 'left', key: 'ielts', color: '#1E3A5F', mobile: true, svg: '<circle cx="12" cy="9" r="5"/><path d="M10 9l1.5 1.5L15 7"/><path d="M9.5 13.5L8 21l4-2.5L16 21l-1.5-7.5"/>'},
  {side: 'left', key: 'bank', color: '#4B4845', mobile: false, svg: '<path d="M3 10l9-6 9 6"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8"/><path d="M3 20h18"/>'},
  {side: 'left', key: 'degree', color: '#1E3A5F', mobile: true, svg: '<circle cx="12" cy="9" r="5"/><path d="M9 13.5L6.5 21 12 18l5.5 3L15 13.5"/>'},
  {side: 'left', key: 'passport', color: '#2E4A6D', mobile: true, svg: '<rect x="5" y="3" width="14" height="18" rx="2"/><rect x="8" y="7" width="4" height="5"/><path d="M14 8h3M14 12h3M8 16h8"/>'},
  // Right wing (official sources & scholarships -> BursYar)
  {side: 'right', key: 'cv', color: '#2E4A6D', mobile: true, svg: '<path d="M7 3h7l4 4v14H7z"/><circle cx="12" cy="10" r="2.2"/><path d="M8.5 17c.7-1.8 2-2.7 3.5-2.7s2.8.9 3.5 2.7"/>'},
  {side: 'right', key: 'official', color: '#1E3A5F', mobile: true, svg: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.6 3 14.4 0 18M12 3c-3 3.6-3 14.4 0 18"/>'},
  {side: 'right', key: 'recommendation', color: '#4B4845', mobile: false, svg: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 7l8.5 6 8.5-6"/>'},
  {side: 'right', key: 'university', color: '#1E3A5F', mobile: true, svg: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M9 20h6M12 16v4"/>'},
  {side: 'right', key: 'scholarships', color: '#2E4A6D', mobile: true, svg: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>'},
  {side: 'right', key: 'profile', color: '#4B4845', mobile: false, svg: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c1-3.5 3.8-5.5 7-5.5s6 2 7 5.5"/>'},
];

// Deterministic quadratic point helper for initial SSR/pre-paint node positions
function quadPoint(p0, p1, p2, t) {
  const mt = 1 - t;
  const x = mt * mt * p0[0] + 2 * mt * t * p1[0] + t * t * p2[0];
  const y = mt * mt * p0[1] + 2 * mt * t * p1[1] + t * t * p2[1];
  return [x, y];
}

const DESKTOP_QUADS = {
  left: [[28, 346], [266, 168], [506, 152]],
  right: [[1092, 346], [854, 168], [614, 152]],
};

const MOBILE_QUADS = {
  left: [[22, 164], [142, 84], [240, 76]],
  right: [[538, 164], [418, 84], [320, 76]],
};

const DESKTOP_OFFSETS = [0.09, 0.25, 0.41, 0.57, 0.73, 0.89];
const MOBILE_OFFSETS = [0.14, 0.37, 0.60, 0.83];

const copy = {
  en: {
    ariaLabel: 'Documents and official scholarship sources connecting into BursYar',
    caption: 'Compare your documents with official requirements',
    pause: 'Pause animation',
    play: 'Play animation',
    labels: {
      transcript: 'Transcript',
      motivation: 'Motivation letter',
      ielts: 'Language test',
      bank: 'Bank statement',
      degree: 'Degree',
      passport: 'Passport',
      cv: 'CV',
      official: 'Official page',
      recommendation: 'Recommendation',
      university: 'University',
      scholarships: 'Scholarships',
      profile: 'Profile',
    },
  },
  fa: {
    ariaLabel: 'اتصال مدارک شما و منابع رسمی بورسیه به بورس‌یار',
    caption: 'مدارک‌تان را با شرایط رسمی مقایسه کنید',
    pause: 'توقف حرکت',
    play: 'پخش حرکت',
    labels: {
      transcript: 'ریزنمرات',
      motivation: 'انگیزه‌نامه',
      ielts: 'آزمون زبان',
      bank: 'صورت‌حساب بانکی',
      degree: 'مدرک تحصیلی',
      passport: 'گذرنامه',
      cv: 'رزومه',
      official: 'صفحهٔ رسمی',
      recommendation: 'توصیه‌نامه',
      university: 'دانشگاه',
      scholarships: 'بورسیه‌ها',
      profile: 'پروفایل',
    },
  },
  ps: {
    ariaLabel: 'ستاسو اسناد او رسمي سرچینې بورس‌یار ته نښلي',
    caption: 'خپل اسناد له رسمي شرطونو سره پرتله کړئ',
    pause: 'حرکت ودروئ',
    play: 'حرکت پیل کړئ',
    labels: {
      transcript: 'د نمرو لړلیک',
      motivation: 'انګېزه‌لیک',
      ielts: 'د ژبې ازموینه',
      bank: 'بانکي حساب',
      degree: 'تحصیلي سند',
      passport: 'پاسپورټ',
      cv: 'ژوندلیک',
      official: 'رسمي پاڼه',
      recommendation: 'سپارښت‌لیک',
      university: 'پوهنتون',
      scholarships: 'بورسونه',
      profile: 'پروفایل',
    },
  },
};

export function referenceHero(language) {
  const t = copy[language] ?? copy.en;
  const dir = language === 'en' ? 'ltr' : 'rtl';
  let leftIndex = 0;
  let rightIndex = 0;
  const nodesMarkup = NODES.map((node) => {
    const sideIdx = node.side === 'left' ? leftIndex++ : rightIndex++;
    const [ix, iy] = quadPoint(...DESKTOP_QUADS[node.side], DESKTOP_OFFSETS[sideIdx]);
    const label = t.labels[node.key] ?? node.key;
    return `<g class="by-tile${node.mobile ? '' : ' by-tile-desktop'}" data-side="${node.side}" data-side-idx="${sideIdx}" data-mobile="${node.mobile ? '1' : '0'}" transform="translate(${ix.toFixed(1)},${iy.toFixed(1)})">
      <title>${label}</title>
      <circle class="by-tile-circle" r="${DESKTOP.nodeR}" fill="#FFFFFF" stroke="#CFC6BC" stroke-width="1.35"/>
      <g class="by-tile-glyph" transform="${DESKTOP.iconTransform}" fill="none" stroke="${node.color}" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round">${node.svg}</g>
    </g>`;
  }).join('');

  return `<div id="by-hero-cables" class="by-arc-band">
    <div id="by-stage" class="by-arc-stage">
      <div class="by-arc-art">
      <svg id="heroArc" viewBox="${DESKTOP.viewBox}" role="img" aria-label="${t.ariaLabel}">
        <title>${t.ariaLabel}</title>
        <defs>
          <radialGradient id="byHubGlow">
            <stop offset="0%" stop-color="#1E3A5F" stop-opacity="0.11"/>
            <stop offset="100%" stop-color="#1E3A5F" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <path class="by-arc-track" d="${DESKTOP.track}" fill="none" stroke="#D8D0C8" stroke-width="1.5" opacity="0.9"/>
        <path class="by-arc-wing-left" d="${DESKTOP.leftWing}" fill="none" stroke="none"/>
        <path class="by-arc-wing-right" d="${DESKTOP.rightWing}" fill="none" stroke="none"/>
        <circle class="by-hub-glow" cx="${DESKTOP.cx}" cy="${DESKTOP.cy}" r="${DESKTOP.glowR}" fill="url(#byHubGlow)"/>
        <circle class="by-hub-pulse by-hub-pulse-1" cx="${DESKTOP.cx}" cy="${DESKTOP.cy}" r="${DESKTOP.hubR}" fill="none" stroke="#1E3A5F" stroke-width="1.2"/>
        <circle class="by-hub-pulse by-hub-pulse-2" cx="${DESKTOP.cx}" cy="${DESKTOP.cy}" r="${DESKTOP.hubR}" fill="none" stroke="#1E3A5F" stroke-width="1.2"/>
        <circle class="by-hub-outer" cx="${DESKTOP.cx}" cy="${DESKTOP.cy}" r="${DESKTOP.hubR}" fill="#FEFDFB" stroke="#1A1A1A" stroke-width="1.5"/>
        <circle class="by-hub-inner" cx="${DESKTOP.cx}" cy="${DESKTOP.cy}" r="${DESKTOP.innerR}" fill="none" stroke="#D8D0C8" stroke-width="1"/>
        <text class="by-hub-en" x="${DESKTOP.cx}" y="${DESKTOP.enY}" text-anchor="middle" font-size="${DESKTOP.enSize}" font-weight="700" fill="#1A1A1A">BursYar</text>
        ${nodesMarkup}
      </svg>
      <span class="by-hub-fa" lang="fa" dir="rtl" aria-hidden="true">بورس‌یار</span>
      </div>
      <div class="by-arc-meta" dir="${dir}">
        <p class="by-diagram-caption">${t.caption}</p>
        <button class="by-motion" type="button" hidden>
          <svg class="by-motion-icon" aria-hidden="true" viewBox="0 0 20 20" width="18" height="18" fill="currentColor">
            <path class="by-pause-icon" d="M5 4h3v12H5zm7 0h3v12h-3z"/>
            <path class="by-play-icon" d="M6 4l10 6-10 6z"/>
          </svg>
          <span class="by-motion-label">${t.pause}</span>
        </button>
      </div>
    </div>
  </div>`;
}

export function mountReferenceHero(root, language, paused, onPauseChange) {
  const section = root.querySelector('#by-hero-cables');
  if (!section) return () => {};
  const svg = section.querySelector('#heroArc');
  const track = section.querySelector('.by-arc-track');
  const leftPath = section.querySelector('.by-arc-wing-left');
  const rightPath = section.querySelector('.by-arc-wing-right');
  const glow = section.querySelector('.by-hub-glow');
  const pulses = [...section.querySelectorAll('.by-hub-pulse')];
  const outer = section.querySelector('.by-hub-outer');
  const inner = section.querySelector('.by-hub-inner');
  const enText = section.querySelector('.by-hub-en');
  const tileNodes = [...section.querySelectorAll('.by-tile')];
  const button = section.querySelector('.by-motion');
  const buttonLabel = button.querySelector('.by-motion-label');

  const mobileMq = matchMedia('screen and (max-width: 760px)');
  const reducedMq = matchMedia('(prefers-reduced-motion: reduce)');
  const t = copy[language] ?? copy.en;

  let isMobile = mobileMq.matches;
  let visible = false;
  let frame = 0;
  let elapsed = 0;
  let lastFrame;
  let leftLen = 0;
  let rightLen = 0;

  function applyGeometry() {
    isMobile = mobileMq.matches;
    const cfg = isMobile ? MOBILE : DESKTOP;
    svg.setAttribute('viewBox', cfg.viewBox);
    track.setAttribute('d', cfg.track);
    leftPath.setAttribute('d', cfg.leftWing);
    rightPath.setAttribute('d', cfg.rightWing);
    glow.setAttribute('cx', cfg.cx);
    glow.setAttribute('cy', cfg.cy);
    glow.setAttribute('r', cfg.glowR);
    for (const pulse of pulses) {
      pulse.setAttribute('cx', cfg.cx);
      pulse.setAttribute('cy', cfg.cy);
      pulse.setAttribute('r', cfg.hubR);
      pulse.style.transformOrigin = `${cfg.cx}px ${cfg.cy}px`;
    }
    outer.setAttribute('cx', cfg.cx);
    outer.setAttribute('cy', cfg.cy);
    outer.setAttribute('r', cfg.hubR);
    inner.setAttribute('cx', cfg.cx);
    inner.setAttribute('cy', cfg.cy);
    inner.setAttribute('r', cfg.innerR);
    enText.setAttribute('x', cfg.cx);
    enText.setAttribute('y', cfg.enY);
    enText.setAttribute('font-size', cfg.enSize);

    for (const node of tileNodes) {
      node.querySelector('.by-tile-circle').setAttribute('r', cfg.nodeR);
      node.querySelector('.by-tile-glyph').setAttribute('transform', cfg.iconTransform);
    }
    leftLen = typeof leftPath.getTotalLength === 'function' ? leftPath.getTotalLength() : 0;
    rightLen = typeof rightPath.getTotalLength === 'function' ? rightPath.getTotalLength() : 0;
  }

  function edgeOpacity(progress) {
    if (progress < 0.08) return progress / 0.08;
    if (progress > 0.9) return (1 - progress) / 0.1;
    return 1;
  }

  function draw(animateProgress) {
    const quads = isMobile ? MOBILE_QUADS : DESKTOP_QUADS;
    let mobileLeftIdx = 0;
    let mobileRightIdx = 0;

    for (const node of tileNodes) {
      const side = node.dataset.side;
      const showOnMobile = node.dataset.mobile === '1';
      if (isMobile && !showOnMobile) {
        node.style.display = 'none';
        continue;
      }
      node.style.display = '';

      const idx = isMobile
        ? (side === 'left' ? mobileLeftIdx++ : mobileRightIdx++)
        : Number(node.dataset.sideIdx);
      const offsets = isMobile ? MOBILE_OFFSETS : DESKTOP_OFFSETS;
      const baseOffset = offsets[idx % offsets.length];
      const progress = animateProgress
        ? (baseOffset + elapsed / 11000) % 1
        : baseOffset;

      let x, y;
      const pathEl = side === 'left' ? leftPath : rightPath;
      const pathLen = side === 'left' ? leftLen : rightLen;
      if (pathLen > 0 && typeof pathEl.getPointAtLength === 'function') {
        const pt = pathEl.getPointAtLength(progress * pathLen);
        x = pt.x;
        y = pt.y;
      } else {
        [x, y] = quadPoint(...quads[side], progress);
      }

      node.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)})`);
      node.setAttribute('opacity', animateProgress ? edgeOpacity(progress).toFixed(2) : '1');
    }
  }

  function tick(now) {
    if (lastFrame === undefined || now - lastFrame >= 1000 / 30) {
      if (lastFrame !== undefined) elapsed += now - lastFrame;
      lastFrame = now;
      draw(true);
    }
    frame = requestAnimationFrame(tick);
  }

  function sync() {
    cancelAnimationFrame(frame);
    lastFrame = undefined;
    const motionAvailable = Boolean(observer) && !reducedMq.matches;
    const running = motionAvailable && visible && !paused && !document.hidden;
    button.hidden = !motionAvailable;
    buttonLabel.textContent = paused ? t.play : t.pause;
    button.classList.toggle('shows-play', paused);
    section.classList.toggle('is-paused', !running);
    draw(motionAvailable);
    if (!running) return;
    frame = requestAnimationFrame(tick);
  }

  function resize() {
    applyGeometry();
    sync();
  }

  function toggle() {
    paused = !paused;
    onPauseChange(paused);
    sync();
  }

  const observer = typeof IntersectionObserver === 'function'
    ? new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        sync();
      })
    : null;

  observer?.observe(section);
  button.addEventListener('click', toggle);
  document.addEventListener('visibilitychange', sync);
  mobileMq.addEventListener('change', resize);
  reducedMq.addEventListener('change', sync);
  resize();

  return () => {
    cancelAnimationFrame(frame);
    observer?.disconnect();
    button.removeEventListener('click', toggle);
    document.removeEventListener('visibilitychange', sync);
    mobileMq.removeEventListener('change', resize);
    reducedMq.removeEventListener('change', sync);
  };
}
