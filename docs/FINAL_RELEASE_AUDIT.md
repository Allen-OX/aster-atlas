# Aster Atlas final release audit

Audit date: October 4, 2026
Audited runtime fingerprint: `sha256:3320c9a191d2536ef7f917e9ee0a2fa2431907f39388c7048c3876313b1651f3`

## Release decision

**All controllable implementation and critical-journey design checks pass, and both required organizer submissions were accepted. Authentic scientific, usability, and eligibility evidence remains pending.** No pending item is represented as completed.

| Dimension | State | Evidence | Remaining condition |
| --- | --- | --- | --- |
| Code and functionality | Pass | 113 JavaScript tests; 10 isolated server tests; disposable-copy smoke; scientific template parity for 31 claims | Preserve the audited fingerprint through publication and media capture |
| Product design | Pass for the critical judge path | `docs/FINAL_BROWSER_VERIFICATION.md`; desktop and mobile screenshots | This is targeted browser/accessibility verification, not full WCAG certification or human usability evidence |
| Scientific credibility | Pending external | Eight public sources reachable; 26 entities; 31 source-linked claims; complete blank reviewer packet | Independent qualified review of every claim and current resource-owner confirmation |
| Human usability | Pending external | Anonymous, local-only, exact-build study harness with fail-closed scoring | Five unfamiliar people; at least four unassisted completions under 60 seconds with all four comprehension checks correct |
| Submission readiness | Submitted | Public repository, HTTPS GitHub Pages deployment, accepted team photo, three verified exact-build videos, HackOS receipt, and organizer-form receipt | Explicit OpenAI eligibility decision remains external |

## Verification performed

- `npm run verify`
- `npm run audit:sources`
- `npm run audit:release -- --output release-audit/latest`
- Critical-path browser checks at 1280×720, 390×844, and 320×844 CSS pixels
- Keyboard, focus return, reduced motion, no-3D fallback, unknown-query stale-state clearing, dialog wrapping, and console checks
- Manual review of the changed lines for correctness, privacy, accessibility, scientific wording, stale claims, and false-green release paths

The release auditor reported three automated groups passing, all eight sources reachable, and no configured secret-pattern findings. A dirty working tree is expected before the audit commit and must be cleared before publication evidence can pass.

## Controllable findings repaired

1. A completed usability session could previously pass without all four required comprehension answers. Success now requires problem, opportunity, limitation, and next-action answers to all be correct.
2. A required deliverable marked `fail` could previously leave a checklist structurally valid. Any failed required deliverable now blocks validity and readiness.
3. Usability privacy-field detection missed common camel-case and biographical/contact keys. Keys are normalized and rejected before serialization.
4. Release evidence accepted non-ISO proof timestamps. Proof now requires an ISO-8601 UTC timestamp.
5. OpenAI wording was duplicated and could drift. The exact disclosure is centralized and is rendered in the product and extraction artifact.
6. The release fingerprint originally included post-build proof files, making it self-referential. The fingerprint now covers runtime assets while excluding docs, screenshots, release evidence, and submission media.
7. Desktop label wrapping, undersized mobile disclosure targets, and 320px dialog overflow were repaired and regression-tested.

No controllable critical, important, or moderate finding remains in the audited scope.

## Truth and safety boundaries

- The FRDA–ISCU connection is a source-linked research comparison, not validated reuse, treatment advice, diagnosis, trial eligibility, material access, or a confirmed collaboration.
- The product displays tissue specificity and a documented model counterexample beside supporting evidence.
- The next step is a written model-and-assay suitability review with relevant experts and the resource owner.
- The 10× statement is an illustrative coordination hypothesis—10 fragmented weeks divided by one atlas-assisted week to reach a sourced contact-and-review decision. It does not measure scientific or clinical acceleration.
- OpenAI disclosure: “OpenAI Codex assisted implementation and build-time structured extraction; no runtime model or paid API call is used. The exact session model identifier is unknown, and independent expert review is pending.”

## External evidence still required

- Independent scientific review and resource-owner confirmation
- Five-person unfamiliar-user study on this exact fingerprint
- OpenAI eligibility confirmation

These gates must remain `pending-external` until their real proof artifacts exist. Preparation, AI review, a local screenshot, or a drafted form is not completion evidence.
