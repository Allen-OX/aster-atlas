# Evidence Constellation — executed verification

October 3, 2026. Local Aster Atlas / Hack-Nation rare-disease challenge.

## Automated checks

- Five existing graph/retrieval tests pass, zero failures.
- `app.js` and `atlas-scene.js` pass syntax checking.
- `git diff --check` passes.
- `data.js`, `logic.js`, and `logic.test.js` are unchanged in the worktree.

## Browser checks executed

Chrome on the user's Mac, plus successful rendering in the Codex in-app browser:

- Main scene loads without captured browser errors.
- Desktop 1280×720 and phone viewport 390×844 inspected; phone document has no horizontal overflow. Viewport override reset afterward.
- Search 'heart' yields Cardiomyopathy. Community filter yields FARA when search is cleared.
- 'How is FXN connected to ATM?' yields the expected four-edge route through FRDA, ataxia and A-T.
- Unrecognized entities yield a clear unresolved-query message and clear stale route results/highlight.
- Researcher comparison opens the shared-phenotype relationship with its explicit cross-source-inference label and limited claim.
- Mobile sculpture selection opens the correct evidence panel; return link brings the constellation back into view.
- Intentional route/index evidence navigation focuses the selected entity heading. Inspector scroll resets when selection changes.
- Unfold/condense and pause/resume controls change their visible pressed state; scene geometry responds.
- Emulated reduced-motion preference starts with 'Resume motion' and aria-pressed=true. Emulation cleared afterward.
- Data-only `?no3d=1` path shows a visible explanation and an accessible entity-index link. Selecting FARA still opens its evidence. This checks initialization fallback, not every GPU-driver failure.
- The revised page was reloaded in the user's in-app preview and reports scene state 'ready'.

## Observed rendering

At 1280×720 on this Mac, 180 visible frame samples:

- Median: **8.3 ms**
- p95: **8.8 ms**
- Draw calls: **116**
- Triangles: **59,168**
- Decorative points: **1,260**
- Actual graph: **8 nodes, 8 edges**

These measurements are specific to this browser/hardware and a short observation. Phone checks used viewport emulation, not physical mobile hardware. This is not a full accessibility audit or a production-scale performance claim. Decorative points are not biomedical records. Offscreen rendering is suspended by IntersectionObserver.

## Review corrections

Four collaborating agents handled layout, scene engineering, application integration and independent review. Fixed hero/search overlap, compact-desktop spacing, hidden inference legends, mobile evidence navigation, stale route messaging, keyboard focus, retained inspector scroll, and glow filaments hidden inside solid geometry. Actual relationships, sources and underlying traversal were preserved.

Saved previews: `aster-desktop.png`, `aster-mobile.png`.

## Submission implications

This is a local design revision. The repository has not been published and no event submission has been made. Earlier submission videos show the previous interface and need refreshing before final submission. The visual work does not establish full sponsor challenge compliance or add an AI inference engine.
