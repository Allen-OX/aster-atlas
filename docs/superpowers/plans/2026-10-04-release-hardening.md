# Aster Atlas Release-Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing Aster Atlas prototype into a reproducible judge-ready release with measurable implementation, design, scientific-review, usability, and submission gates.

**Architecture:** Keep the current static ES-module application and loopback Python service. Add pure JavaScript gate/review/usability modules, a zero-dependency Node release auditor, and a focused Judge Mode; external scientific, tester, deployment, and submission outcomes remain proof-gated rather than simulated.

**Tech Stack:** HTML5, CSS, browser ES modules, Node.js built-in test runner, Node standard library, Python `unittest`, vendored Three.js, native `<dialog>`, local JSON artifacts.

**Spec:** `docs/superpowers/specs/2026-10-04-release-hardening-design.md`

## Global Constraints

- Every visible biomedical statement must resolve to exact stored claim evidence and limitations.
- Review states are exactly `pass`, `fail`, `pending-external`, or `not-run`.
- Deterministic code owns identifiers, calculations, source presence, state transitions, and safety exclusions.
- No new runtime dependency, credential, paid API call, or research-data transfer.
- No expert approval, usability result, deployment, upload, sponsor eligibility, or submission confirmation may be fabricated.
- The Judge Mode must work without WebGL and with reduced motion enabled.
- The 10× statement remains an illustrative 10-week/1-week coordination hypothesis, never measured biological or clinical impact.
- The local development service remains bound to `127.0.0.1` and is not represented as production hosting.
- Preserve unrelated working-tree changes; stage only task-owned hunks or new files.

## Review Focus

- A forged or incomplete proof artifact must never turn an external gate to `pass`; Task 1 pins this in `release-gates.test.js`.
- A video or deployment from a different build fingerprint must fail media/build parity; Task 5 pins this in `release-audit.test.js`.
- Unknown or changed search input must clear every prior recommendation; Task 3 retains and extends the journey tests.
- At 320 CSS pixels, reduced motion and `?no3d=1`, the entire core journey must remain operable; Tasks 3 and 7 verify this.
- An unreachable external source must be reported as unavailable without erasing stored citation metadata or claiming reverification; Tasks 2 and 5 pin this.

---

### Task 1: Proof-gated release manifest

**Files:**
- Create: `release-gates.js`
- Create: `release-gates.test.js`
- Create: `release/release-evidence.json`
- Create: `release/README.md`

**Interfaces:**
- Produces: `GATE_STATES`, `validateReleaseManifest(manifest)`, `evaluateReleaseGate(gate)`, `summarizeRelease(manifest)`, and `buildReleaseManifest(input)`.
- `evaluateReleaseGate` returns `{ id, state, reasons, evidence }` without mutating input.
- `summarizeRelease` returns per-dimension states and `ready: true` only when every required gate is `pass`.

- [ ] **Step 1: Write failing manifest tests**

Cover the four legal states, duplicate IDs, missing dimensions, missing proof fields, unsupported states, immutable input, forged external pass, mixed-state dimension roll-up, and all-pass readiness.

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `node --test release-gates.test.js`
Expected: FAIL because `release-gates.js` does not exist.

- [ ] **Step 3: Implement the pure release-gate model**

Use signatures:

```js
validateReleaseManifest(manifest: object): { valid: boolean, errors: string[] }
evaluateReleaseGate(gate: object): { id: string, state: string, reasons: string[], evidence: object[] }
summarizeRelease(manifest: object): { ready: boolean, dimensions: object, totals: object }
buildReleaseManifest(input: object): object
```

An external `pass` requires at least one evidence record with nonempty `kind`, `path`, `recordedAt`, and `buildFingerprint`. A `pending-external` gate may contain preparation artifacts but no completion claim.

- [ ] **Step 4: Add the truthful baseline JSON and artifact contract**

