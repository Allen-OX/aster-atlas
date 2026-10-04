# Living Hologram verification — October 3, 2026

## Scope

Aster Atlas remains the public rare-disease evidence prototype for Hack-Nation. This revision uses only its existing eight entities, eight relationships, and four public sources. No private infrastructure, branding, credentials, or documents were imported. The fixed Cartesian orientation contract applies to the Living Hologram; the larger constellation retains its separate orbit controls.

## Executed checks

- All **11 Node tests pass**: five graph/source/routing tests and six mechanics tests. All three runtime files pass syntax checks.
- Browser rendered eight cubes with eight translating structural layers per cube. High tier reported **8,192 points, 10,226 triangles, 211 draw calls** in the expanded view. These counts describe illustrative geometry, not additional research records.
- Measured camera quaternion `[0,0,0,1]`; all eight cube world quaternions were identity; maximum panel identity error was **0** after unfolding. Raw measurements are in `hologram-browser-stats.json`.
- Toolbar and central emblem both toggle unfolding and keep their pressed states synchronized. Pause freezes ambient animation; selection remains available.
- Expanded selection of FXN closed the native dialog and focused the FXN evidence heading. At a **390 × 844 CSS viewport**, selecting A-T similarly opened Ataxia-telangiectasia. Return/Escape use the same close lifecycle.
- Mobile testing exposed a stale IntersectionObserver state when a below-fold module moved into the native modal. An explicit modal visibility override corrected the blank canvas. Retest visibly rendered all eight objects.
- Emulated reduced-motion preference on reload produced **Resume** and **Resume motion** controls, confirming both views start paused.
- `?no3d=1` showed visible fallback explanations, disabled rendering controls, and retained all evidence, sources, and the four-link cited route.
- Main scene context-loss testing froze frame/sample counts for eight seconds, then recovered through restoring → ready. Partial factory failure removed every label/listener and disconnected the observer. A deliberately injected 1.2-second visible stall remained in the measurements. See `RUNTIME_AUDIT.md`.

## Exact-red verification

`hologram-red-lossless.png` was captured through Chrome's lossless PNG capture. Its embedded profile is **Display P3 Gamut with sRGB Transfer**. The opaque emblem interior appears as RGB `(234,51,35)` in that encoded profile. Converting the embedded profile to sRGB using LittleCMS yielded **3,824 interior pixels exactly `(255,0,0)`**. Edge antialiasing is excluded. Earlier ordinary browser screenshots were JPEG compressed and are not used to establish exact color.

The shader is unlit and excludes tone mapping; the neutral metal lighting does not illuminate or tint the emblem. This measurement applies to the captured active state and display conversion, not every antialiased edge pixel or every possible monitor.

## Performance and remaining work

The initial expanded high-tier rolling 180-frame sample measured median **24.9 ms**, p95 **50.1 ms**. It did **not** meet the proposed 33.3 ms p95 target. The primary constellation now suspends while obscured by the modal. Further layout-loop optimization is recorded below after measurement. These short local windows are not a 30-second multi-device benchmark or an interaction-latency measurement.

**Not implemented:** photon/path-traced illumination, physical volumetric subsurface scattering, non-Euclidean physics, XR, private infrastructure import, or a complete production digital twin. Rendering is WebGL2 raster PBR. The browser experience is a functional visual prototype; no zero-defect or universal-performance claim is made.

## Local behavior and AI

Pointer speed adjusts bounded spring damping locally. No pointer data is stored or sent anywhere. Geometry, exact filtering, and graph traversal need deterministic code; the TypeSafe skill and live index were reviewed, with no semantic inference dependency added. Source reasoning and a full sponsor-wide acceptance expansion remain separate from these visual mechanics.

### Final measurement and optimization result

The final loop caches label projections and size reads on resize, writes interaction classes only on state changes, freezes static object matrices, and skips settled spring integration. Fresh-page expanded high-tier measurement after this patch: **180 samples, median 25.0 ms, p95 66.6 ms**, 211 draw calls / 8,192 points. Identity camera and cube orientations remained unchanged; maximum panel error remained zero. Saved in `hologram-browser-stats-final.json`.

The rendering target remains **unmet** in this observed session. The optimization reduced redundant work but these measurements do not establish a frame-rate improvement. Before the final patch, light tier correctly lowered the point count to 2,048; a 100-frame sample had median 33.4 ms and p95 75.1 ms. Sampling windows had different browser workloads and are not a controlled tier comparison. No universal speed claim follows.

Escape was separately exercised in the optimized build: it closed the dialog and restored the module. Temporary viewport and reduced-motion emulation were reset. Final Node run: 11/11 passing; whitespace diff checks clean.
