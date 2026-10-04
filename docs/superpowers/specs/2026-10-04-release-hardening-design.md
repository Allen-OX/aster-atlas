# Aster Atlas 10/10 Release-Hardening Design

**Date:** October 4, 2026
**Status:** Approved in-chat; written specification awaiting user review
**Scope:** Release-critical hardening of the existing Aster Atlas prototype

## 1. Outcome

Aster Atlas must become a defensible, judge-ready release whose implementation quality, product presentation, scientific integrity, usability evidence, and submission package can each be evaluated from observable evidence.

“10/10” means every controllable acceptance gate passes with retained proof. It does not mean guaranteed judging results. Gates that require an independent scientist, unfamiliar human testers, sponsor interpretation, public hosting, media upload, or portal confirmation remain open until those events genuinely occur. The product must never manufacture or imply those outcomes.

## 2. Users and primary journey

The primary evaluation user is a Hack Nation judge with roughly one minute to understand the product. The judge should be able to:

1. identify the rare-disease coordination problem;
2. see one evidence-backed relationship and its limitation;
3. understand the proposed research opportunity;
4. inspect why the recommendation is bounded rather than clinical advice;
5. leave with one concrete next action and a truthful impact hypothesis.

The secondary users are patient-organization leaders, researchers, and scientific reviewers. Their views reuse the same evidence records and review states; the release does not maintain competing versions of scientific truth for different audiences.

## 3. Product strategy

The release uses a focused, data-first **Judge Mode** as its default experience. Existing 3D, globe, universe, and workspace experiences remain available as supporting demonstrations but cannot compete with or block the judge journey.

No new cinematic subsystem, disease expansion, social feature, or live clinical inference is part of this release. Effort goes to comprehension, traceability, failure handling, accessibility, reproducibility, and external-proof preparation.

## 4. Architecture

### 4.1 Release gate model

A single machine-readable release manifest records the exact build and the status of every gate:

- implementation tests;
- browser and accessibility checks;
- scientific claim audit;
- independent expert review;
- unfamiliar-user study;
- public repository and deployed URL;
- media parity and duration;
- HackOS and organizer-form confirmations.

Each gate has one of four states: `pass`, `fail`, `pending-external`, or `not-run`. Only evidence-backed checks may set `pass`. A gate cannot pass from prose, a missing artifact, or an operator assertion without the required proof field.

The manifest separates deterministic implementation checks from external events. The UI may summarize it, but product runtime behavior does not depend on portal access or reviewer availability.

### 4.2 Judge Mode

Judge Mode is a progressive five-step path:

1. **Problem:** fragmented rare-disease evidence delays coordination.
2. **Connection:** FRDA/FXN and ISCU-related evidence share a bounded iron–sulfur mechanism context.
3. **Constraint:** tissue specificity and the model counterexample remain beside the supporting evidence.
4. **Opportunity:** request model-and-assay suitability review rather than claim transfer or treatment relevance.
5. **Action:** produce a source-linked access/suitability matrix and go/revise/no-go research decision.

The first screen contains the value proposition, primary action, current scientific-review status, and enough of the five-step path to establish direction. Decorative modules are visually subordinate and loaded after the core experience. The core path remains complete with WebGL disabled, reduced motion enabled, JavaScript rendering degraded, or an external source temporarily unavailable.

### 4.3 Evidence and scientific review

Every visible biomedical sentence is produced from an exact stored claim whose cited support resolves to a stored source passage or registry field. The release audit verifies:

- canonical entity identifiers and aliases;
- valid edge endpoints;
- source existence and public locator;
- exact supporting passage or field;
- evidence type and relationship status;
- limitation, contradiction, or non-transfer boundary;
- review state and review date;
- absence of clinical eligibility or treatment inference.

Independent review uses an exportable packet and structured decision record. Each reviewed claim receives `accept`, `revise`, or `reject`, reviewer role, date, and note. The product does not store a fabricated identity or silently convert a pending claim into an accepted claim. Rejected claims cannot drive a recommendation. Revised claims require a fresh audit before release.

The FACLR/FARA resource proposal remains a request for access and suitability review until the owner confirms access, terms, availability, and fit. That confirmation is separate from scientific claim review.

### 4.4 AI and TypeSafe boundary

Exact identifiers, graph validation, calculations, source presence, review-state transitions, and safety exclusions remain deterministic code.

Potential semantic judgments are centralized as optional, review-only question specifications:

- `Choice`: whether a cited passage supports, contradicts, or does not address one bounded claim;
- `Score`: strength of mechanism relevance, evidence strength, asset usefulness, and actionability using explicit ordered criteria;
- `Noul`: whether a proposed explanation makes an unsupported clinical or treatment implication.

No TypeSafe/Jev dependency, credential, paid call, or research-data transfer is added without separate authorization. If later authorized, model output remains advisory, confidence-gated, and unable to promote evidence without human review. Current deterministic behavior and offline Codex lineage remain fully functional without external AI services.

### 4.5 Release tooling

One release command produces a timestamped local audit directory containing:

- source commit and dirty-tree state;
- deterministic build fingerprint;
- test results;
- browser matrix results;
- accessibility and console results;
- source-link results;
- scientific-claim audit;
- privacy/secret scan summary;
- media metadata and build-parity record;
- final release manifest.

The command fails for implementation defects. It reports genuine external gates as `pending-external` rather than hiding them or returning a false all-clear.

The repository must reproduce from documented commands without unpublished local state. The local development server remains loopback-only and is not treated as a production deployment.

## 5. Interaction and visual design

### 5.1 Hierarchy

