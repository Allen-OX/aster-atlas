# Realtime studio interaction review

October 4, 2026. Bounded independent review of the public Aster universe scene and controller during the detailed-object update. This document separates source review from executed tests and parent-reported browser results.

## Data and rendering boundaries

The inspected current public snapshot contains **12 entities, 14 relationships and 5 sources**, viewed through five derived universes. Earlier review documents describing eight entities refer to the earlier snapshot; they are not current coverage claims. This reviewer did not edit the biomedical data or independently re-research those records. Detailed mechanical forms are illustrative instruments assigned to entity types. Internal layers, moving parts, materials and pulses do not reveal measured biological structures, molecular mechanisms or physical infrastructure. Positions are presentation state. Relationship bytes remain the local UTF-8 encoding of known graph fields.

No connector, real-time evidence feed, packet capture, patient location or private organizational import is authorized or implemented by this change. “Realtime” describes local interactive rendering. Raster PBR materials and environmental reflections do not establish ray-traced photon transport or physical accuracy.

## Acceptance matrix

| Interaction | Bounded acceptance | Evidence status |
| --- | --- | --- |
| Hover and leave | Hover approaches a bounded decomposition target; leave returns toward the baseline without accumulating offsets. Explicit manual decomposition remains distinguishable. | Render code derives each part from frozen base + explosion vector + clock phase. Manual override takes precedence; Restore hover deletes it. Controller labels Automatic vs percentage held. |
| Zoom | Camera proximity changes decomposition coherently, without changing graph facts; focused object remains selectable through expanded parts. | Current source has bounded proximity target. Exact component raycasts now follow each visible expanded part. |
| Drag | Only the intended node moves; every adjacent path/tracer endpoint updates; cancellation restores the starting position. | Source dirties adjacency and updates preallocated arrays, with Escape/cancel/blur recovery. No new browser drag test by this reviewer. |
| Global/per-edge pause | Global animation pause stops all clocks; global flow pause stops flows; per-edge pause stops only its edge. Direction changes preserve current phase. | Current source integrates independent signed per-edge clocks under global gates. |
| All layers hidden | Hidden sculpture parts cannot intercept clicks through empty volume. Keyboard controls can restore layers. | Fixed proxy removed. Hit acceptance walks ancestors and rejects hidden parts/objects. Base stand, halo and recovery labels remain visible; those bases are not component pick targets. |
| Keyboard selection | Stable entity labels/list buttons retain focus; explicit details are accessible without pointer hover. | Existing keyed list focus restoration remains present. New controls must retain equivalent keyboard operation. |
| Manual explosion/isolation | Manual values are bounded; isolation affects visible nodes, links, counts and controls consistently; restore clears isolation. | Range maps 0–100 to 0–1. Reassemble holds zero; Restore hover removes override. Isolation shows selected object and hides links, retaining list navigation. Analytics now explicitly reports matching filter results and states isolation affects the 3D view only. |
| Saved views | Reload replaces the intended presentation snapshot, including manual explosion, isolation and per-edge flow state. Optional fields absent from old views restore documented defaults. | Scene resets per-edge pause/direction, manual explosion and isolation before applying overrides. Controller saves new fields, validates on load, and refreshes manual controls. |
| Quality and materials | Any detail/quality selector changes actual rendering settings, stays responsive and reports truthful limitations. | High detail enables shadow maps and a higher bounded pixel ratio; Balanced disables shadows and caps pixel ratio at 1.25. Both use the same detailed geometry. Browser performance check remains with parent. |
| Reduced motion | Initial reduced-motion state does not animate; explicit resume is coherent; pausing does not jump existing springs unless the user changes their target. | Existing setter and spring hold behavior inspected in prior review; retest affected paths only after integration. |

## Current concrete findings

1. Fixed in source: `setView` clears old per-edge/manual/isolation overrides before restoration, including old snapshots where optional fields are absent.
2. Fixed in source: invisible proxy interception is removed; only visible actual components participate in node picking.
3. Detailed-model pick bounds are handled by component geometry itself. No fixed sphere bounds are used for the new forms.
4. Fixed in source: analytics now labels counts “Matching objects” and “Matching relationships,” with an explicit statement that counts describe search/filter results and isolation changes the 3D view only.

Independent execution: **12 model tests pass**, including the new scoped finite expansion/isolation test; **10 disposable HTTP server tests pass**. These tests cover state/data/auth contracts and do not establish GPU rendering or new manual-control usability. No new browser measurements have been executed by this reviewer for this update.

Syntax checks of the integrated scene and controller pass. Source inspection confirms keyboard-operable native range/buttons, retained keyed entity-list focus, manual-state save/load wiring, fallback disabling of the new renderer-only controls, and exact component visibility checks.

No open blocker remains from this bounded source/state review. Detailed visual quality, real pointer dragging, mobile layout, and renderer performance remain the parent's browser QA responsibilities; no unperformed checks are implied by this closeout.

The detailed-model author reports 30 type/variant builds measured with real Three.js geometry, finite positions and a maximum 5,636 triangles including instances. All four supplied layer groups were populated and each mesh tagged with entity/layer/illustrative metadata. These are author-reported structural checks, not this reviewer's browser or performance measurements.

TypeSafe assessment: picking, animation, graph filtering, scalar bounds and saved-view validation are deterministic. No bounded semantic judgment or external AI call is needed for this work.