Initialize controllable checks as `not-run` and genuine outside actions as `pending-external`. Document how evidence is attached without changing scientific or submission truth.

- [ ] **Step 5: Verify and commit Task 1**

Run: `node --test release-gates.test.js && npm test`
Expected: all tests pass. Commit only the four Task 1 paths with message `feat: add proof-gated release manifest`.

### Task 2: Scientific review and source-access validation

**Files:**
- Create: `scientific-review.js`
- Create: `scientific-review.test.js`
- Create: `scripts/export-scientific-review.mjs`
- Create: `release/scientific-review-template.json`
- Modify: `docs/EXPERT_REVIEW_PACKET.md`
- Modify: `docs/AI_REVIEW_DESIGN.md`

**Interfaces:**
- Consumes: `evidencePackage` from `win-evidence.js` and release-gate states from Task 1.
- Produces: `REVIEW_DECISIONS`, `validateScientificReviewRecord(record, graph)`, `assessScientificReviewCoverage(graph, records)`, `classifySourceCheck(result)`.
- `assessScientificReviewCoverage` returns `{ passed, accepted, revised, rejected, missingIds, invalidRecords }` and never alters the graph.

- [ ] **Step 1: Write failing scientific-review tests**

Assert exact edge coverage, valid `accept|revise|reject` decisions, reviewer-role/date/note requirements, duplicate/stale/unknown claim rejection, revised/rejected non-promotion, missing reviewer identity rejection, and unreachable-source classification that retains citation metadata.

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `node --test scientific-review.test.js`
Expected: FAIL because the review module does not exist.

- [ ] **Step 3: Implement review validation and source classification**

Use signatures:

```js
validateScientificReviewRecord(record: object, graph: object): { valid: boolean, errors: string[] }
assessScientificReviewCoverage(graph: object, records: object[]): object
classifySourceCheck(result: object): { status: 'reachable'|'unreachable'|'not-checked', checkedAt: string|null, detail: string }
```

Only complete accepted coverage can satisfy the scientific-review gate. Source reachability is independent of scientific acceptance.

- [ ] **Step 4: Generate a complete blank review template**

`scripts/export-scientific-review.mjs` must derive every claim ID and exact wording from `win-evidence.js`; blank decision/reviewer fields remain visibly incomplete. Synchronize the Markdown packet from the same graph so it cannot drift silently.

Centralize the optional TypeSafe review questions in `docs/AI_REVIEW_DESIGN.md`: one citation-support `Choice`, four separately defined `Score` questions, and one unsupported-clinical-implication `Noul`. Keep them as non-executing specifications until dependency, credential, cost, and data-transfer authorization exists.

- [ ] **Step 5: Verify and commit Task 2**

Run: `node scripts/export-scientific-review.mjs --check && node --test scientific-review.test.js win-review.test.js win-evidence.test.js`
Expected: generated artifacts match the graph and all tests pass. Commit only Task 2 hunks and files with message `feat: validate independent scientific review`.

### Task 3: Focused and accessible Judge Mode

**Files:**
- Modify: `index.html:10-27`
- Modify: `win-journey.js:1-54`
- Modify: `win-journey.css:1-11`
- Modify: `judge-journey-markup.test.js`
- Modify: `win-journey.test.js`
- Modify: `judge-journey.test.js`

**Interfaces:**
- Consumes: existing evidence/review modules and unchanged evidence IDs.
- Produces: a default five-step judge path with status, opportunity, limitation, action, and impact visible in a coherent reading order.
- Existing element IDs used by `app.js` remain stable unless tests and all call sites change together.

- [ ] **Step 1: Add failing markup and behavior tests**

Require a visible `Research proposal · expert review pending` status, plain-language first-use definitions, one primary CTA, explicit supported/limited/action summary, accessible step names, `aria-describedby` for the core claim, dialog semantics, and no duplicate primary landmark. Extend the stale-search test to assert action, path, result, and live status all clear together.

