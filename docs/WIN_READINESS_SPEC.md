No specification can guarantee a judge’s score, but this is the complete “10/10-ready” definition of done. Everything marked P0 should be treated as mandatory; additional visual features should wait.

# Aster Atlas — 10/10 Win-Readiness Specification

## Product promise

Aster Atlas helps a rare-disease organization move from an isolated diagnosis to a defensible collaboration, reusable research asset, and concrete next action—all supported by inspectable evidence.

The complete demonstrated journey must be:

**Disease → gene/variant → mechanism/phenotype → supported neighboring disease/community → reusable asset → collaborator → action this week → treatment-research milestone**

## Success definition

Within a 60-second demonstration, a judge must understand:

1. Who the user is.
2. What problem she faces.
3. What connection the atlas discovered.
4. Why the connection is scientifically meaningful.
5. Which existing work can be reused.
6. Who she should approach.
7. What she should do next.
8. What remains uncertain.
9. How every claim is sourced.
10. Where OpenAI contributed.
11. How this could accelerate a meaningful milestone.

## Primary persona

**Maria — patient-organization leader**

Maria knows her community’s disease and gene but does not know:

- Which other disease communities share a relevant mechanism
- Which research assets already exist
- Which researcher or organization could collaborate
- Which differences might make collaboration inappropriate
- What her organization should do this week

Maria is the only required demo persona. Family, researcher and biotech views are valuable but secondary.

## Non-goals

The submission will not:

- Cover all 10,000 known rare diseases.
- Diagnose a patient.
- Recommend treatment.
- Determine clinical-trial eligibility.
- Claim that a shared symptom proves a shared mechanism.
- Automatically publish unreviewed AI-extracted claims.
- Add more visual universes, geographic views, accounts or decorative simulations before the central journey is complete.
- Claim that coordination software makes biological experiments themselves 10× faster.

# P0 — Required to compete at a 10/10 level

## 1. One scientifically defensible story

Select one focal disease cluster and construct a complete journey containing at least:

- 2 diseases
- 2 genes
- 1 or more variants or variant classes
- 1 shared or related biological mechanism
- 3–5 relevant phenotypes
- 2 supporting publications or authoritative clinical references
- 1 named investigator or research team
- 1 patient organization
- 1 reusable research asset
- 1 active or completed study
- 1 proposed next action
- 1 important difference, contradiction or counterexample

The related disease must not be connected solely through a broad shared symptom.

### Acceptance criteria

- [ ] A qualified reviewer could trace every scientific statement to a source.
- [ ] The connection includes mechanism-level or variant-effect evidence.
- [ ] The application explains why the diseases may be related.
- [ ] The application also explains why the relationship might not transfer.
- [ ] At least one candidate connection is rejected or downgraded as insufficiently supported.
- [ ] The current FRDA–A-T phenotype bridge is not presented as a collaborative opportunity unless new mechanism-level evidence supports it.

## 2. Complete graph schema

### Required node types

- Disease
- Gene
- Variant or variant class
- Mechanism/pathway
- Phenotype
- Claim
- Publication
- Investigator
- Clinical study
- Patient organization
- Research asset
- Funding program, if directly relevant

### Every node must contain

- Stable identifier
- Canonical name
- Synonyms
- Entity type
- Short family-readable description
- Source identifiers
- Review status
- Last-checked date

### Every edge must contain

- Source node and target node
- Relationship type
- Exact claim
- Supporting source
- Source passage or structured source field
- Direct, inferred, contradictory or unsupported status
- Evidence type
- Evidence strength
- Limitations
- Review status
- Last-checked date

### Acceptance criteria

- [ ] Every visible edge opens an evidence inspector.
- [ ] No biomedical edge exists without a source.
- [ ] Inferred relationships are visually and textually distinguishable.
- [ ] Contradictory evidence appears beside supporting evidence.
- [ ] Missing dates remain “unknown”; they are never silently invented.
- [ ] Stable identifiers and synonyms resolve to a single canonical node.
- [ ] Graph validation fails if an endpoint, source or required field is missing.

## 3. OpenAI contribution

The official brief makes OpenAI model/tool use necessary for track-prize eligibility.

Use OpenAI for at least one real, visible pipeline stage:

