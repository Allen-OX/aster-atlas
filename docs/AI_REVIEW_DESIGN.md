# Deterministic evidence review and planned AI checks

Reviewed 2026-10-04 against the supplied Aster Atlas win-readiness specification. This module does not perform model calls, install an SDK, use credentials, transmit data, or claim an OpenAI extraction took place. It consumes structured records supplied by the research pipeline. A real OpenAI artifact and its truthful provenance must be supplied separately to satisfy the competition requirement.

## Public API

Import from `win-review.js`:

- `REVIEW_CONFIG`: frozen schema vocabularies, limits and four triage thresholds.
- `validateGraph(graph)`: `{valid, errors, warnings}`. Checks required node/edge fields, stable IDs, duplicate records, canonical collisions, endpoints, citations, source URL syntax, support coverage, review statuses and dates. Extra provenance/display fields are retained by callers; this validator does not mutate records.
- `createCanonicalResolver(nodes)`: `{valid, collisions, errors, resolve(query)}`. Resolves IDs, canonical names and synonyms after Unicode NFKC, whitespace and case normalization. Returns `matched`, `no-match`, `collision` or `invalid`, with `nodeId:null` on failure. A collided namespace is rejected as a whole. There is no fuzzy matching or semantic synonym inference.
- `gateExplanation(graph, sentences, {allowPendingExpert:false})`: `{visible,status,sentences,errors,pendingExpert}`. Sentences are `{text,edgeIds}`. Any failure clears the entire returned sentence array. Each text must exactly match a cited stored claim after surrounding whitespace is removed; every cited edge must exist and pass review/evidence/source gates. Appending uncited prose or attaching real citations to an invented paraphrase fails.
- `assessCandidate(candidate, graph)`: `{decision,reasons,dimensions,trusted:false,scope}`. Candidate shape: `{edgeIds,dimensions:{evidenceStrength,mechanisticRelevance,assetUsefulness,actionability},apiStatus?}`. Decision is `supported`, `review` or `reject`. Results never mutate or create an edge. `supported` means the preexisting reviewed records and supplied dimension annotations passed these triage rules; it is not a clinical judgment or automatic publication permission.
- `noSupportedRoute(options)`: builds a replacement no-route state with empty `recommendations`, `path` and `explanation`, and `selectedCandidateId:null`. Inputs preserve searched sources/types, considered candidates and their failure reasons, missing evidence and a useful next research question. UI code must replace prior result state and render these fields, rather than retain stale recommendation elements.

## Record contract

Required nodes: `id`, `canonicalName`, `synonyms` (array), `type`, `description`, nonempty `sourceIds`, `reviewStatus`, `lastChecked`.

Required edges: `id`, `from`, `to`, `relation`, `claim`, nonempty `sourceIds`, nonempty `support`, `evidenceStatus`, `evidenceType`, `strength`, `limitations`, `reviewStatus`, `lastChecked`.

Each support entry contains `sourceId` and a nonempty `passage` or `field`. Every named edge source must have support. Source records require `id`, `title` and an HTTP(S) `url`. Optional `text` enables an exact supporting-passage substring check; optional `fields` enables an exact structured-field-key check. A field locator without a supplied fields snapshot documents provenance but cannot prove its contents. A citation or exact quote alone cannot establish semantic entailment.

Dates are actual valid ISO calendar dates, `null`, or the literal `unknown`; missing fields and impossible dates fail. Unknown dates produce warnings and remain unknown. Sources marked `available:false` block explanations and send candidates to review. Otherwise available means included in this local snapshot: URL syntax validation is not a live HTTP availability check. Live source access remains an explicit release verification step.

Review statuses are `human-reviewed`, `expert-reviewed`, `pending-expert`, `source-checked-by-ai;expert-review-pending`, `pending`, and `rejected`. No status is upgraded by this code. Only the first two are approved. Pending-expert claims may be displayed with the explicit opt-in and the label **Pending expert review**; they remain review candidates. Unsupported and contradictory edges cannot be explanation evidence. Reviewed inference is labeled **Reviewed inference**, with its stored limitations returned alongside it.

## Candidate triage policy

| Dimension | Minimum for the supported branch | Interpretation |
| --- | ---: | --- |
| Evidence strength | 0.75 | Supplied review annotation of evidence quality |
| Mechanistic relevance | 0.60 | Supplied annotation of mechanism-level relevance |
| Asset usefulness | 0.50 | Supplied annotation of potential research reuse |
| Actionability | 0.50 | Supplied annotation of a concrete feasible next step |

All values must be finite numbers in `[0,1]`; booleans are rejected. Each dimension is checked independently so a strong asset score cannot cancel weak mechanistic support. These thresholds are prototype policy settings, not empirically calibrated probabilities, model confidence or medical certainty. They require domain review before reliance on automated recommendations.

