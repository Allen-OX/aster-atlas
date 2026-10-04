# Aster Atlas redesign acceptance

Prepared 2026-10-03 from the existing `data.js`, `logic.js`, `README.md`, and `../HACK_NATION_PROJECT_SCOPE.md`. This is a visual and interaction review. It does not independently revalidate biomedical sources or change biomedical records.

## Selected challenge

The saved project is **Aster Atlas**, aligned with **05 — Buffalo Initiative × OpenAI: AI Atlas for the World's Rare Diseases**. The local scope record attributes this choice to signed-in HackOS. Its challenge overview calls for an evidence-backed graph connecting diseases, genes, symptoms, studies, and patient groups, with useful research-navigation steps for families and researchers. The detailed challenge PDF was unavailable during that scope check; this redesign does not establish complete submission compliance.

The redesign should make the existing evidence easier to explore and verify. Cinematic presentation must serve that task. The separate cybersecurity workspace's fictional organizations, packet simulations, and 20-scenario results are not rare-disease challenge evidence and must not appear as atlas validation.

## Preserve these graph facts

| Property | Existing value that must remain truthful |
| --- | --- |
| Scope | Two example conditions, eight entities, eight connections, four public source records. No broad rare-disease coverage claim. |
| Entity classes | Two diseases, two genes, two phenotypes, one study, one community organization. |
| Connections | Five labeled documented relationships, one registry relationship, one organization resource relationship, one explicit cross-source inference. |
| Inference | The FRDA–A-T edge describes a shared ataxia phenotype and cites both clinical references. It does not infer shared treatment. |
| Sources | Existing GeneReviews/NCBI, ClinicalTrials.gov, and FARA records; preserve each source's exact title, URL, publisher, and supplied update text. |
| Snapshot | The existing data module states `checkedAt = 2026-10-03`. Display it as the dataset's snapshot date, not a live freshness guarantee. |
| Routing | Existing deterministic weighted graph search: a cross-source inference costs four; other edges cost one. These are routing preferences, not clinical confidence values. |
| FXN → ATM route | `FXN → Friedreich ataxia → Ataxia → Ataxia-telangiectasia → ATM`; four cited documented relationships, two distinct source records. |
| Plain-language input | Existing parser recognizes known entity names and aliases. It is not a generative medical assistant. Unknown or one-entity inputs need a clear unsupported-query response. |
| Guided pathways | Family and researcher journeys navigate the same graph. They do not select treatment, determine study eligibility, or assess an individual. |

Graph coordinates are authored layout. Distance, node size, visual energy, motion, particle density, and route length do not measure genetic similarity, disease severity, causation, confidence, or treatment benefit. Traversal arrows indicate the route being viewed, not a new causal direction.

## Visual acceptance

- The graph is the visual center, with readable entity names and a persistent distinction between evidence and decorative effects. A reader must find the selected entity, relation, evidence type, and original source without decoding the visual metaphor.
- Use depth, translucent layers, controlled light, and unfolding geometry to reveal selection and hierarchy. Keep source text on stable, opaque-enough surfaces with readable contrast.
- Render the cross-source inference as a visibly different line pattern and label it in text. Preserve the distinction while selected, hovered, or part of a route; color alone is insufficient.
- Abstract helix, particle, atom-like, or geometric forms are decorative. A compact visible explanation should identify an illustrative evidence graph rather than molecular simulation or reconstructed biology.
- Selection and evidence must remain readable with motion disabled and at low rendering quality. Decorative brightness must not obscure labels, focus indicators, or citations.
- On narrow screens, prioritize graph controls and a usable inspector over simultaneous panels. At 200% browser zoom, all data and controls must remain reachable without clipping.

## Browser acceptance checklist

These checks require observation in the final browser build. They are not claimed as performed here.

| Check | Action | Expected result |
| --- | --- | --- |
| Load and scope | Open the initial view at desktop and mobile sizes. | Correct counts, recognizable entity classes, selected entity, graph controls, and source access appear without console errors. |
| All entity selections | Select every node in the scene and its text index alternative. | Both routes select the same entity and show its unchanged summary, detail, relationships, and citations. |
| Evidence selection | Open a documented edge, the study edge, the community edge, and FRDA–A-T. | Relation labels and evidence types match `data.js`; the inference explicitly shows both sources and its limitation. |
| Route correctness | Ask “How is FXN connected to ATM?” and use the route selectors for the same pair. | Both yield the same five-node route above. Only its four edges highlight, and source count is two. |
| Unsupported input | Ask “What is FXN?” and an unknown question. | A clear unsupported-query message appears; no answer or new biomedical edge is invented. A stale previous route must not be presented as the new answer. |
| Search and filters | Try `frataxin`, `heart`, `natural history`, an unmatched string, and every type filter. | Results match existing deterministic search; empty results are explicit. Filter state uses text or pressed state, not color alone. |
| Pathway switch | Activate all family and researcher cards. | Each opens the specified node or edge with unchanged evidence; any automatic scroll respects reduced motion. |
| Pointer detail | Hover, enter, leave, unfold, focus, and select repeatedly. | No stuck expansion, accumulating offsets, accidental adjacent selection, or flicker that prevents reading. |
| Layer controls | Separate, hide, restore, and reset available visual layers. | Hidden geometry cannot intercept picking; restoring layers returns to stable positions; visual layers do not create new evidence. |
| Camera and reset | Zoom or orbit to limits, resize, then reset the view. | Labels remain associated with the correct nodes; reset produces a predictable usable composition. |
| Keyboard | Use only Tab, Shift+Tab, Enter/Space, and available shortcuts. | Search, filters, all entities, routes, pathways, sources, and settings are reachable. Selection preserves or intentionally restores focus after DOM updates. No focus trap. |
| Reduced motion | Enable the preference before load and change it during the session. | Continuous decorative motion stops; selection, graph evidence, routes, and manual navigation remain fully available. No repeated animation-loop accumulation. |
| Performance | Observe default and reduced-quality views while changing selection and routes. | Controls remain responsive. Record actual viewport, hardware/browser, quality, sample duration, frame intervals, and stalls before claiming a performance result. |
| Renderer failure | Disable WebGL or trigger the supported fallback. | Text search, evidence, routes, and source links remain usable. The page explains the unavailable visual view without claiming the graph data failed. |
| Privacy | Inspect browser requests while typing, routing, selecting, and moving the pointer. | No query or pointer telemetry leaves the application. Opening an external source is a separate user-initiated navigation. |

## Privacy and TypeSafe assessment

This presentation consumes existing public-source records and performs deterministic retrieval. Pointer position and speed may affect local visual response, but must not be persisted, uploaded, or described as biometric or diagnostic signals. The interface should not ask for patient records or invite sensitive personal details to answer a two-entity route query.

The global TypeSafe preference applies. For this redesign, graph selection, geometry, exact source lookup, known-alias parsing, and weighted path search are deterministic presentation operations; adding an AI judgment is unnecessary. The parent task is checking the skill and live documentation. A future bounded Choice for entity routing or Noul for relationship support is a separate feature requiring suitable authorization, explicit uncertainty handling, representative validation, and preservation of source provenance. No AI capability is implied by the current visual effects.

## Evidence status

- Existing graph/retrieval tests were run before the visual integration: **5 tests passed**. They check source references, aliases, phenotype-preserving paths, unknown entities, and deterministic two-entity parsing.
- The module contents and local challenge scope were inspected; biomedical source pages were not independently re-reviewed for this visual task.
- Final scene integration, browser behavior, accessibility, privacy requests, and performance remain **pending browser QA** by the parent task. Passing the five logic tests is not evidence that those visual checks passed.