### Recommended pipeline

1. **Extract:** Convert supplied source passages into candidate entities and relationships.
2. **Reconcile:** Map extracted names to stable graph identifiers and synonyms.
3. **Explain:** Convert a vetted graph path into family-readable language.

### Required extraction record

Each OpenAI-produced candidate must preserve:

- Model used
- Prompt or extraction version
- Input source identifier
- Exact input passage
- Proposed subject
- Proposed relationship
- Proposed object
- Qualifiers and limitations
- Supporting text span
- Review decision
- Reviewer note

### Safety rules

- OpenAI may propose a relationship but cannot make it trusted.
- Code checks identifiers and schema.
- Unsupported claims are rejected.
- Explanations may use only approved graph edges.
- Every explanatory sentence must reference one or more edge IDs.
- API credentials remain server-side.
- If no secure backend is available, run extraction offline and commit only the reviewed structured artifact—not the key.

### Acceptance criteria

- [ ] The README names the OpenAI contribution.
- [ ] The demo visibly shows an AI-produced artifact or explanation.
- [ ] Judges can inspect the source behind the AI output.
- [ ] Removing the cited edges prevents the explanation from being shown.
- [ ] No OpenAI key exists in browser code, repository history or video.

## 4. Evidence verification and ranking

Deterministic code should remain responsible for:

- Graph traversal
- Stable identifiers
- Exact calculations
- Rule enforcement
- Source presence
- Display of reviewed status

Bounded semantic judgments may evaluate:

- Whether a source passage supports a proposed claim
- Whether two names likely describe the same entity
- Whether a candidate asset appears relevant to the mechanism
- Whether a proposed next action is supported, premature or unsupported

