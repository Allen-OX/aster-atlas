# Real-time object studio verification

Date: 2026-10-04

## Implemented

- Six procedural instrument families with beveled housings, lenses, vents, fasteners, internal assemblies and identity-specific proportions. Actual component geometry participates in picking.
- Four separately visible structure groups; hover/zoom decomposition, double-click focus, manual 0–100% separation, reassembly and return to automatic behavior.
- Isolate a selected object and return to connected objects. Analytics explicitly describe filter results.
- Physically based materials, procedural surface finish, studio lighting, shadow rendering and High detail/Balanced quality choices.
- Saved per-object expansion and isolation fields validated in JavaScript and Python. Legacy views reset missing expansion/isolation/per-edge overrides.
- Nearby tracer apparent radius capped at 3.5 CSS pixels to prevent excessive occlusion during close inspection.
- Local static resources revalidate on subsequent loads to prevent stale graph snapshots.

## Verification evidence

- `node --test`: 36 tests passed.
- `python3 -m unittest universe_server_test.py`: 10 HTTP/backend tests passed using isolated test state.
- Specialist geometry validation: 30 builds across 10 entity types and three variants; finite geometry and all four structure groups populated.
- Browser: manual 100% separation, 0% reassembly, restore automatic behavior, isolation and return to graph.
- Browser: saved and loaded “Instrument study · expanded”; restored 100% separation and isolation.
- Browser: global flow pause and reverse; individual relationship pause and reverse; byte offset 8 displayed decimal 34 / hex 22 / bits 00100010.
- Browser: direct housing drag changed FRDA position from approximately [0, .35, -5.16] to [2.12, 2.95, -8.11]. Connected curves followed visually; pipeline geometry allocation count remained 24.
- Browser: 390px viewport had 375px document width; manual controls remained usable; no captured console errors.
- One visible Genes-universe diagnostic sample: 6 objects, 6 relationships, 52,576 rendered triangles, 223 draw calls, 180 frame intervals with median 8.3ms and p95 9.2ms. This is a local observation, not a hardware-independent performance guarantee.
- Independent review: hidden-layer picking, legacy state resets, and isolation analytics wording resolved.

## Data and limits

The current public snapshot contains 12 entities, 14 relationships and 5 sources. The Genes lens displays its six-object, six-edge subset. Instrument geometry is illustrative and is not a measured medical device, molecular structure or network asset. Circulation encodes local relationship records; it is not captured network traffic. No live telemetry connector, photogrammetry asset pipeline, ray tracing, or measured 1000x image-quality improvement is claimed. No private branding or infrastructure was imported.

The public dataset was updated by concurrent work; this visual pass preserved its content. The browser was reloaded without cache to verify the current snapshot.

TypeSafe/Jev assessment: geometry, transforms, bounded state validation and byte encoding are deterministic operations. No semantic decision dependency or external inference call was added.
