# Aster Atlas runtime audit

Reviewed 2026-10-03. Scope: `app.js`, `atlas-scene.js`, `index.html`, and `styles.css`, with the bundled Three renderer consulted to verify its context-loss behavior. The initial audit was read-only. The four findings were subsequently authorized for repair in `atlas-scene.js`; their original line references below describe the pre-fix version.

## Repair and verification status

- Context loss now emits an optional `onStatus` event, disables scene interaction, suspends frame/sample counting, and exposes `contextAvailable: false`. Restoration rebuilds the GPU-only reflection environment, verifies a render, resets the sample baseline, and emits ready. Runtime render failures dispose resources and report an error.
- The factory now owns cleanup during construction. Failed setup cancels scheduled animation, removes generated labels and registered listeners, disconnects completed observers, disposes GPU resources and instance allocations, and disposes the renderer before propagating the initialization error.
- The dust shader retains its positional displacement while time is frozen. Pause and reduced motion no longer zero a live displacement amplitude. The shader now includes the renderer's output color-space conversion.
- Every positive interval between successful visible rendered frames is retained in the bounded 180-sample window. `maxMs` and `visibleStallsOver1s` make long stalls visible alongside median/p95.

`node --check atlas-scene.js` passes. The current 11 Node tests pass. The browser fixture at [runtime-check.html](runtime-check.html) provides explicit buttons for GPU loss/restoration, pause, a 1.2-second visible stall, and a forced late-construction failure.

Chrome fixture verification was performed by the integrating agent after these fixes:

| Check | Observed result |
| --- | --- |
| Lost-context counters | `frameSamples: 161` and `renderedFrames: 164` remained unchanged across eight seconds; fixture reported `passed: true`. |
| GPU restoration | Status history progressed `restoring` → `ready`; rendering resumed with 116 draw calls and 59,168 triangles. |
| Partial initialization failure | Fixture reported `passed: true`; zero remaining labels, zero remaining canvas listeners, one created ResizeObserver, and that observer disconnected. |
| Visible long stall | A requested 1.2-second stall produced `maxMs: 1304.7` and `visibleStallsOver1s: 1`; it was retained instead of silently discarded. |

Pause continuity is supported by removal of the shader amplitude switch and retention of frozen time; this audit does not claim a separate pixel-difference measurement. Initial main-scene p95 observations exceeded 74 ms during shader compilation and fault injection. These results establish the named recovery/cleanup/sampling behaviors, not a frame-rate benchmark pass.

## Findings in the pre-fix version

### P2 — Context loss leaves the scene reported as ready and counts undrawn frames

**Locations:** `atlas-scene.js:181`, `atlas-scene.js:199`, `app.js:97`, `app.js:197`; bundled `vendor/three/three.module.js:17683`.

The application handles an initial scene-construction exception, but neither application module listens for `webglcontextlost` or `webglcontextrestored`. Three internally skips `render()` while its context is lost. The application nevertheless increments `renderedFrames`, continues collecting frame intervals, and leaves the ready status and scene controls enabled. Thus a blank/unavailable GPU view is represented as a healthy scene with accumulating rendered-frame measurements.

**Reproduction:** Load the atlas normally. In a disposable test tab, obtain the existing canvas WebGL2 context and call its `WEBGL_lose_context` extension's `loseContext()`. Wait, then activate Pause to refresh the status tooltip. The current application has no transition to its visible fallback and no exclusion for lost-context frames. Restore the context with the same extension to exercise recovery.

**Correction:** Track context availability, stop render-count/sample updates while unavailable, notify the DOM shell, and show an accessible interrupted/recovery state. Verify restored environment lighting as well as ordinary meshes before reporting ready.

### P2 — Failure after partial scene creation cannot clean up its resources

**Locations:** `atlas-scene.js:23`, `atlas-scene.js:130`, `atlas-scene.js:167`, `atlas-scene.js:168`, `atlas-scene.js:201`; `app.js:203`, `app.js:211`.

