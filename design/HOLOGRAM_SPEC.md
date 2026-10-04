# Cartesian hologram runtime: scope and acceptance

Prepared October 3, 2026. This specification covers a generic, local visual component. The integration owner has scoped its current use to public Aster Atlas records. It does not authorize importing private infrastructure, documents, identities, credentials, or project branding. Existing biomedical records and relationships are outside this component's ownership.

## Rendering contract

The requested presentation combines dense luminous detail, glasslike surfaces, fixed Cartesian cubes, red interaction accents, spring-driven separation, and local pointer pacing. These can be implemented as deterministic graphics. The words “photon,” “hologram,” and “non-Euclidean” must describe the visual metaphor unless the corresponding physical or mathematical implementation is demonstrated.

| Requested feature | Bounded interpretation | Claim boundary |
| --- | --- | --- |
| Maximum density | The highest tested quality tier that preserves readable labels and responsive controls on the observed device. Publish actual object, instance, point, triangle, pixel-ratio, and draw-call counts. | No infinite density, unlimited infrastructure, or universal frame-rate claim. Decorative instances are not records. |
| Ray-traced photon effects | Current baseline: raster lighting, material transmission, environment reflections, and luminous decorative points. A genuine tracing mode needs an explicit tracer and measured samples/bounces. | Raycasting used for picking is not ray-traced illumination. Animated bright points are not photon transport. |
| Subsurface scattering | A labeled visual approximation may use thickness-sensitive translucency or an explicit scattering shader. | Transmission, clearcoat, bloom, or emissive color alone does not establish volumetric scattering or a validated physical model. |
| Non-Euclidean appearance | Decorative warped fields, nested surfaces, and depth cues may provide the aesthetic while fixed cubes and text retain their Cartesian coordinates. | A conventional scene with warped decoration does not establish curved-space geometry, a non-Euclidean metric, or geodesic rendering. |
| Zero tilt | Camera looks straight down −Z with +Y up and identity orientation; cubes and attached panels retain identity rotation, including all parent transforms. Interaction changes position/scale only. | Inspect world orientation as well as local Euler angles. No orbit control, billboarding, CSS skew, or rotated ancestor may defeat this requirement. |
| Pure red hover | An opaque unlit interaction mark uses sRGB `#FF0000`, with tone mapping disabled. Preserve text/icon/pressed-state equivalents. | A red material input does not guarantee every lit, transparent, antialiased, or blended output pixel is exactly red. Screenshot verification must sample an interior opaque area. |
| Spring fission | Reversible component separation around immutable base positions using bounded spring integration. Pointer leave returns to rest unless the user explicitly pins/unfolds a selection. | Geometry splitting is an interface operation. It does not mean biological, molecular, or nuclear fission. |
| Local cursor pacing | Smoothed pointer speed may adjust bounded decorative timing. Idle input decays to a baseline, and pause/reduced-motion settings take priority. | No inferred emotion, intent, identity, health, attention, or biometric assessment. No persistence or upload. |

## What the official sources support

