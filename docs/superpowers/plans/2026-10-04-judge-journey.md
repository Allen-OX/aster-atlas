# Judge Journey Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Aster Atlas lead with a complete, evidence-backed FRDA patient-organization journey that directly answers every sponsor judging criterion.

**Architecture:** Extend the existing reviewed static graph with claim-level metadata and a separately validated `caseStudy` object. A pure `judge-journey.js` module validates evidence and computes the disclosed coordination hypothesis; `app.js` renders its safe output into a new first-screen journey while preserving the existing atlas.

**Tech Stack:** Static HTML/CSS/JavaScript, Node test runner, Python local server, vendored Three.js.

**Spec:** `docs/ASTER_ATLAS_JUDGE_SPEC.md`

## Global Constraints

- No diagnosis, treatment, personal-risk, or study-eligibility conclusions.
- No new dependency, credential, paid API call, or hidden external data transfer.
- Every biomedical relationship and action rationale names a public source.
- OpenAI usage is described precisely as build-time Codex-assisted extraction and implementation, not live inference.
- Preserve the user's existing uncommitted visual, server, and universe work.

## Review Focus

- Missing or malformed source metadata must fail validation instead of rendering trusted evidence.
- A phenotype-only comparison must never become the recommended opportunity.
- Unknown graph questions must clear the prior route and state what evidence is missing.
- Invalid or exaggerated timeline inputs must not produce a 10x claim.
- The journey must remain usable when WebGL is disabled and on a narrow viewport.

---

### Task 1: Evidence-rich graph and case-study contract

**Files:**
- Create: `judge-journey.js`
- Create: `judge-journey.test.js`
- Modify: `data.js`
- Modify: `logic.js`
- Modify: `logic.test.js`

**Interfaces:**
- Produces: `caseStudy`, `openAiExtractionRecords`, `validateCaseStudy(study, graph)`, `calculateAcceleration(baselineWeeks, assistedWeeks)`, and the new public graph records.
- Consumes: existing `nodes`, `edges`, `sources`, `byId`, and `sourceById` exports.

- [ ] Write failing tests for required entity types, edge claim metadata, the rejected A-T comparison, source-bound action, reviewed Codex extraction records, and exact 10x calculation.
- [ ] Run `node --test judge-journey.test.js logic.test.js`.
Expected: FAIL because the case-study module and new records do not exist.
- [ ] Implement the minimal data and validation functions.
- [ ] Run `node --test judge-journey.test.js logic.test.js`.
Expected: PASS.
- [ ] Commit only Task 1 files with `feat: add evidence-backed judge journey model`.

### Task 2: Judge-first patient action experience

**Files:**
- Modify: `index.html`
- Modify: `app.js`
- Modify: `styles.css`
- Create: `judge-journey-markup.test.js`

**Interfaces:**
- Consumes: Task 1 `caseStudy`, `openAiExtractionRecords`, `calculateAcceleration`, and graph IDs.
- Produces: `#patient-journey`, `#journey-action`, `#journey-evidence`, `#journey-uncertainty`, and `#journey-impact` rendered sections.

- [ ] Write a failing DOM-contract test that parses `index.html` and asserts the judge-first structure and accessible labels.
- [ ] Run `node --test judge-journey-markup.test.js`.
Expected: FAIL because the journey surface is absent.
- [ ] Add the static structure, render reviewed case-study content, wire evidence-node controls, and make the journey precede the atlas.
- [ ] Run `node --test judge-journey-markup.test.js`.
Expected: PASS.
- [ ] Commit only Task 2 files with `feat: lead with patient action journey`.

### Task 3: Documentation and submission truthfulness

**Files:**
- Modify: `README.md`
- Modify: `universe-scopes.json`
- Modify: `universe-model.test.js`
- Create: `data/openai-codex-extraction.json`

**Interfaces:**
- Consumes: Task 1 graph and extraction records.
- Produces: reproducible evidence notes and an updated server scope artifact.

- [ ] Write failing tests that require the scope artifact to match the expanded graph and the extraction artifact to match reviewed records.
- [ ] Run `node --test universe-model.test.js judge-journey.test.js`.
Expected: FAIL because the scope and extraction artifacts are stale or absent.
- [ ] Update the artifacts and README with exact source, OpenAI, safety, and 10x-hypothesis boundaries.
- [ ] Run `node --test universe-model.test.js judge-journey.test.js`.
Expected: PASS.
- [ ] Commit only Task 3 files with `docs: document reviewed evidence pipeline`.

### Task 4: Whole-product verification and review

**Files:**
- Modify only if a verified defect is found.

**Interfaces:**
- Consumes: all prior tasks.
- Produces: verified desktop/mobile/fallback product and review record.

- [ ] Run `npm test`.
Expected: PASS with zero failures.
- [ ] Run `python3 -m unittest -v universe_server_test.py`.
Expected: PASS with zero failures.
- [ ] Start the local server and inspect desktop, mobile, and `?no3d=1`; verify the patient journey, evidence links, action, uncertainty, impact hypothesis, and no console errors.
Expected: All required content is visible and usable.
- [ ] Run a fresh whole-branch review against the spec; fix Critical or Important findings with RED-GREEN tests, then rerun both suites.
Expected: No unresolved Critical or Important findings.
- [ ] Commit verified fixes, if any, with `fix: close judge journey review findings`.