The scene factory allocates the renderer, GPU resources, label buttons/listeners, canvas listeners, and a ResizeObserver before returning its disposal handle. If a later initialization operation throws, assignment to `atlasScene` never completes. The application's catch therefore sees `null` and cannot call the factory's `dispose()`. A visible DOM fallback is added, but partial labels/listeners and renderer resources can remain. If the initial render throws after scheduling its next animation frame, that callback also survives.

**Reproduction:** In a disposable browser test, make the `IntersectionObserver` constructor throw before loading the module. Creation reaches that constructor after registering the resize observer and building labels. Inspect the fallback page: the partial label container is still populated and the earlier resources have no reachable cleanup owner. A test fixture that makes the initial renderer call throw exercises the surviving scheduled callback path.

**Correction:** Make the factory exception-safe: keep cleanup ownership while constructing, dispose completed allocations on failure, then rethrow. The app's outer fallback remains useful for the user-facing result.

### P2 — Pause changes particle positions instead of freezing the displayed frame

**Locations:** `atlas-scene.js:11`, `atlas-scene.js:186`, `atlas-scene.js:189`.

The dust vertex shader adds `sin(uTime * .16 + p.y) * .025 * uMotion` to each point's x position. Pause correctly freezes `time`, but also changes `uMotion` from 1 to 0. This removes the already displayed displacement, so particles jump to their undisplaced coordinates on pause and jump back on resume. The effect is small but deterministic; it also occurs when reduced motion is enabled during playback.

**Reproduction:** Let the atlas animate, capture the dust positions, then pause without moving the camera. At the same frozen time, any particle for which the sine term is nonzero changes x. For a time/position phase of π/2, the jump is exactly 0.025 scene units. Resume restores the displaced position before motion continues.

**Correction:** Freeze the time parameter while retaining the current positional transform. Reduced-motion initialization can use a fixed phase; it does not require zeroing an already applied displacement.

### P3 — Visible frame stalls of one second or more disappear from performance samples

**Location:** `atlas-scene.js:185`.

The loop already excludes hidden/offscreen frames and resets the sampling baseline when visibility changes. It additionally discards every otherwise visible interval of 1,000 ms or longer. Those are the most severe visible stalls, so the resulting median/p95 and sample count omit actual poor performance while the view remained visible.

**Reproduction:** Keep the scene visible and introduce a main-thread stall longer than one second in a disposable performance test. The following visible animation-frame interval fails `interval < 1000` and is not recorded. Repeat enough times to compare the reported p95 with the observed trace.

**Correction:** Retain visible positive intervals, or expose excluded-stall counts and explicitly label the percentile as filtered. Do not silently treat visible jank as a visibility gap.

## Reviewed behavior with no additional finding

- Offscreen and hidden views skip animation/render work; timestamps are reset on visibility transitions, so the simulation does not jump forward by the whole hidden duration.
- Reduced-motion initialization freezes ambient time and disables camera damping; explicit Resume intentionally overrides it. New reduced-motion preference changes pause the application again.
- Filter and route changes update the scene's visible-node and route-edge sets. Partially filtered routes are labeled, and tracing a route reveals its entities.
- Unresolved route questions clear old routes; manual endpoint changes clear old question narratives. Same-entity routes are explicitly distinguished.
- Entity, journey, and route navigation focuses the inspector heading when scrolling there. Entity/edge changes reset only the inspector's internal scroll position.
- The renderer's stable label buttons and the DOM entity index provide keyboard selection. Existing data/source/route semantics were preserved.
- Source and evidence strings use text content or escaping. The reviewed modules do not transmit inputs or call an AI service.

The current test run passes 11 tests: five graph/source/search/routing checks and six newly added Living Hologram motion/utility checks. They do not exercise the existing atlas renderer's WebGL context loss, partial initialization cleanup, shader pause continuity, or visible-frame sampling.