- [ ] **Step 2: Run journey tests and confirm the new assertions fail**

Run: `node --test judge-journey-markup.test.js win-journey.test.js judge-journey.test.js`
Expected: FAIL only on the newly specified Judge Mode contract.

- [ ] **Step 3: Restructure only the first-screen journey**

Keep the five existing evidence-backed steps. Add a compact three-part summary (`Connection`, `Important limit`, `Next action`), move scientific-review state beside the headline, and demote the atlas-expansion link below evidence inspection. Do not duplicate claim text outside `win-journey.js` data rendering.

- [ ] **Step 4: Complete keyboard, modal, and degraded-state behavior**

Preserve return focus, add cancel/Escape handling, prevent backdrop clicks from trapping focus, announce step changes, and keep all core controls at least 44×44 CSS pixels. At `max-width: 800px` and 320 CSS pixels, use a single column without horizontal overflow. Reduced motion and `?no3d=1` must not hide or disable the core journey.

- [ ] **Step 5: Verify and commit Task 3**

Run: `node --test judge-journey-markup.test.js win-journey.test.js judge-journey.test.js && npm test`
Expected: all tests pass. Commit only Task 3 hunks with message `feat: focus the one-minute judge journey`.

### Task 4: Anonymous timed usability harness

**Files:**
- Create: `usability-study.js`
- Create: `usability-study.test.js`
- Create: `usability.html`
- Create: `usability.css`
- Create: `docs/USABILITY_TEST_PROTOCOL.md`
- Modify: `universe_server_test.py`

**Interfaces:**
- Consumes: build fingerprint from Task 5 when available; accepts `unverified-local-build` before an audit exists.
- Produces: `createUsabilitySession(input)`, `completeUsabilitySession(session, result)`, `summarizeUsabilityStudy(sessions)`, `serializeUsabilityStudy(sessions)`.
- Stores no name, email, free-form demographic information, IP address, or remote telemetry.

- [ ] **Step 1: Write failing usability-domain tests**

Test participant codes `P1`–`P99`, monotonic nonnegative timing, required viewport/build fields, immutable session completion, help/wrong-turn counts, four comprehension answers, exact 4-of-5 unassisted-under-60 pass rule, duplicate participant rejection, mixed-build rejection, and personal-field rejection.

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `node --test usability-study.test.js`
Expected: FAIL because `usability-study.js` does not exist.

- [ ] **Step 3: Implement the pure study model**

Use signatures:

```js
createUsabilitySession(input: object): object
completeUsabilitySession(session: object, result: object): object
summarizeUsabilityStudy(sessions: object[]): { passed: boolean, reasons: string[], metrics: object }
serializeUsabilityStudy(sessions: object[]): string
```

- [ ] **Step 4: Build the local moderator page and protocol**

The page opens Judge Mode in a new local tab, runs a visible timer, captures only structured answers, and downloads a JSON result. It must label results invalid when builds differ or fewer than five genuine participants are present. Add a server test that `/usability.html` is served but cannot expose protected state paths.

- [ ] **Step 5: Verify and commit Task 4**

Run: `node --test usability-study.test.js && python3 -m unittest -v universe_server_test.py && npm test`
Expected: all tests pass. Commit Task 4 paths with message `feat: add anonymous usability validation`.

### Task 5: Reproducible release auditor and build parity

**Files:**
- Create: `release-audit.js`
- Create: `release-audit.test.js`
- Create: `scripts/release-audit.mjs`
- Create: `scripts/check-public-sources.mjs`
- Modify: `package.json:6-9`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: Task 1 manifest, Task 2 scientific records, Task 4 usability exports, repository files, optional media, and optional public-link results.
- Produces: `fingerprintFiles(files)`, `validateMediaRecord(record, fingerprint)`, `redactFinding(finding)`, `composeAuditManifest(input)` and timestamped `release-audit/<timestamp>/` artifacts.
- Command: `npm run audit:release -- --output release-audit/latest`.

