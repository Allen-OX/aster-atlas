# Aster Atlas final browser verification

Observed October 4, 2026 against the locally served build at `http://127.0.0.1:4173/`—never `file://`.

- Build fingerprint: `sha256:7c7ffaf00d62a5d51a7e61ccea6320207454606d8bd72c8f16188403662b8320`
- Browser: Codex in-app Chromium; exact engine version was not exposed by the available browser interface.
- Evidence images: `design/judge-desktop-final.png` and `design/judge-mobile-final.png`
- Scope: targeted browser, responsive, keyboard, dialog, reflow, reduced-motion, fallback, and console smoke checks. This is not a WCAG certification or a five-person usability study.

## Results

| Mode | Checks | Result |
| --- | --- | --- |
| Desktop, 1280×720 CSS px | One main landmark; primary navigation label; headline/review state/CTA visible; all five steps render their distinct panel; evidence and OpenAI dialogs open; Escape closes and returns focus; unknown query clears stale state; no horizontal overflow | Pass |
| Mobile, 390×844 CSS px | Single-column reading order; no horizontal overflow; every visible core input, button, link, and disclosure target at least 44×44 CSS px; primary action and review state visible | Pass |
| Narrow reflow, 320×844 CSS px | No document overflow; evidence dialog remains within viewport; long registry fields wrap; dialog has no internal horizontal overflow; close target is 51px high | Pass |
| Reduced motion | `prefers-reduced-motion: reduce` matched; global control reported `Animate all` / `aria-pressed=true`; atlas and hologram pause controls reported pressed; core journey stayed usable | Pass |
| No-3D fallback | `?no3d=1` preserved the complete journey and milestone; unavailable hologram expansion was disabled and named “Living Hologram unavailable; use the evidence index” | Pass |
| Keyboard smoke path | Enter activated each of the five named step buttons; focus moved to the updated panel; Enter opened the evidence dialog; focus began on Close; Escape closed it and restored focus to the invoking control | Pass |
| Console | Zero error-level messages in the final desktop and reduced-motion/no-3D runs | Pass |

The five verified panel headings were:

1. Review a shared Fe–S research model opportunity
2. Start from an existing research asset.
3. Define the experiment before requesting a model.
4. A shared pathway does not prove a reusable model.
5. 10× coordination hypothesis.

The evidence dialog rendered all 31 claim records. The OpenAI dialog exposed implementation/build-time extraction, no runtime model or paid API call, a null model field, an explicit unknown-model disclosure, and pending independent expert review.

## Accessibility observations

- Heading order in the primary journey was one H1 followed by the current evidence and action H2s.
- The journey status uses `aria-live="polite"`; the evidence dialog uses native `<dialog>` with `aria-modal="true"`.
- Representative computed contrast ratios were 15.97:1 for journey text, 13.27:1 for the primary CTA, 15.28:1 for summary cards, and 14.80:1 for panel text.
- Focus-visible styling uses a three-pixel light outline with four-pixel offset.
- These checks cover the critical judge path only. They do not certify every secondary 3D, map, account, or universe interaction.

## Findings repaired and repeated

1. The desktop Find label wrapped across two lines. A no-wrap rule and regression assertion were added; final size is approximately 54×44 CSS px.
2. Three mobile `<summary>` controls were only 33px high. They now have a 44px minimum, flex alignment, and a regression assertion.
3. A long registry field made the 320px evidence dialog horizontally scroll. Dialog-wide anywhere wrapping and a regression assertion now keep `scrollWidth === clientWidth`.
4. Release screenshots and proof files were initially part of the build-fingerprint candidate set, creating a self-referential fingerprint. The auditor now fingerprints runtime assets while excluding post-build evidence, docs, design screenshots, and submission media; the isolated-copy smoke still retains all required test fixtures.

No controllable critical, important, or moderate finding remained in the tested judge path after the repeated checks.
