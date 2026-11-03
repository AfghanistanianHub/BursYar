# MISSION 15 — Owner Visual Review

Independent acceptance of the Mission 14 release, language corrections,
and a demo video re-synced to the current product.

Production: `https://bursyar.vercel.app` · release `main dbfb054`
(PR #79) · bundle `index-Cz7AMs0T.js` · verified live.

Screenshots: `docs/mission-15/` (full resolution in `/tmp/m15shots/`).

```sh
open docs/mission-15
open "submission/2026-meta-hackathon/final-assets/BursYar-Hackathon-Demo-Final.mp4"
```

## Screenshots

| File | Content |
|---|---|
| `prod-en-1440.jpg` | Desktop hero + workflow band + workspace |
| `prod-en-390.jpg` | Mobile stacked hero |
| `prod-fa-1440.jpg` | Farsi RTL desktop |
| `prod-ps-1440.jpg` | Pashto RTL desktop |
| `m15-en-768.jpg` | Tablet 2×2 band after fix |
| `m15-fa-1440.jpg` | Farsi hero with corrected copy |

## Visual defects fixed

1. **Tablet workflow band (700–1023px)** — four cards were squeezed into
   one row with heavy wrapping. Now a 2×2 grid; connector track is
   desktop-only. Verified: 2 computed columns at 768px.
2. No other visual changes: desktop/mobile/RTL compositions passed
   acceptance (strong first viewport, clear hierarchy, consistent icons,
   no overflow at 320/390/768/1440 in en/fa/ps).

## Text corrections (exact)

Farsi:

- Product name unified: بورسیار → **بورس‌یار** (header, footer, about,
  resources, recovery flows).
- My eligibility: شرایط من → **صلاحیت من**.
- Demo tag: اطلاعات نمونه؛ بورسیه فعال نیستند →
  **دادهٔ نمونه — بورسیهٔ فعال نیست**.
- Workflow verdict: «نشد» → **«برآورده نشد»** (full triplet).
- Description ending → **شما را راهنمایی می‌کند**.
- Next-steps note → **پیش از ثبت درخواست، موارد نامشخص را مستقیماً از
  مؤسسه استعلام کنید.**

Pashto:

- Eligibility: وړتیا/وړتیاوو → **وړتوب** (7 files, agreement fixed).
- Details: جزیات → **جزئیات**.
- Profile unified: پېژندڅېره → **پروفایل** (matches journey nav).
- Evidence comparison: ګوري → **پرتله کوي**.
- Product name unified to **بورس‌یار**.

## Remaining localization issues

- Fluent human review still **pending** for Farsi/Dari and Pashto
  (`docs/TRANSLATION-REVIEW.json`, 399+399 strings). The fixes above are
  confident orthography/terminology corrections, not a full review.
- Assistive-tech and real-device review still pending (axe + Chromium
  only).

## Functional integrity (verified against live code)

- Both hero CTAs open the correct panels; stages 1–3 scroll to live,
  visible targets; stage 4 follows the journey-nav contract (no-op while
  the section is hidden pre-analysis).
- Skip link first in tab order; status pills pair color with text;
  sample/rehearsal labels intact; language switching preserves state.

## Video

`submission/2026-meta-hackathon/final-assets/BursYar-Hackathon-Demo-Final.mp4`

- 2:59.90, 1920×1080 H.264, captioned, silent, 8.5 MB, decode-clean.
- SHA-256: `731016d5ca3d948eac96b415860b3ae1e853117c05db5953eb4a25c276fac347`
- All 8 scenes re-recorded from release `dbfb054` (LIVE from production,
  rehearsal from the real local app, bannered). Meta evidence card
  unchanged (recorded runs only). Assembly hardened so captions stay in
  sync across re-records. This file supersedes the Mission 09 render —
  upload this one.

## GitHub and production

- PR #79 (code + CI runner pin): merged as `dbfb054`, all checks green.
- Video + this review: PR (pending) → merge → production unchanged
  (assets only; no code deploy needed).
- Submission status: **NOT SUBMITTED.** Owner-only portal actions are
  unchanged from `OWNER-SUBMIT-NOW.md`.
