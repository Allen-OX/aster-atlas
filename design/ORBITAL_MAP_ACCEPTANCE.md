# Orbital map acceptance review

October 4, 2026. Bounded review of `world-map.js`, the new globe renderer, and the associated page controls. Browser QA belongs to the parent agent; results below distinguish source inspection, independently executed checks, and reported browser evidence.

## Truthful geographic scope

- The bundled Natural Earth 1:110m dataset contains **177 countries and map units**. Names and boundaries follow that source; the map is an overview rather than street-level mapping or an adjudication of disputed borders.
- No patient coordinates, disease prevalence, care sites, trial sites, threat feeds, or organizational assets were supplied by this change. Country selection is geographic context only. No geolocation request or private-data import is involved.
- Earth texture provenance is recorded in `assets/maps/EARTH_TEXTURES.md`: NASA Blue Marble day imagery from August 2004 and a historical cloud composite published in 2002. These are locally bundled archival visualization layers, not current weather or a live satellite feed. The asset owner verified the files and source records; this review does not independently repeat that download/licensing verification.
- Atmospheric glow, star fields, cloud rotation and interface ornaments are visual effects. They are not measurements, astronomical ephemerides, or a physical atmospheric simulation.

## Acceptance matrix

| Area | Required behavior | Current evidence |
| --- | --- | --- |
| Longitude/latitude | Consistent forward/inverse mapping; seam and polar coordinates remain finite. Texture, country outlines and selection use the same convention. | 63 independently executed coordinate/vector round trips passed. Source aligns sphere geometry to the documented Greenwich +Z, east +X, north +Y convention. Texture/outline appearance still requires browser inspection. |
| Country picking | Polygon interiors include their boundary policy consistently; holes exclude enclaves; separate components and antimeridian geography are considered. | 10 country cases, Lesotho hole exclusion, ocean rejection, invalid-latitude rejection and 3 synthetic antimeridian cases passed. |
| Selected country | Dropdown, search, geographic details, flat highlight and globe selection identify the same source feature. | Source inspection confirms an existing selection is reapplied after globe creation; an explicit flat-mode choice during loading is also preserved. |
| Modes and zoom | Globe and flat views retain separate transforms; displayed zoom and disabled +/- states describe the active mode. Hidden renderer stops drawing and hidden controls are not focusable. | Source uses mode-specific render/zoom callbacks and active toggling. Fixed hardcoded zoom ceiling to renderer's responsive maxZoom. Parent reports browser maximum 2.7× with + disabled. |
| Input | Pointer orbit/pan, zoom buttons, supported gestures, keyboard arrows/+/−/Home and native country selection reach equivalent geography. | Source contains both flat and globe keyboard handlers; Enter/Space selects the centered globe country. Double-click now selects and focuses a country. Parent confirms clearing selection restores the generic canvas keyboard label. Physical touch gestures were not executed by this reviewer. |
| Motion | Reduced-motion preference initializes motion paused; explicit resume is deliberate; global pause/speed compose with optional rotation. | Source forwards pause/rate, gates cloud time/auto-rotation, and suspends frames when inactive, offscreen, document-hidden or context-lost. No performance benchmark executed here. |
| Layers | Borders, clouds, grid and atmosphere toggles affect only the named visual layer and report matching pressed state. | Source maps named toggles to distinct render objects; clouds become visible only after texture load. Browser visual checks owned by parent. |
| Failure | Texture/WebGL failure keeps a readable flat map, country lookup and clear status; no false “live” or complete-coverage claims. | Wrapper catches failed globe creation and preserves flat map. Async texture-state callback now exposes a visible degraded-imagery note. Failure injection was not performed by this reviewer. |
| Lifetime | Disposal stops animation, releases renderer/control resources and handles pending initialization; mounting repeatedly does not multiply handlers. | Wrapper currently disposes the globe only; single mount/pagehide is its current use. Reusable remounts need listener cleanup. |

## Independent checks

Parsed the bundled GeoJSON and counted all 177 features. Inspected every ring segment for longitude jumps over 180 degrees and every polygon for holes. The only hole-bearing feature is South Africa; the only large longitude jump is Antarctica's `[180,-90]` to `[-180,-90]` closing polar boundary. These are concrete cases for globe picking, not proof of its correctness.

Executed the globe's exported pure helpers in Node with real local Three.js vector math; replaced the unused OrbitControls import with a stub solely to avoid its browser import-map dependency. No renderer was instantiated. Passed 63 vector/geographic round trips including both poles and ±180°, plus 10 selections: Lesotho, South Africa outside its hole, Russia on both sides of the dateline, Antarctica at three longitudes and the South Pole, Fiji, and inland Brazil. Additional checks excluded the South Africa hole, left open ocean unselected, rejected latitude 91°, and tested three points against a synthetic dateline-spanning polygon. An initial Russia fixture at −179°,65° was ocean in this coarse dataset; it was corrected to an inland point at −179°,67° rather than changing the implementation to force a country match.

The existing `design/WORLD_MAP_VERIFICATION.md` records earlier flat-map browser checks. Those earlier results do not establish globe behavior or performance. No browser or GPU check has been executed by this reviewer for this change.

## Parent-reported browser evidence

The parent reports successful Chrome verification of loaded textures and 177 features; direct pointer selection of Niger; ArrowRight plus Enter selection of Sudan; Australia focus; desktop maximum 2.7× with the zoom-in button disabled; and country selection retained through Globe/Flat switching. On mobile, Japan selection worked and the 375-pixel viewport had a matching 375-pixel document width.

One reported browser sample with clouds disabled measured 7 draw calls, 18,112 triangles, median frame interval 8.3 ms and p95 9.1 ms. These are measurements of that local sample, not a universal performance guarantee, sustained-load benchmark, or proof of physical simulation accuracy. This reviewer did not collect those browser measurements.

TypeSafe assessment: coordinate transforms, ring containment, country name matching and interaction state are deterministic. No semantic classification, Jev call, paid dependency, or data transfer is needed for these operations.

## Findings and closeout

1. The initialization selection race is fixed in source: the wrapper reapplies the current selected feature after globe creation. It also preserves an explicit flat-mode choice made during loading.
2. Reusable disposal needs listener cleanup beyond the globe instance. This is a documented lifecycle limit of the current once-per-page wrapper, not a claim that a remount scenario has been tested.
3. Globe maximum zoom now comes from the renderer's responsive bound; the earlier hardcoded 6× disabled-state mismatch is corrected.
4. The double-click behavior advertised in help is confirmed in source. Texture failures now produce a visible degraded-imagery message. Parent confirms the final cleared-selection canvas label correction is applied and syntax passes.

No open blocker remains from this bounded review. Reusable wrapper cleanup remains a documented lifecycle limit of the current single-mount page. Parent reports the in-app preview reloaded with Orbital Earth ready. No further audit or optional testing was performed after closeout.