- [ ] **Step 1: Write failing audit-helper tests**

Test sorted-path SHA-256 stability, content-change sensitivity, missing media, duration above 60 seconds, build mismatch, malformed proof JSON, secret redaction that reveals only file/line/category, dirty-tree reporting, and external-source unreachable behavior.

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `node --test release-audit.test.js`
Expected: FAIL because `release-audit.js` does not exist.

- [ ] **Step 3: Implement pure audit helpers and CLI orchestration**

Use Node standard-library `crypto`, `fs`, `path`, and `child_process`. Hash a documented sorted allowlist of release files. Capture command exit status and bounded output; never echo detected secret values. The CLI runs JavaScript tests and Python tests, records current commit/dirty state, validates proof artifacts, checks available media metadata, copies the allowlisted release into a disposable directory for a clean smoke test, and writes JSON plus a human-readable Markdown summary. Use `ffprobe` only when already available; otherwise media duration remains an explicit unverified field rather than adding a dependency.

- [ ] **Step 4: Implement opt-in public-source checks**

`scripts/check-public-sources.mjs` performs bounded GET requests with timeout, no credentials, and per-source status. Network failure records `unreachable` without changing scientific claim contents. Tests use a disposable local server, never live biomedical sites.

- [ ] **Step 5: Add release scripts and ignore generated audit output**

Add `test:server`, `audit:release`, `audit:sources`, and `verify` scripts. Ignore timestamped audit output while retaining template inputs and final manually selected evidence summaries.

- [ ] **Step 6: Verify and commit Task 5**

Run: `node --test release-audit.test.js && npm run verify`
Expected: JavaScript and Python suites pass; the release audit exits successfully while accurately reporting external gates as pending. Commit Task 5 paths with message `feat: add reproducible release audit`.

### Task 6: Submission package and truthful status synchronization

**Files:**
- Create: `release/submission-checklist.json`
- Create: `docs/FINAL_RELEASE_CHECKLIST.md`
- Modify: `README.md`
- Modify: `docs/SUBMISSION_SCRIPTS.md`
- Modify: `docs/WIN_READINESS_STATUS.md`
- Modify: `package.json`
- Create: `submission-package.test.js`

**Interfaces:**
- Consumes: release manifest and exact Judge Mode copy.
- Produces: a machine-checkable checklist whose completed external entries require proof path, timestamp, and matching build fingerprint.

- [ ] **Step 1: Write failing submission-package tests**

Assert the three required video roles, ≤60-second rule, public repository and HTTPS live URL shape, team-photo requirement, HackOS and organizer-form confirmations, exact OpenAI disclosure, no placeholders in completed records, and build-fingerprint parity.

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `node --test submission-package.test.js`
Expected: FAIL because the checklist does not exist.

- [ ] **Step 3: Create the checklist and synchronize release language**

Record current public URLs, uploads, expert review, usability study, and confirmations as pending until proof exists. Update README commands and ensure scripts use the exact final product claims, limitation language, and build identifier instructions.

- [ ] **Step 4: Add the package test to the normal verification command**

The release audit must reject final-ready status if any required URL, media, photo, form receipt, or parity proof is absent.

- [ ] **Step 5: Verify and commit Task 6**

Run: `node --test submission-package.test.js && npm run verify && npm run audit:release -- --output release-audit/latest`
Expected: implementation checks pass; only genuine external gates remain pending. Commit Task 6 paths with message `docs: synchronize final submission package`.

### Task 7: Browser, responsive, and accessibility verification

**Files:**
- Create: `design/judge-desktop-final.png`
- Create: `design/judge-mobile-final.png`
- Create: `docs/FINAL_BROWSER_VERIFICATION.md`
- Modify: `release/release-evidence.json`