- **Physical materials:** Three's `MeshPhysicalMaterial` documents transmission, thickness, attenuation, dispersion, clearcoat, and other PBR parameters. These add per-pixel cost; an environment map is recommended. Transmission should use material opacity 1. This supports glasslike shading, but is not evidence of an installed photon tracer. [Three material documentation](https://threejs.org/docs/pages/MeshPhysicalMaterial.html)
- **Scattering approximation:** Three's separate `SubsurfaceScatteringShader` addon is explicitly based on an approximation to translucency. If used, describe it as approximate subsurface shading. It is not automatically enabled by choosing a physical material. [Three scattering addon](https://threejs.org/docs/pages/module-SubsurfaceScatteringShader.html)
- **Color:** Three performs lighting in Linear-sRGB and normally presents canvas output in sRGB. Hex/CSS color inputs are converted when color management is enabled. Custom shaders need their own output conversion. Exact red acceptance must inspect both the material contract and final rendering, with tone mapping and blending accounted for. [Three color management](https://threejs.org/manual/pages/color-management.html)
- **WebGPU migration:** `WebGPURenderer` can fall back to WebGL 2. Existing `ShaderMaterial`, `RawShaderMaterial`, and `onBeforeCompile` customizations are not supported by that renderer; custom effects require migration. Selecting WebGPU does not automatically select a path tracer. [Three renderer guide](https://threejs.org/manual/pages/webgpurenderer)
- **Actual tracing is a separate implementation:** The author's current `three-gpu-pathtracer` repository demonstrates a `WebGPUPathTracer` using BVH acceleration and compute shaders, with explicit `renderSample()` calls and renderer setup. Its current main branch requires WebGPU. It is a research reference, not a dependency installed by this task. Any future adoption needs a pinned compatible version, real capability checks, convergence/reset behavior during motion, and a working raster fallback. [Path tracer source and usage](https://github.com/gkjohnson/three-gpu-pathtracer)
- **API capabilities are not a rendering guarantee:** The WebGPU API reference exposes rendering and compute primitives. Renderer support, device availability, and measured tracing behavior must be checked independently; no hardware-accelerated ray-tracing claim follows from `navigator.gpu` alone. [GPU for the Web API reference](https://gpuweb.github.io/types/)

The local vendored Three core declares revision **186**. Documentation above was checked on the preparation date. No new dependency, credential, remote render service, or paid API call is required by this specification.

## Acceptance matrix

These are proposed gates, not completed results. Numerical tolerances below are engineering acceptance targets, not measurements already achieved.

| Check | Procedure | Pass condition / evidence |
| --- | --- | --- |
| Fixed axes | Inspect camera, every cube/panel, and parent world quaternions before, during, and after hover, selection, resize, zoom, and unfolding. | Camera and cube/panel world orientations remain identity within 1e−6; screen verticals and horizontals remain aligned. Decorative geometry may have its own declared transforms. |
| Z approach | Hover, focus, select, leave, and clear an item. | Approach is bounded along Z; identity and evidence do not change. X/Y movement only occurs for explicitly defined Cartesian decomposition/layout. |
| Spring stability | Exercise 100 enter/leave cycles with 1/120, 1/60, and 1/30-second steps and an injected long-frame gap. | Finite state, bounded overshoot, no cumulative offsets; after two seconds at rest, position error and velocity are each below 0.001. Reduced motion snaps to target. |
| Fission linkage | Separate components and restore repeatedly. | Components remain attached to their owner; links follow their true endpoints; hidden geometry cannot intercept input; no additional data entities appear. |
| Red state | Hover and keyboard-focus each item; inspect its dedicated interaction material and an opaque interior rendered sample. | Material is `0xff0000`, unlit, opaque, and not tone mapped. Interior output is RGB 255,0,0, allowing only explicitly documented readback/color-conversion tolerance; edge antialiasing is excluded. |
| Density controls | Record every quality tier and switch repeatedly. | Counts are finite and bounded; lower tiers preserve all actual data and navigation; only decorative density/resolution changes. No retained resource growth after tier changes. |
| Performance | After warmup, record a 30-second selection/unfold/resize trace per tier on the actual browser/device. | Proposed interaction target: p95 frame interval ≤33.3 ms, input feedback ≤100 ms, no repeated stalls over 100 ms. Record viewport, DPR, samples, median/p95, counts, and failures. Do not generalize a desktop result to mobile hardware. |
| Cursor pacing | Replay slow, fast, idle, pointer-leave, cancel, touch, and keyboard-only input. | Speed is finite and capped, idle decays, no jitter loop or runaway acceleration; semantic content is invariant. Keyboard/touch users can reach every feature without simulated pointer behavior. |
| Pause and reduced motion | Toggle each before load and while moving; background and restore the tab. | Continuous decorative animation pauses; data navigation remains available; no accumulated time jump. Explicit resume is distinguishable from system preference. |
| Scoped labels | Mount two components, filter/resize/scroll each, then dispose one. | Selection/focus and event handlers stay within their owner; visible buttons remain reachable and correspond to the correct item; disposal leaves the other component intact. |
| Fallback and recovery | Deny renderer initialization and simulate context loss when supported. | A visible text/control alternative explains visual unavailability and preserves data actions. A successful initialization fallback test is not a complete driver-failure test. |
| Privacy | Inspect imports, request traffic, storage, and event lifecycle while interacting. | Generic fixture only; no private project imports; no pointer/query upload or storage; external navigation occurs only on an explicit source action. Dispose removes listeners, observers, frame callbacks, and owned GPU resources. |
| Presentation clarity | Inspect desktop, narrow viewport, 200% zoom, keyboard, and reduced motion. | Dense decoration does not cover text, focus, controls, or sources. A visible description identifies simulated/illustrative effects. |

## Implementation and evidence status

At initial research review, the existing `atlas-scene.js` uses `WebGLRenderer`, PBR lighting, PMREM environment reflections, and decorative points. It is the earlier orbitable Aster scene, not proof that the new fixed-axis requirements have been delivered. Its prior browser measurements in `VERIFICATION.md` apply only to that scene and build.

The scene owner is developing separate generic files `living-hologram.js`, `hologram-math.js`, and `hologram-math.test.js`. The math module has now been independently inspected and its **six tests pass**: closed-form spring agreement across frame rates and damping regimes, repeated enter/leave stability, long delays, bounded pointer speed, immutable Cartesian bases, and bounded statistical summaries. An additional independent 100-cycle test with a 0.1-second gap and two seconds at rest passed at 30, 60, and 120 Hz; final position and velocity were both zero. This validates the scalar mechanics, not browser interaction or rendering.

The new renderer module has been inspected without running a browser. Its imports are local Three and the deterministic math module; it receives generic IDs/labels and contains no project-data import, storage API, or network request. Aster's adapter passes its existing eight public records. These observations concern the inspected files, not a browser-wide network audit.

| New component requirement | Inspected implementation | Verification status |
| --- | --- | --- |
| Fixed cubes/camera | Identity camera orientation, fixed Cartesian layout, positional layer changes, actual world-quaternion diagnostics. | Present in source; browser/world-state observation pending. |
| Red interaction marks | Opaque unlit red material with no blending, fog, or tone mapping; stats expose actual material properties. | Present in source; final pixel sampling pending. |
| Spring separation | Closed-form scalar springs; immutable base/axis arrays; bounded lift and separation. | Math checks passed; visual hover/cancel/focus checks pending. |
| Density tiers | Maximum eight items; 1,024 decorative points/item at high, 256 at low; DPR caps 1.5/1.0. Changes use draw range rather than replacing geometry. | Bounded in source; no new performance result claimed. |
| Cursor pacing | Prior point and speed retained in memory; smoothing, speed cap, idle decay; reset on leave/cancel/visibility transitions. | Present in source; browser event/traffic checks pending. |
| Public integration | Separate panel synchronizes entity selection; expand/return uses a native modal; evidence remains the existing atlas data. | Inspected during concurrent implementation; browser acceptance pending. |
| Photon tracing / physical SSS / non-Euclidean physics | No tracer, physical scattering solver, or non-Euclidean metric in the inspected component. | **Not implemented.** Current cube shading is raster `MeshStandardMaterial`; points and emblem shaders are decorative. |

Independent review identified component callback/schema synchronization, compact center-hit-target overlap, initialization fallback layout/readiness, and restoration of generated environment textures. The corrected source was re-read: status enums and unfold callbacks now match the adapter; labels stack above a projected center hit area; fallback fills the stage and disables unavailable 3D controls; context restoration regenerates the reflection environment before reporting ready. Expanded-view selection closes the modal before revealing evidence. The final component and adapter pass syntax checks. No additional blocking source issue was identified in that bounded review. Browser tests must still exercise these paths on the final build before they can be reported as passed.

Context restoration needs special care: generated reflection textures must be regenerated after the context returns; restoring a JavaScript reference is insufficient. Prior WebGL resources are invalid following context restoration. [Khronos WebGL specification](https://registry.khronos.org/webgl/specs/latest/1.0/)

**Cannot claim from this work:** ray-traced photons, physical volumetric SSS, non-Euclidean spacetime, biomedical simulation, unlimited density, complete infrastructure import, production-scale performance, universal device support, or perfection. Each stronger claim would require its own implementation and evidence.

## TypeSafe assessment

The global TypeSafe skill and live documentation index were reviewed. This generic runtime needs exact geometry, deterministic timing, bounded arithmetic, input handling, and rendering diagnostics; no semantic judgment is required. Local cursor pacing remains ordinary code. A future bounded Choice/Score/Noul for content routing or evidence assessment would be a separate feature with authorized data, representative validation, and explicit uncertainty. This component adds no Jev calls or model dependency. [TypeSafe live index](https://docs.typesafe.ai/llms.txt)

## Subsequent integrated browser results

Root completed desktop/mobile, exact-red color-profile, dialog-selection/Escape, reduced-motion, fallback, and main-scene recovery checks after this independent source review. See `HOLOGRAM_VERIFICATION.md` for the authoritative executed results. The proposed p95 performance gate remains unmet; no blanket acceptance or perfection claim is made.
