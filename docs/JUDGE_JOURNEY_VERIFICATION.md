# Judge Journey Verification

Checked: 2026-10-04

## Automated checks

- `npm test` — **67/67 passed**.
- `python3 -m unittest -v universe_server_test.py` — **10/10 passed** against disposable local state.
- The legacy 12-node atlas and the expanded 26-node judge package both validate their endpoints, stable IDs, source references, claim metadata, limitations, and pending-expert-review labels.
- Mutation tests reject empty action citations, uncited evidence edges, fabricated route hops, unsupported action types, unsafe enrollment/qualification language, and any change to the disclosed 10-week / 1-week coordination hypothesis.
- Every visible judge-journey arrow is generated from an explicit route segment whose edge connects the adjacent nodes. Unsupported arrows fail validation and are withheld.
- Removing a cited edge or source suppresses its explanation; contradictory and unsupported evidence cannot be promoted into a trusted result.
- The stored OpenAI artifacts exactly match the application records and disclose implementation assistance plus build-time extraction, no runtime model or paid API call, unknown exact model identity, and pending independent expert review.

## Browser acceptance

Verified on the local server at `127.0.0.1:4173` after the final code changes.

- Desktop **1280×720**: the first screen shows Maria’s problem, the dominant CTA, supported connection, this-week action, and pending-review state. Body text is 16px, primary controls are 44–48px high, and there is no horizontal page overflow.
- Mobile **390×844**: the journey reflows without horizontal overflow; body text remains 16px; measured journey controls are at least 44px high.
- The milestone screen displays the exact **10× illustrative coordination hypothesis: 10 fragmented weeks to 1 atlas-assisted week**, with assumptions and exclusions. It does not claim measured biological, clinical, experimental, ethics-review, or expert-response acceleration.
- “Inspect every claim and source” opens one dialog containing **31 claim records, 31 limitation statements, and 46 original-source links**, with evidence status, review status, and checked dates.
- The graph disclosure shows six branches and fourteen edge-backed hops; each button names the two endpoints of a validated edge.
- The OpenAI inspector states: Codex assisted implementation and build-time structured extraction; no runtime model or paid API call; independent expert review remains pending.
- Searching an unknown syndrome clears the prior recommendation and shows the no-supported-route question instead of manufacturing a path.
- `?no3d=1`: the full judge journey remains usable and the evidence atlas exposes its text/entity-index fallback. The two expected fallback warnings appear; there are zero error-level console messages.
- Final standard page: zero error-level console messages. The verified local demo remains open in the in-app browser.

## Claims deliberately not made

- No diagnosis, treatment, personal-risk, study-eligibility, collaboration, asset-availability, or scientific-fit conclusion.
- No claim that phenotype overlap proves a shared mechanism, reusable model, intervention, or treatment transfer.
- No claim that the 10-to-1-week scenario is measured performance.
- No claim that AI source checking equals qualified domain-expert approval.
- No claim that the local build is deployed, submitted, or guaranteed to win.

## External gates still requiring people or publication

- Independent rare-disease/model-system expert review and resource-owner confirmation.
- Five unfamiliar-user tests and a timed sub-60-second judge run.
- Public deployment/repository verification and updated demo media.
- Confirmation of the current sponsor/OpenAI eligibility rules and completion of both official submission channels.