**Interfaces:**
- Consumes: final local build served by `npm start` and the Task 5 build fingerprint.
- Produces: reproducible browser observations and current screenshots tied to that fingerprint.

- [ ] **Step 1: Start the final server and record the build fingerprint**

Run: `npm start` and open `http://127.0.0.1:4173/`; do not use `file://`.

- [ ] **Step 2: Verify the desktop judge journey**

At 1280×720, complete all five steps, inspect evidence and AI lineage, test unknown-query clearing, open/close the dialog by keyboard, and record zero error-level console messages.

- [ ] **Step 3: Verify mobile, zoom, reduced motion, and fallback**

At 390×844 and 320 CSS pixels/200% zoom, verify no horizontal overflow, 44×44 primary targets, logical reading order, visible focus, and usable dialog. Repeat with reduced motion and `?no3d=1`.

- [ ] **Step 4: Perform accessibility smoke checks**

Complete the path keyboard-only; inspect landmark/heading order, accessible names, live announcements, contrast, and modal focus. Record any limitation explicitly rather than converting a smoke test into a certification claim.

- [ ] **Step 5: Save current screenshots and evidence**

Replace stale judge screenshots only after confirming they show the final fingerprint. Record viewport, browser, timestamp, query mode, and results in `FINAL_BROWSER_VERIFICATION.md`; link the evidence in the manifest.

- [ ] **Step 6: Fix findings and repeat until clean**

For every code or design finding, add or update a regression test, make the minimal change, rerun the focused test, then repeat Steps 2–5. Stop only when no controllable critical, important, or moderate findings remain.

### Task 8: Full recursive audit and release decision

**Files:**
- Modify: `docs/WIN_READINESS_STATUS.md`
- Modify: `docs/WIN_READINESS_VERIFICATION.md`
- Create: `docs/FINAL_RELEASE_AUDIT.md`
- Modify: `release/release-evidence.json`

**Interfaces:**
- Consumes: all prior tasks and their exact build fingerprint.
- Produces: final dimension-by-dimension decision with evidence links and no unsupported green state.

- [ ] **Step 1: Run the complete verification suite**

Run: `npm run verify && npm run audit:release -- --output release-audit/latest`
Expected: zero implementation failures and an accurate external-gate list.

- [ ] **Step 2: Review every changed line**

Inspect the complete task diff for security, correctness, performance, accessibility, maintainability, scientific wording, stale documentation, private data, and accidental unrelated changes. Classify findings as critical, important, moderate, or minor.

- [ ] **Step 3: Repair every controllable finding test-first**

For each finding, add the smallest reproducing test, confirm it fails, implement the fix, and rerun focused plus full verification. Repeat review and repair until no controllable critical, important, or moderate finding remains.

- [ ] **Step 4: Produce the final release audit**

Record test totals, browser matrix, accessibility scope, scientific coverage, usability evidence, public link status, media parity, privacy scan, remaining external gates, and exact commands. “Pass” must link to proof; all other states remain explicit.

- [ ] **Step 5: Make the release decision**

Code/functionality and product-design gates may become green from completed evidence. Scientific credibility, human usability, and submission readiness become green only after valid independent review, five genuine participants, public deployment/media, and both submission confirmations match the final fingerprint.

- [ ] **Step 6: Commit the final audit artifacts**

Commit only hardening-owned documentation and evidence records with message `chore: finalize Aster Atlas release audit`. Do not stage unrelated pre-existing changes.

## Execution order and completion rule

Execute Tasks 1–8 in order because the later scientific, usability, media, and browser proofs depend on the release-gate schema and build fingerprint. After every task, rerun its focused tests and the full suite. After Task 8, continue only for newly discovered controllable defects; never loop on missing external people, credentials, publication authority, or organizer state.

The work is technically complete when all controllable gates pass and every external gate has a validated artifact format plus an honest pending state. The competition package is fully release-ready only when authentic external evidence is attached to the exact audited build.
