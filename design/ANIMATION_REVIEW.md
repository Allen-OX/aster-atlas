# Attribute-driven animation review

October 3, 2026. Scope: public Aster Atlas's existing records, the main constellation, the separate Cartesian hologram, and their shared motion controls. This review does not change biomedical data or verify new clinical claims.

## Meaning of motion

Entity type, number of cited sources, and graph degree may choose a deterministic decorative pattern. These attributes do not measure severity, confidence, research activity, treatment benefit, or biological speed. Moving connection pulses must not imply causation, live data transfer, or biological flow. The records remain the existing cited snapshot; real-time behavior describes rendering and interaction rather than a live biomedical feed.

The main constellation can rotate its abstract sculptures. The Living Hologram retains its stricter contract: camera, cubes, and attached panels keep identity orientation; only declared translation, scale, material, and particle changes are allowed.

## Acceptance checks

| Area | Required observation |
| --- | --- |
| All entities animate | With no pointer or keyboard focus, sample every visible entity twice. Each has a bounded changing decorative state when running. Selection is not a prerequisite. Hidden entities remain absent. |
| Attribute correspondence | Each recorded animation profile identifies its input type/source count/connection count and explicit decorative parameters. Counts match the existing graph; no new source or edge is fabricated. |
| Pause | At rest with no new input, two samples while paused have identical animation phase, ambient offsets, material modulation, particles, and edge-pulse position. Pause must not jump every object back to an arbitrary baseline. Manual selection remains usable. |
| Resume | Resume advances from the frozen phase. Time spent paused, offscreen, in a background tab, or suspended behind the expanded hologram does not become a catch-up jump. |
| Speed | Changing the multiplier preserves the current pose/phase and changes future advancement only. An accumulated phase updated by elapsed time × speed provides this behavior; multiplying all historical time by a new speed does not. |
| Shared controls | Global pause/resume and speed reach both renderers, including late initialization and context recovery. Local buttons reflect the actual applicable state; mixed local pause states are represented truthfully. |
| Reduced motion | Preference on load and a preference change stop continuous effects in both scenes. Explicit user resume is distinguishable. Controls and source navigation work while motion is stopped. |
| Cartesian invariants | Sample actual world quaternions while running, hovered, selected, expanded, and paused. Cube/panel/camera orientation remains identity. Newly animated objects with matrix auto-update disabled explicitly update their matrices. |
| Position continuity | Layer motion uses immutable bases. Repeated selection, hover, pause, and unfold cycles do not accumulate offsets. Labels and pick targets remain associated with the moving owner. |
| Relationship geometry | Any moving entity endpoints update their links; an edge pulse follows its actual curve. Inference remains visibly segmented, including during selection and route highlighting. |
| Scope and privacy | Source records, notes, inference labels, and identifiers remain unchanged. Pointer speed and animation state remain local. Rendering statistics distinguish decorative objects from data entities. |
| Responsiveness | Inspect desktop and narrow layouts, the expanded dialog, and both quality tiers. Record actual rendering observations separately; passing scalar tests is not a browser performance result. |

## Evidence status

The revised `app.js`, `living-hologram.js`, `object-motion.js`, and `atlas-scene.js` were independently inspected. Source review confirms:

- Both renderers advance a retained time value by elapsed time × animation rate, with no phase reset in the rate setter. Offscreen, suspended, background, and unavailable-context paths skip advancement.
- Global controls update both renderers. Late initialization receives current pause and speed values; local pause buttons update the global action label.
- Hologram ambient depth, spread, scan position, and source-light modulation use that retained time. Paused springs hold their current state unless an explicit interaction changes the target. Reduced motion applies targets immediately.
- Frozen cube matrices are explicitly updated after position/scale changes; no camera/cube/panel rotation was added. Source markers are attached to the lower front panel so they follow its separation.
- The main constellation animates all node bodies and type-specific parts. Node centers remain fixed, preserving static edge endpoints. Every edge has three moving decorative tracers. On inferred edges, tracer visibility uses the same fractional gap boundary as the sixteen separated line segments.
- Type sets a decorative profile; source counts set source indicators; connection count now affects bounded scan frequency. The main scene also uses source/connection counts for bounded amplitude/rate choices. UI copy identifies illustrative motion and excludes live clinical data.

Executed independently:

- The new object-motion test passed: all eight entities have finite bounded samples, small-step depth continuity, and deterministic frozen-time samples.
- An additional check matched source and connection counts against all eight actual graph records and verified that each nonzero degree changes its scan sample.
- Syntax checks passed for both renderers and the application adapter.
- The worktree diff for `data.js` and `logic.js` was empty when inspected.

Review findings corrected in source: pause snapping during a spring transition, connection count initially having no motion effect, and source indicators being hidden behind the separated lower panel. The hologram picking prism has been enlarged to 2.4 × 2.4 × 4.2, covering its declared separation envelope. On October 4, source inspection also confirmed the main scene's stable picking sphere was enlarged from radius 0.76 to 1.15 to cover expanded animated parts. No source-review finding remains open from this bounded animation audit.

## Browser evidence reported by the integration owner

The parent task performed the following checks and supplied the results; this reviewer did not independently drive the browser:

- All eight hologram animation samples changed between simulation times approximately 0.4108 and 1.1942. Reported Cartesian orientation error remained zero.
- Pausing preserved simulation time and all eight hologram animation samples exactly across observations.
- At 2× speed, all eight main-scene node diagnostics and all eight edge diagnostics changed after resume.
- Global pause preserved main-scene simulation time, node animation diagnostics, and edge animation diagnostics exactly across observations separated by seconds.
- At a 390 × 844 viewport, shared controls were visible. With reduced motion enabled, the global action read “Animate all” and both local controls offered resume.

These are bounded local-browser observations, not a cross-device benchmark or complete accessibility audit. Pointer-boundary testing after the final picking fix, exact speed-transition pose continuity in the browser, and longer performance measurements are not established by this record. Earlier rendering measurements do not establish the performance of this animation revision.

Final integration correction: main-scene stable picking radius increased from 0.76 to 1.15 scene units to cover the expanded disease envelope identified above. Syntax and whitespace checks passed after the patch.
