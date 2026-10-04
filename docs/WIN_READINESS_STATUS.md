# Aster Atlas win-readiness status

Updated October 4, 2026. This file reports evidence, not a predicted score or promise of winning.

## Release decision

**Not submission-ready.** The implementation and release controls are strong, but independent scientific review, genuine five-person usability evidence, a public repository, a judge-accessible deployment, final-build media, eligibility confirmation, and both submission receipts remain pending external work.

| Dimension | Current state | What establishes completion |
| --- | --- | --- |
| Code and functionality | Implemented; frozen-build verification still required | `npm run verify`, isolated-copy smoke, clean-tree audit, and zero-error browser matrix on the same fingerprint |
| Product design | Implemented; final browser evidence pending | Judge Mode checks at desktop, mobile, 320 CSS px/200% zoom, keyboard-only, reduced motion, and no-3D fallback |
| Scientific credibility | Pending external | Independent qualified review of all 31 claims plus current resource-owner confirmation |
| Human usability | Pending external | Five unfamiliar people on one build; at least four unassisted, under 60 seconds, with all comprehension checks correct |
| Submission readiness | Pending external | Public GitHub repository, HTTPS deployment, accepted photo, three current videos, eligibility proof, HackOS receipt, and organizer-form receipt |

## Implemented evidence

- The focused package contains 26 entities, 31 claim-level relationships, and eight public sources.
- The FRDA–ISCU connection is presented as a model-and-assay review proposal with tissue/model limitations and a counterexample beside the support.
- The phenotype-only A-T shortcut is rejected rather than recommended.
- Every Judge Mode explanation resolves to stored claim IDs and evidence; deleting a required edge blocks that explanation.
- Unknown or changed input clears the previous result, action, path, summary, and live status.
- The primary flow is HTML-first and remains available without WebGL; graphics are illustrative, not molecular or biological simulations.
- The scientific-review template covers every claim but contains no fabricated reviewer decision.
- The anonymous usability harness stores structured participant codes and outcomes, not names, emails, free-form demographics, IP addresses, or remote telemetry.
- The release auditor fingerprints a sorted allowlist, scans configured secret patterns without printing values, tests a disposable copy, validates media parity, and rejects incomplete submission evidence.
- The current JavaScript suite contains 107 passing tests. This count is a local implementation result, not evidence of scientific approval or submission completion.

## Current truthful story

Maria, a Friedreich ataxia patient-organization leader, uses Aster Atlas to inspect a source-linked FRDA–ISCU iron–sulfur comparison. The comparison does not prove that findings transfer. It identifies an existing FACLR asset record and FARA assay guidance as starting points for a written suitability, access, and limitations review with the relevant experts and resource owner. The intended output is a go/revise/no-go research-planning decision, not treatment advice, study eligibility, permission, or guaranteed collaboration.

The impact statement is an illustrative coordination hypothesis: **10 fragmented weeks / 1 atlas-assisted week = 10×** to reach a sourced contact-and-review decision. It excludes expert response time, ethics review, experiments, biological progress, and clinical review.

## OpenAI disclosure

> OpenAI Codex assisted implementation and build-time structured extraction; no runtime model or paid API call is used. The exact session model identifier is unknown, and independent expert review is pending.

This disclosure records real assistance without inventing a model identifier or sponsor decision. OpenAI eligibility remains pending until confirmed by the organizer or sponsor.

## Source of truth

- `release/release-evidence.json` records release gates.
- `release/submission-checklist.json` records deliverables and exact-build proof requirements.
- `release/scientific-review-template.json` is the blank reviewer handoff.
- `docs/FINAL_RELEASE_CHECKLIST.md` describes the freeze and submission procedure.
- `release-audit/latest/audit.json`, when freshly generated, is the machine-readable audit for the candidate build.

No expert sign-off, participant result, resource-owner response, publication, deployment, upload, eligibility decision, or submission confirmation has been manufactured or inferred.