The reading order is value proposition → supported opportunity → limitation → next action → inspect evidence. One primary CTA appears at a time. Metrics never outrank the patient/research outcome.

The 10× coordination statement is always labeled as an illustrative, testable planning hypothesis: ten fragmented coordination weeks divided by one atlas-assisted week. It never appears as measured biological, clinical, or operational impact.

### 5.2 Language

Every specialist term receives plain-language context at first use. Action labels describe outcomes rather than interface mechanics. “Evidence-backed” means traceable to displayed sources; it does not mean independently approved unless the review record says so.

### 5.3 Accessibility

The core journey targets WCAG 2.1 AA behavior:

- complete keyboard operation with visible focus;
- semantic landmarks and headings;
- accessible names and state announcements;
- 44-by-44-pixel minimum primary touch targets;
- readable text at 200% zoom and 320 CSS pixels;
- no information conveyed only by color, motion, or 3D position;
- reduced-motion and no-WebGL parity;
- contrast verification for all core states;
- modal focus containment and reliable Escape behavior.

Automated checks support but do not replace manual keyboard, screen-reader smoke, zoom, and mobile interaction checks.

## 6. Usability evidence

A dedicated local test mode presents the final Judge Mode without coaching and records no personal identifiers. The moderator protocol asks five unfamiliar participants to answer:

1. What problem does Aster Atlas solve?
2. What opportunity did it identify?
3. What important uncertainty or limitation remains?
4. What should happen next?

For each participant, the retained record includes build fingerprint, viewport category, completion time, task outcome, help requested, wrong turns, and anonymized notes. The human-usability gate passes only when at least four of five participants complete the intended journey unassisted in under 60 seconds and correctly identify the limitation and next action. Any failed criterion produces a documented revision and fresh test round; earlier results do not validate a changed build.

## 7. Error handling and safety behavior

- Unknown search input clears stale recommendations and offers inspectable alternatives.
- Missing or deleted evidence suppresses the affected explanation and action.
- Contradictory evidence routes the candidate to review.
- Malformed graph data fails validation before rendering trusted content.
- External source failure preserves the stored citation metadata, reports the access problem, and never claims the source was reverified.
- WebGL or decorative-module failure leaves the Judge Mode usable.
- AI timeout, malformed output, low confidence, or no match cannot create or promote a trusted edge.
- Release checks redact potential secrets from output and never print credentials.

## 8. Testing strategy

### 8.1 Unit and schema tests

Maintain the current graph, route, claim, review, motion, and saved-state suites. Add tests for release-manifest state transitions, proof requirements, build fingerprint stability, scientific-review decisions, stale-result clearing, source-link classification, and media metadata validation.

### 8.2 Integration tests

Exercise the local HTTP service, security boundaries, static-file protections, judge route, no-3D route, source-dialog behavior, degraded external-source state, and reproducible release command. Existing authorization, CSRF, path traversal, body-limit, and state-isolation coverage remains mandatory.

### 8.3 Browser and accessibility tests

Verify desktop and mobile layouts, 200% zoom, 320-pixel reflow, keyboard-only completion, reduced motion, no-WebGL fallback, modal focus, primary touch targets, contrast, source opening, zero error-level console output, and page reload at every public route.

### 8.4 Release acceptance

The implementation gate requires:

- all automated tests passing;
- zero critical or important code-review findings;
- zero error-level console messages in the final demo path;
- zero uncited visible biomedical relationships;
- zero unsupported trusted recommendations;
- zero exposed secrets or private account data in the release tree and media;
- successful clean reproduction and deployed-build fingerprint match.

Test count alone is not the quality target. New tests must cover distinct risks and assert user-visible or safety-critical behavior.

## 9. Submission package

The release package contains:

- a public, reproducible repository with license and complete README;
- a judge-accessible HTTPS deployment;
- current team, product-demo, and technical-walkthrough videos, each no longer than 60 seconds;
- an accepted team image that satisfies the portal requirement;
- source and limitation documentation;
- exact OpenAI/Codex contribution disclosure;
- tested links and media;
- HackOS confirmation;
- organizer-form confirmation.

The videos must show the same build fingerprint as the deployed release. Scripts may be generated locally, but recordings, uploads, publication, terms acceptance, and final submission require the user’s external action or explicit authorization in the relevant authenticated service.

## 10. Acceptance matrix

| Dimension | Pass condition |
| --- | --- |
| Code and functionality | Full automated and browser matrix passes; clean review; reproducible release; no critical security, correctness, accessibility, or console failures. |
| Product design | Judge Mode communicates problem, evidence, limitation, opportunity, and action within the first minute on desktop and mobile; decorative experiences do not block it. |
| Scientific credibility | Every visible claim is traceable and bounded; a genuine qualified reviewer records decisions; resource owners separately confirm reuse/access facts where asserted. |
| Human usability | At least four of five unfamiliar participants complete the final-build journey unassisted in under 60 seconds and identify limitation plus next action. |
| Submission readiness | Public repository and deployment work from a clean browser; final media matches the build; required channels are completed and confirmation artifacts retained. |

## 11. Non-goals

- guaranteeing a competition result;
- claiming medical, clinical, diagnostic, or treatment guidance;
- simulating independent expert or participant approval;
- expanding to a comprehensive rare-disease dataset;
- adding live model inference merely to display an AI feature;
- replacing source owners, ethics review, experiments, or scientific collaboration;
- publishing or submitting through an authenticated account without explicit authority.

## 12. Completion definition

Implementation is complete when every controllable gate has passing, reproducible evidence and the remaining external gates have ready-to-use protocols, artifacts, and honest `pending-external` states. Overall release readiness becomes green only after the genuine external evidence and submission confirmations are attached to the exact final build.
