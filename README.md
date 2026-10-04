# Aster Atlas — Evidence Constellation

An original solo Hack-Nation 7 prototype for **Buffalo Initiative × OpenAI: AI Atlas for the World's Rare Diseases**. Aster Atlas is a “Google Maps for rare-disease research”: it turns a deliberately small, source-linked evidence graph into an inspectable patient-organization journey, a cinematic 3D constellation, a keyboard-accessible index, and a source-bound next action.

## Run locally

Run `npm start`, then open http://127.0.0.1:4173. `npm test` runs the JavaScript checks, `npm run test:server` runs the disposable local-service checks, and `npm run verify` runs both. `npm run audit:release -- --output release-audit/latest` adds deterministic build fingerprinting, isolated-copy smoke tests, configured secret scanning, media parity, release-gate validation, and submission-package validation. No build process, credential, or runtime external API is required. Three.js 0.186.1 and OrbitControls are vendored under their MIT license in `vendor/three/`; application files and renderer load locally.

## Current judge journey — win-readiness revision

Maria, a Friedreich ataxia patient-organization leader, follows a source-linked FRDA–ISCU iron–sulfur comparison to a **model-and-assay review proposal**. Existing FACLR cells/protocols and a FARA assay guide provide concrete starting assets. The public repository contact is Marek Napierala; access, fit and collaboration are unconfirmed. The immediate output is a written suitability/access matrix and a go/revise/no-go decision for designing a pilot. It is not a treatment or participation decision.

The first screen shows the action, a five-step journey, and one-click claim inspection. Source support appears beside tissue-specific limitations and an assay counterexample. A-T remains rejected for the phenotype-only proposal. Unknown focal queries clear previous results. The impact screen discloses one fixed, testable planning hypothesis: **10 fragmented weeks / 1 atlas-assisted week = 10×** to reach a sourced contact-and-review decision. It is not a measured result and excludes expert response, ethics review, experiments, biological progress, and clinical review.

### Architecture and reproduction

- `win-evidence.js`: 26 entities, 31 edges, 8 sources; exact source fragments/fields, canonical IDs, synonyms, review status, dates and explicit graph branches. `win-evidence.test.js` checks completeness and route adjacency.
- `win-review.js`: deterministic schema, identity, explanation and candidate gates. Thresholds are centralized in `REVIEW_CONFIG`; no model call can promote a trusted edge. `docs/AI_REVIEW_DESIGN.md` records the proposed bounded Jev role.
- `win-journey.js` / `win-journey.css`: readable data-first interface independent of WebGL. Every scientific explanation uses an exact stored claim and an evidence ID.
- `win-openai.js` and `data/openai-win-extraction.json`: inspectable OpenAI Codex implementation-assistance and build-time extraction artifact. It preserves prompt version, input/source span, proposed tuple, qualifications and pending review. The exact session model identifier is **unknown**, not invented. No runtime model or paid API call was used. Build-time tool use does not establish sponsor prize eligibility.
- Independent human/expert review is **pending on every new record**. Earlier `human-reviewed` flags were corrected because no independent approval was recorded. Schema tests establish integrity, not scientific approval.

Dataset generation: retrieve the linked primary/owner sources, preserve short passages or registry field locators, extract candidate records offline, reconcile canonical IDs, run both schema/route validators, and obtain independent expert acceptance/revision/rejection. Only that reviewer can close the scientific release gate. Unknown dates remain unknown. No automated ingestion or runtime clinical inference is claimed.

`npm test` runs all JavaScript checks. `python3 -m unittest universe_server_test.py` exercises isolated local service state. Source-review evidence, actual browser checks, external gates, and draft scripts are in `docs/WIN_READINESS_STATUS.md`, `docs/WIN_READINESS_VERIFICATION.md`, and `docs/SUBMISSION_SCRIPTS.md`. The user's complete specification is preserved in `docs/WIN_READINESS_SPEC.md`.

**Release status:** local candidate, not submission-ready. Expert approval, resource-owner confirmation, sponsor interpretation of OpenAI eligibility, five-person unfamiliar-user testing, a public repository and deployment, accepted photo, current-build videos, and both submission confirmations remain open. The machine-readable status lives in `release/release-evidence.json` and `release/submission-checklist.json`; the final procedure is `docs/FINAL_RELEASE_CHECKLIST.md`.

## Earlier exploration snapshot (retained)

