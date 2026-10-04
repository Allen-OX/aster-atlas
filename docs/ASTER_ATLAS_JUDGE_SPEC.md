# Aster Atlas judge-journey specification

## Outcome

The first product experience must move Maria, a Friedreich ataxia patient-organization leader, from a known disease to a sourced mechanism, an existing research asset and sponsor, a named research team, an honest limitation, and one concrete coordination action. The 3D atlas supports this journey; it is not the destination.

## Required behavior

- Represent disease, gene, variant, mechanism, phenotype, study, organization, investigator, and research-asset records with public provenance.
- Treat the FRDA–A-T shared-ataxia link as a rejected phenotype-only comparison, never as a shared-treatment or collaboration recommendation.
- Present FARA research resources and the UNIFIED natural-history study as existing infrastructure relevant to FRDA, with links to the live sources and no eligibility claim.
- Show supporting claims, limitations, review status, source dates, and a useful no-supported-route state.
- Document OpenAI Codex as the build-time structured-extraction and implementation tool, with reviewed extraction records; do not imply a live model or paid API call.
- Show a clearly labeled coordination hypothesis comparing 10 weeks of fragmented discovery with a 1-week atlas-assisted contact-and-review milestone. State that this is an illustrative assumption, not a measured outcome or acceleration of biological research.
- Make the patient action journey the primary judge-facing flow, readable at 1280x720 and usable without WebGL.
- Preserve deterministic graph traversal and keep all medical or eligibility decisions outside the product.

## Verification

- Graph and case-study validators reject missing evidence, unsupported actions, unsafe clinical claims, and invalid acceleration inputs.
- Search resolves the new variant, mechanism, investigator, and asset records.
- Existing graph, rendering, server, access-control, and saved-view tests remain green.
- A browser smoke review covers desktop, mobile, keyboard-readable fallback, and console errors.

## Non-goals

- Comprehensive rare-disease coverage.
- Diagnosis, treatment, risk, or study-eligibility decisions.
- A new live inference service, dependency, credential, or paid API call.
- Additional visual universes, geographic overlays, accounts, or animation systems.