Missing edges and unsupported/rejected evidence reject a candidate. Known contradictory edges between either orientation of a cited endpoint pair trigger review even if the candidate omits the counteredge. This conservative detection does not discover contradictions in natural language or between different node pairs. Missing/invalid/low dimensions, unavailable sources, inference, pending review and failed/malformed API status trigger review. API failure never adds a trusted edge. The graph, candidate and explanation inputs remain unchanged.

## Planned TypeSafe/Jev use — no integration activated

The global TypeSafe skill and current [documentation index](https://docs.typesafe.ai/llms.txt) were read. The closest [citation-check cookbook](https://docs.typesafe.ai/cookbooks/citation_check) separates exact quote-presence checks from a bounded semantic judgment about whether context supports, contradicts or does not address a claim. That decomposition fits this pipeline: keep IDs, source presence, exact spans and workflow rules in code; consider a future `Choice` question for citation support, `Score` dimensions for relevance, and an explicit no-match outcome for entity alignment.

Authorization for credentials, paid calls, dependencies and data transmission has not been supplied for this component. No SDK or mock live service is added. Before enabling any integration, verify the then-current API/model documentation, record question versions, validate on representative human-labeled biomedical examples, and calibrate review thresholds. Jev verification would supplement the separately required OpenAI contribution, not replace it. Model confidence must never become clinical certainty.

### Centralized optional question specifications

These specifications are review designs, not executable calls. Each question receives one candidate claim, its exact cited passage, source identity, stored limitation and relationship context. Question IDs are local version labels; they do not imply a current SDK contract.

| ID / primitive | Instruction | Criteria |
| --- | --- | --- |
| `citation-support-v1` / `Choice` | Decide how the cited passage relates to the bounded claim without using outside knowledge. | `supports`: the passage directly supports the claim as worded; `contradicts`: it provides a material counterexample or incompatible finding; `does-not-address`: it does neither; `insufficient-context`: the supplied excerpt cannot decide. |
| `evidence-strength-v1` / `Score` | Rate how directly the supplied source evidence establishes this exact claim. | `0 absent`, `1 indirect`, `2 bounded direct`, `3 independently corroborated`; each level must be defined with source/design requirements before use. |
| `mechanism-relevance-v1` / `Score` | Rate how specifically the evidence connects the candidate to the named mechanism. | `0 symptom-only`, `1 broad pathway`, `2 mechanism-specific`, `3 mechanism-specific with relevant experimental context`. |
| `asset-usefulness-v1` / `Score` | Rate how ready the named asset is for the proposed research-review step. | `0 no asset`, `1 named but unverified`, `2 owner/source documented with open fit questions`, `3 access and fit independently confirmed`. |
| `actionability-v1` / `Score` | Rate whether the candidate supports a concrete, bounded next research decision. | `0 no action`, `1 vague follow-up`, `2 named owner/question/output`, `3 owner-confirmed executable review step`. |
| `unsupported-clinical-implication-v1` / `Noul` | Evaluate whether the proposed explanation implies diagnosis, treatment, eligibility, individual prognosis or validated biological transfer beyond the supplied evidence. | Yes when any unsupported clinical or transfer implication is present; no only when the explanation stays within the research-coordination scope and states its limits. |

The four scores remain separate; code applies non-compensating safety rules and sends uncertainty to human review. Any future thresholds require labeled project data. A TypeSafe answer can propose a review disposition but cannot edit the graph, mark a human review complete, or set a release gate to `pass`.

## Verification and limits

`node --test win-review.test.js` covers required fields, unknown dates, exact synonyms, collisions, duplicate canonical records, missing endpoints/sources/support, invented passages, missing fields, complete multi-source coverage, deleted edges, rejected/unavailable evidence, uncited/overconfident prose, explicit pending labels, independent score thresholds, hidden counteredges, unsupported candidates, API failures and no-match state clearing.

Fixtures are synthetic assertions used to test software rules, not biomedical evidence. Passing the tests does not establish scientific validity, qualified expert review, clinical suitability, live source availability, competition eligibility, or completion of all P0 release gates. Every rendered statement still depends on accurate reviewed source records.

### Current research package integration

The additional integration test imports `win-evidence.js` and checks its complete graph with this independent validator. The FRDA–ISCU proposal remains **review**, with unset dimensions and an explicit model counterexample; the FRDA–A-T symptom bridge is **reject**. The stored mechanism claim can appear only with the pending-expert opt-in and visible pending label. Removing its edge blocks that explanation. The canonical synonym `FRDA` resolves to the stable `frda` identifier. The schema also accepts source-linked `action` and `milestone` node types for the proposed journey output.