The secondary 3D atlas and universes currently retain the earlier 12-node, 14-edge, five-source FRDA snapshot. They are not the authoritative dataset for the new patient-action journey. Their illustrative geometry does not imply biological accuracy. No additional visual work is part of the current release effort.

## New spatial experience

- Original sculpted helix, metallic layered entity forms, meridian arcs and luminous filaments. These are illustrative sculptures, **not molecular models or biological simulations**.
- Twelve real graph entities and fourteen source-linked relationships. Decorative particles and orbital structures are not additional research records.
- Select a sculpture or stable keyboard label to inspect its claims and original sources. Hover reveals structural layers; a control unfolds the collection. Drag to orbit, zoom, reset, pause ambient motion or double-click a sculpture to focus.
- Dashed geometry and explicit text distinguish the one cross-source inference, including when a route is highlighted.
- Search/filter conditions, genes, phenotypes, studies and community resources. The entity index exposes the same evidence without requiring 3D interaction.
- Trace a route between two known entities with deterministic alias parsing and weighted shortest-path search. The graph prefers documented links over the cross-source inference; unknown questions clear previous route results.
- Family and researcher pathways use the same reviewed evidence. On phones, selection brings the evidence panel into view, with a return link to the constellation.
- Responsive presentation, keyboard controls, reduced-motion preference, offscreen render suspension and visible WebGL fallback. `?no3d=1` exercises the data-only experience.

## Data and boundaries

The original visual atlas covers **two example conditions, twelve entities, fourteen relationships and five public sources**. The featured judge journey expands that small review package to **26 entities, 31 claim-level relationships, and eight public sources**, including primary publications, a registry record, research assets, investigators, an organization, explicit counterevidence, and a rejected candidate. Every displayed arrow in the judge journey is backed by its named graph edge and source passages. Current study roles, status, contacts, and resource availability must still be checked live.

OpenAI Codex assisted implementation and build-time structured extraction; no runtime model or paid API call is used. The exact session model identifier is unknown, and independent expert review is pending. The historical artifact retains its source excerpt, structured output, reviewer note, and corrected `source-checked-by-ai;expert-review-pending` status. The browser uses deterministic retrieval over the source-checked snapshot.

The TypeSafe skill and current documentation index were reviewed for the design work. Camera motion, geometry, known-entity filtering, exact graph traversal, and hard safety boundaries do not need semantic judgments. Future citation verification or entity alignment could be bounded Jev `Choice`/`Score` questions after explicit integration and data-transfer authorization; this build adds no external inference dependency, credential, or paid call.

No pointer history is persisted or transmitted. Graph analytics are computed locally. The workspace service handles local saved views and access policies; it does not fetch external telemetry. Opening a source link navigates to that source's public website.

## Project status

- Local prototype; the code remains unpublished.
- Existing submission videos in `submission-media/` show the earlier design and should be regenerated for this revision before submission.
- The project is separate from the cybersecurity sandbox at port 4180. Its organizational simulation tests are unrelated to this challenge's acceptance.
- See `design/REDESIGN_NOTES.md` for scope and review criteria, and `design/VERIFICATION.md` for executed visual checks.

## Living Hologram revision

The top-left module presents the reviewed public evidence entities as fixed-axis machined objects. Hover or keyboard focus approaches along Z and separates structural layers with an analytically integrated damped spring. Selection opens the source inspector. The central alpha-shader emblem toggles all layers; its opaque active interior is sRGB #FF0000. These forms are interface sculptures, not biological models.

Expand opens a native modal inspection view; Return or Escape closes it. Selecting an entity closes the modal and focuses its evidence. High/light detail changes decorative point budgets (8,192 / 2,048), preserving every evidence item. Pause and system reduced-motion preference are supported. Pointer-speed damping is local, bounded, and not retained.

The existing orbitable constellation and the fixed-axis module have separate rendering controls. The constellation suspends rendering while covered by the expanded module. Both factories clean up startup failures; source navigation remains available without graphics.

Rendering uses WebGL2 raster PBR. This revision does not implement photon tracing, physical volumetric subsurface scattering, or non-Euclidean physics. See `design/HOLOGRAM_SPEC.md` and `design/HOLOGRAM_VERIFICATION.md` for measured results and remaining gaps. Literal perfection is not an acceptance claim.

## Continuous object animation