Under the project’s TypeSafe preference, Jev is suitable for narrow citation checks, entity alignment and evidence scoring. Use typed `Choice`, `Score` or `Noul` questions with human review for uncertain cases. It does not replace the required OpenAI contribution. Current patterns are listed in the [TypeSafe documentation](https://docs.typesafe.ai/llms.txt).

Do not add a TypeSafe dependency unless credentials and data transmission are authorized and representative cases can be validated before submission.

### Acceptance criteria

- [ ] Candidate relevance is decomposed into evidence strength, mechanistic relevance, asset usefulness and actionability.
- [ ] Thresholds live in one reviewable configuration.
- [ ] Low-confidence or contradictory candidates route to review.
- [ ] The UI never translates model confidence into medical certainty.
- [ ] A failed model call cannot create or promote a trusted edge.

## 5. Judge-facing journey screen

Create a focused “Patient Action Journey” that appears before secondary visual explorations.

### Required layout

#### A. Maria’s starting point

- Disease name
- Community situation
- Current obstacle
- Desired milestone

#### B. Supported connection

- Related disease or community
- Shared mechanism
- Relevant phenotypes
- Evidence-strength label
- “Why this matters” explanation

#### C. Existing work

- Registry, model, biomarker, natural-history study or study design
- Organization maintaining it
- What appears reusable
- What cannot be assumed reusable

#### D. Recommended partner

- Researcher, clinical group or patient organization
- Why this party is relevant
- Public source supporting the connection
- Public contact route, if available

#### E. Next action

- One action Maria can perform this week
- Expected output from that action
- Required expert review
- Decision the result will enable

#### F. Uncertainty

- Known facts
- Inferred relationship
- Contradictory evidence
- Missing evidence
- What would change the recommendation

#### G. Evidence

- Source title
- Publisher
- Date
- Exact supporting passage or field
- Open-original-source link

### Acceptance criteria

- [ ] A first-time user completes the journey without entering a custom graph query.
- [ ] The principal action appears without scrolling on a standard laptop.
- [ ] Every claim is reachable within one click.
- [ ] The main text is readable during a screen-shared video.
- [ ] The graph supports the journey instead of replacing it.
- [ ] The page contains one dominant CTA: “Show the supported opportunity.”
- [ ] Secondary Universes and World Map features do not interrupt the demo path.

## 6. Honest “no supported route” state

When evidence is insufficient, display:

- No supported connection found
- Sources and entity types searched
- Candidate relationships considered
- Why candidates failed
- Missing evidence
- A useful next research question

### Acceptance criteria

- [ ] Unknown queries clear previous results.
- [ ] No stale recommendation remains visible.
- [ ] The system never manufactures a path to avoid an empty result.
- [ ] The empty state still gives Maria a useful next investigation step.

## 7. Concrete patient progress

The final recommendation must specify:

- **Who:** Named organization, researcher or expert class
- **What:** Concrete action
- **Why:** Evidence-backed reason
- **Asset:** Existing work that may be reused
- **Question:** What must be validated
- **Output:** What the action should produce
- **Decision:** What becomes possible afterward

### Example structure

> Contact [organization] to request review of whether [asset] can support [focal disease]. The opportunity is based on [mechanism evidence]. Before reuse, an expert must evaluate [important difference]. A successful review would enable a decision on [shared study/registry/model milestone].

### Acceptance criteria

- [ ] The recommendation is performable within one week.
- [ ] It does not diagnose, prescribe or determine trial eligibility.
- [ ] It contains at least one limitation.
- [ ] It identifies the next decision—not merely another webpage to read.

## 8. Credible 10× impact model

Choose one milestone:

- Launch a natural-history study
- Establish a reusable registry
- Select an experimental model
- Identify and validate a collaborator
- Reach a therapeutic-candidate review decision

Show:

- Existing process
- Existing estimated duration
- Atlas-assisted process
- Proposed duration
- Steps eliminated or shortened
- Assumptions
- Required expert validation
- What is not accelerated

### Acceptance criteria

- [ ] The claimed acceleration applies to research coordination or evidence discovery.
- [ ] Every duration is sourced or clearly labeled as an estimate.
- [ ] The comparison explains where time is saved.
- [ ] The application does not claim that software shortens unavoidable biological experiments.
- [ ] The ratio is calculated correctly.
- [ ] If the evidence supports less than 10×, the product reports the honest number.

## 9. Product craft

### First two seconds

The user should immediately see:

- “Turn an isolated diagnosis into a shared research path.”
- The focal disease
- Maria’s problem
- One start button

### Visual hierarchy

Order of importance:

1. Patient outcome
2. Recommended action
3. Supported connection
4. Evidence and uncertainty
5. Graph visualization
6. Secondary explorations

### Usability requirements

- Minimum readable body text during screen sharing
- High contrast for all essential text
- Meaning never conveyed through color alone
- Keyboard-accessible journey
- Clear focus indicators
- Touch targets suitable for mobile
- Reduced-motion support
- Data-only fallback when WebGL is unavailable
- Consistent navigation numbering
- No disabled or unfinished controls in the demo path

### Acceptance criteria

- [ ] Five unfamiliar testers can state the product’s purpose after five seconds.
- [ ] Four of five complete the central journey without assistance.
- [ ] The full journey takes less than 60 seconds.
- [ ] The evidence inspector remains legible at 1280×720.
- [ ] Mobile users can reach the action and sources without manipulating the 3D graph.
- [ ] The repeated “03” navigation numbering is corrected.

## 10. Testing and verification

### Data integrity tests

- Every node has a stable identifier and source.
- Every edge has valid endpoints and evidence.
- Every source URL is valid at review time.
- Synonyms resolve correctly.
- Duplicate canonical entities are rejected.
- Unknown dates remain unknown.

### AI tests

Use representative examples covering:

- Correct extraction
- Unsupported extraction
- Entity-name collision
- Conflicting sources
- Missing evidence
- No-match case
- Overconfident explanation
- Model/API failure

### Journey tests

- Supported journey reaches the correct action.
- Weak candidate is visibly downgraded.
- Contradiction appears in the inspector.
- Unknown query creates no path.
- Every explanation sentence maps to approved evidence.
- 10× calculation and assumptions display correctly.

### Runtime tests

- Desktop and mobile
- Keyboard-only navigation
- Reduced motion
- WebGL failure
- Slow or unavailable AI service
- Invalid saved state
- Broken external source link handling

### Acceptance gate

- [ ] All automated tests pass.
- [ ] No console errors occur during the recorded demo.
- [ ] The deployed build matches the recorded build.
- [ ] Every demonstrated source is accessible.
- [ ] No secret or private information appears in the repository.

# P1 — Add only after every P0 passes

- Compare two candidate collaborations.
- Export a sourced collaboration brief.
- Search across several disease clusters.
- Let patient groups submit evidence for review.
- Rank potential researchers or organizations.
- Add funding and grant-opportunity nodes.
- Provide researcher and biotech-specific action views.
- Show graph coverage and freshness statistics.

# P2 — Do not build for this submission

- Global ingestion of all rare diseases
- Production authentication or workspaces
- Real-time collaborative editing
- Geographic patient mapping
- Investor matching
- Automated clinical eligibility
- Autonomous treatment recommendations
- Additional cinematic universes

# Rubric completion gates

## Graph quality — 10/10 target

- [ ] Mechanism-level path
- [ ] Variants represented
- [ ] Stable identifiers and synonyms
- [ ] Defensible ranking
- [ ] Counterexample or rejected candidate
- [ ] Useful path terminating in an asset and action
- [ ] Uncertainty visible

## Evidence integrity — 10/10 target

- [ ] Source on every edge
- [ ] Exact supporting passage or structured field
- [ ] Direct versus inferred distinction
- [ ] Contradictions visible
- [ ] Review status visible
- [ ] AI output traceable
- [ ] Honest no-route state

## Patient progress — 10/10 target

- [ ] Maria starts with an isolated diagnosis
- [ ] Discovers a justified connection
- [ ] Finds an existing asset
- [ ] Finds a collaborator
- [ ] Understands important differences
- [ ] Receives one actionable weekly step
- [ ] Reaches a defined next decision

## 10× impact — 10/10 target

- [ ] Specific milestone
- [ ] Before timeline
- [ ] After timeline
- [ ] Explicit assumptions
- [ ] Correct calculation
- [ ] Steps saved identified
- [ ] No biological overclaim

## Ambition and product craft — 10/10 target

- [ ] Purpose clear in two seconds
- [ ] Complete journey under 60 seconds
- [ ] Memorable but subordinate graph
- [ ] Clear hierarchy
- [ ] Accessible interaction
- [ ] Readable screen share
- [ ] Stable deployed prototype
- [ ] Polished empty/error states

# Submission requirements

- [ ] Public or judge-accessible working prototype
- [ ] Reproducible source repository
- [ ] README with architecture, sources and dataset-generation steps
- [ ] OpenAI usage documented
- [ ] Data and safety limitations documented
- [ ] Team image
- [ ] Team-introduction video, no longer than 60 seconds
- [ ] Product-demo video, no longer than 60 seconds
- [ ] Technical-walkthrough video, no longer than 60 seconds
- [ ] HackOS submission complete
- [ ] Separate organizer form complete
- [ ] Every uploaded file and external link tested
- [ ] Submission confirmations retained

# Winning 60-second demonstration

**0–7 seconds:** Introduce Maria and the untreated disease.

**7–15 seconds:** Search the disease and display its gene, variant, mechanism and informative phenotypes.

**15–25 seconds:** Reveal a supported neighboring disease or community and explain the meaningful connection.

**25–35 seconds:** Show the existing registry, study, model or biomarker that might be reused.

**35–43 seconds:** Identify the relevant collaborator.

**43–50 seconds:** Show Maria’s concrete next action and the required expert validation.

**50–55 seconds:** Open the supporting evidence and show the OpenAI extraction/explanation trace.

**55–60 seconds:** Display the milestone timeline, estimated acceleration and assumptions.

# Implementation order

1. Freeze all visual expansion.
2. Select and scientifically verify the focal journey.
3. Add mechanism, variant, investigator, asset and claim records.
4. Add claim-level evidence and contradiction fields.
5. Produce the reviewed OpenAI extraction artifact.
6. Build the Patient Action Journey.
7. Add the no-supported-route state.
8. Add the 10× milestone comparison.
9. Simplify the judge-facing hierarchy.
10. Run every acceptance test.
11. Deploy and verify.
12. Re-record the three videos.
13. Complete both submission channels.

## Final release rule

Do not spend time on another animation, universe, world-map feature or account capability until every P0 checkbox above passes.

The spec’s central change is deliberate: the graph becomes supporting evidence for a patient decision, rather than the product’s main destination. That shift—and qualifying OpenAI use—will improve the submission more than additional visual complexity.