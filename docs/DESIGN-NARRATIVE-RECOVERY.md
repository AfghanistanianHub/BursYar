# Document narrative: what was missing and what was recovered

The previous report said that no particle layer exists anywhere in the codebase.
This document records the investigation that followed, the evidence behind the
conclusion, and the component that now carries the missing beat.

## 1. The question

An approved BursYar narrative was described as showing a document arriving, opening
in a professional reader, breaking into document-specific fragments, and those
fragments connecting the document's evidence to a scholarship's requirements. The
previous inspection found the arrival, the reader and the requirement cards, but no
fragment transition.

Three different things can be meant by "the approved visual narrative", so each was
checked separately.

| Layer | Where it lives | Fragments present? |
| --- | --- | --- |
| Public landing hero (arc band, editorial statement, interactive demo) | `src/hero-cables-reference.js`, `src/hero-document-demo.js` | No — by design. The hero is a static composition plus a controlled interactive demo. |
| Authenticated Document Reader | `src/documents.js`, `src/documents-storyboard.css` | No — it is a functional reader: claims, provenance, decisions, mapping. |
| Editorial scroll narrative ("From evidence to opportunity") | `src/main.js`, `src/homepage-flow.css` | **No** — the document, the connector lanes and the two outcome cards existed, but nothing ever travelled between them. |

The third layer is where the approved narrative belongs, and it was the one with a
visible gap: the illustration asserted "evidence connects to requirements" while
showing a dashed line and two cards that had no relationship to the document's
highlighted line.

## 2. Could an earlier implementation be recovered?

No. The evidence is negative and reproducible:

```bash
git log --all -S"particle" -i --oneline           # 0 commits
git log --all --diff-filter=A --name-only --pretty=format: \
  | sort -u | grep -i -e particl -e mote -e dust -e spark -e trail \
                    -e grain -e noise -e canvas  # 0 paths out of 586 ever added
git log --all --oneline -i --grep=particle        # 0 commits
```

Every local branch and every `origin/*` branch was included (`--all`). The repository
has 586 distinct file paths in its whole published history and none of them is a
particle, canvas, grain or noise module; there is no graphics or animation dependency
in `package.json`. `docs/archive/` contains the design and mission records and none of
them names such a component.

The only fragment-like constructs that do exist are CSS dot textures
(`--sb-dots`, the `radial-gradient` grids) and dashed connector lanes. Those are
static patterns, not a transition.

**Conclusion:** the particle transition was never integrated into this repository.
Either the prototype lived only in the external AI Studio workspace that the branch
`work/restore-approved-ai-studio-hero` was named after, or it was described in review
but never built. It cannot be restored from here, so the mission's fallback applies:
implement a lightweight equivalent faithful to the established design requirements.

## 3. What was implemented

One component, inside the existing editorial scene, using the scene's own tokens and
geometry. Nothing was redesigned, and no hero, typography, palette or layout token
changed.

1. **Reader shell.** The arriving page gains a three-dot document-window chrome and a
   caret on the highlighted line, so the beat reads "a document opened in a reader"
   rather than "a loose sheet of paper". Both are abstract marks: no untranslated
   English string is painted into a Farsi or Pashto page.
2. **Document fragments.** Six fragments ride the two existing connector lanes
   (`.by-story-lane-a`, `.by-story-lane-b`) with `offset-path`, animated by
   `offset-distance` between the document's highlighted evidence line and the two
   outcome cards. Each fragment has its own resting distance (`--d`) and its own
   `view()` range, so they leave the document one after another as the reader scrolls
   and then stop — a sequence, not continuous decoration.
3. **Static equivalence.** `offset-path` is the only thing that positions the
   fragments; without it they are hidden instead of stacking at the SVG origin. Under
   `prefers-reduced-motion: reduce` the animation is removed and every fragment keeps
   its resting distance, so the still image still shows evidence travelling to the
   requirements. In print the fragment layer is dropped.

Why CSS and SVG only: the page already pays for the two lanes and the scene; the
fragments add no dependency, no canvas, no requestAnimationFrame loop, no network
asset and no JavaScript. The scroll timeline is the browser's own compositor work, and
a reader on a constrained device who asks for reduced motion gets one static frame.

## 4. Defect found while inspecting the result

**NARR-02 — the connector pointed the wrong way in RTL.** The paper and the outcome
cards are placed with logical properties (`inset-inline-start` / `inset-inline-end`),
so they swap sides in Farsi and Pashto, but the SVG's geometry is fixed: the lanes kept
running left-to-right into empty space while the cards sat on the left. The fragments
inherited the same error. `html[dir=rtl] .by-story-route{transform:scaleX(-1)}` mirrors
the whole lane layer, which is correct for both the static picture and the moving
fragments.

## 5. Verification

- `node --test tests/narrative-scroll-timelines.test.js` — 4 tests. New guards: both
  lanes keep an `offset-path`, the travel keyframe animates `offset-distance`, the
  reduced-motion rule pins each fragment to its resting distance, the RTL mirror rule
  exists, and the markup keeps six fragments, the reader chrome and both lanes.
- `verification/animation-accessibility.mjs` (3 languages × phone and desktop) — now
  also requires the fragments to hold a `view()` timeline, to sit on a lane, to change
  their `offset-distance` with scroll, and the connector to be mirrored exactly in the
  RTL languages and unmirrored in English, on top of the existing contrast sweep.
  Measured on the built bundle: fragments move from `0%`/`8%`-range origins to
  `43.7%`, `56.1%`, `61.8%` (lane A) and `27.6%`, `35.3%`, `38.4%` (lane B) at a
  centred scroll position; `routeTransform` is `matrix(-1, 0, 0, 1, 0, 0)` for `fa`
  and `ps` and `none` for `en`.
- Rendered inspection at 1280 and 390 px in `en`, `fa` and `ps`:
  `verification/artifacts/narrative/story-*.png`. No horizontal overflow at either
  width (`scrollWidth <= innerWidth`).

## 6. What this is not

- It is not a claim that the original prototype was reproduced: the original was not
  available, and this is the documented fallback.
- It is not live processing. The scene is declared conceptual in its own footnote and
  is `aria-hidden`; no screen reader is told that a document was processed.
- The "actionable next step" beat of the narrative is carried by the scene's own
  guidance link and by the PathFinder timeline immediately below it rather than by a
  third plate, because a third card in the 520×330 artwork would have crowded the two
  outcome cards it depends on. Adding it would be a redesign, not a recovery.