All reviewed entities animate without requiring hover. The constellation uses bounded type-specific structural motion, and relationships carry moving highlights; the inferred relationship keeps its dashed gaps. World node centers stay fixed, so each relationship retains its correct endpoints.

Every Living Hologram cube continuously translates along Z, separates its panels, scans its face, and animates source markers attached to its panel. Entity type selects a designed motion profile; connection count adjusts a bounded scan rate; source count determines marker count. These are visual encodings of the cited snapshot, not severity, confidence, biological activity, or live updates. Expanded labels and the inspector show actual source/connection counts.

The header provides **Pause all / Animate all** and **0.5× / 1× / 2×** playback speeds. Individual view controls remain available. Pause freezes the animation clock and current attribute motion; explicit selection and layer controls remain responsive. System reduced-motion preference starts both views paused. TypeSafe assessment unchanged: these exact visual encodings require no semantic judgment or external inference.

## Zoomable world map

The World map navigation opens a locally rendered map of 177 Natural Earth countries/map units. Select a country to frame it; drag to pan, use +/− or pinch/double-click to zoom up to 12×, and Reset to return to the world. Keyboard arrows pan and Home resets. This is geographic context using public-domain overview outlines; clinical locations are not inferred. See `assets/maps/README.md` for attribution and `design/WORLD_MAP_VERIFICATION.md` for checks.


## Independent connected universes

Open `/universe.html?universe=conditions` (or `genes`, `phenotypes`, `studies`, `community`), or use **Universes** on the main page. Each route has its own title, scope, search/filter controls, scene instance, layers, evidence-quality assessment, inspector actions, counts, source timeline and saved views. Shared entity IDs provide cross-universe navigation. The original world map remains at `/#world-map`.

Objects have ID-derived geometry and proportions, bounded decorative structural motion, reversible spring layers, camera focus and ray-plane dragging. Pipeline buffers follow moved endpoints in place. Four strata can be revealed; global and individual relationship flow can be stopped or reversed. The complete UTF-8 relationship record can be inspected by byte and bit. These are illustrative sculptures and synthetic local records, not physical asset twins, molecular models, live packet captures, or a comprehensive dataset.

### Local accounts and storage

Run `npm start`. The server binds only to `127.0.0.1:4173`. On this Mac its default database is `~/Library/Application Support/Aster Atlas/workspace/workspace.sqlite3`, outside the cloud project directory. `--state PATH` selects a different store for testing. The database directory and file use restricted filesystem modes. Do not publish or expose this development server as a production service.

Guest saved views are browser storage, with no account privacy claim. **Workspace access** lets the user create the first owner account; no default credential is supplied. The owner creates local accounts and separately grants each universe `none`, `viewer`, or `editor`. Saved views and history are personal; authorization is checked by the server on every protected request. Original public evidence remains public. Passwords use salted scrypt, session tokens are hashed, cookies are HttpOnly/SameSite, mutations require CSRF and matching Origin/Host, and saved states are validated against actual graph IDs on both client and server.

Saved views include filters, camera, positions, structural layers, selection, global playback and per-relationship playback. Guest and signed-in stores are intentionally separate. Source dates stay distinct from real saved-view activity. Unknown source dates remain unknown. Evidence quality is not patient risk.

Verification: `npm test` and `python3 -m unittest -v universe_server_test.py`. Account tests create disposable state at ephemeral ports and never create an owner in the real workspace. See `design/UNIVERSE_ACCEPTANCE.md` and `design/UNIVERSE_VERIFICATION.md` for exact scope, checks, and remaining limitations.


## Orbital Earth map

The World map section now offers **Globe** and **Flat map** views of the same 177 Natural Earth map units. Globe mode uses locally bundled NASA Blue Marble day imagery and a separate cloud shell, illuminated country outlines, an atmosphere and star field. Search/select a country, drag to orbit, pinch/scroll or use buttons to zoom, and switch visual layers independently. Manual rotation and the shared Pause all control remain separate. Flat mode retains the existing 12× pan/zoom experience and acts as the graphics fallback.

Floating panels provide universe links, primary entity counts and selected geographic context. There are no inferred research-site, patient-distribution, or current weather overlays. NASA images are archival composites; cloud movement is decorative. Source provenance is in `assets/maps/EARTH_TEXTURES.md`. Country names, boundaries and overview resolution follow the bundled Natural Earth data. Neither view supplies street-level navigation.
