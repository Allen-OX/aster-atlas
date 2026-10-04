# Universe workspace: bounded acceptance review

Prepared October 4, 2026. Scope: reusable universe pages over public Aster Atlas evidence, an interactive scene, and a Python loopback service for authenticated saved views and workspace access policies. This document records requirements and evidence separately. It is not a claim of complete infrastructure coverage, a physical digital twin, live packet capture, production security, or sponsor acceptance.

## Data and visual scope

Until a different domain is explicitly authorized, the shared graph remains Aster's existing public records. Five proposed universe IDs are `conditions`, `genes`, `phenotypes`, `studies`, and `community`. Each is a view of stable graph IDs, with one-hop context; a repeated object is the same underlying entity rather than a new fabricated record.

The complete underlying snapshot has **8 entities, 8 relationships, and 4 public sources**. It is a small curated research example. The five universes are derived lenses over that same snapshot, not separate comprehensive datasets. Independently enumerated current scopes:

| Universe | Primary entities | Included entities | Included relationships | Referenced sources |
| --- | ---: | ---: | ---: | ---: |
| Conditions | 2 | 8 | 8 | 4 |
| Genes | 2 | 4 | 3 | 2 |
| Phenotypes | 2 | 4 | 4 | 2 |
| Studies | 1 | 2 | 1 | 2 |
| Community | 1 | 2 | 1 | 2 |

Abstract sculpture parts, pipeline strata and animated tracers add visual structure, not additional records. Object positions are presentation coordinates. The implementation does not import an organization's physical infrastructure, discover real assets, ingest live systems, simulate molecules, or provide a complete rare-disease knowledge base. It has no authorized live connector or packet-capture stream. Byte inspection encodes known local relationship fields; the database stores local accounts, policies and view state, not new research evidence.

“Risk” means explainable evidence-quality flags such as missing citations, inferred relationships, or unknown source update dates. It must not be displayed as patient risk, clinical severity, treatment advice, or a probabilistic medical assessment. Actions navigate/filter/inspect the prototype. Timelines use provided source dates and the snapshot date; unknown dates remain unknown.

The requested [Kaspersky concept reference](https://brand.kaspersky.com/wiki/concept) returned a JavaScript-required shell in the web retrieval tool. Its full contents and visual behavior were not verified. Related official indexed [KasperskyOS visual guidance](https://brand.kaspersky.com/wiki/kaspersky_os) describes structured engineered layers, 3D imagery, cooler colors, and inner glow. Those broad design observations are a related reference, not a claim to have reviewed the inaccessible concept page or permission to copy brand assets. No Kaspersky asset or branding import is part of this scope.

## Functional requirements matrix

The matrix specifies acceptance criteria. Evidence recorded below does not imply browser checks that have not been performed.

| Requirement | Concrete acceptance | Evidence boundary |
| --- | --- | --- |
| Own universe URL | Every defined ID has a direct URL, title, landing view, and reloadable selection; invalid IDs fail clearly. Back/forward navigation remains coherent. | Five public graph views, not five complete real organizations. |
| Shared graph | Stable entity/edge/source IDs agree across universe views. Included edges have both endpoints; cloning/view state cannot mutate original records. | Context counts and primary-type counts are labeled separately. |
| Search/filter/type/layers | Search and filters affect visible objects and links together; hidden objects cannot capture pointer input. Layer controls restore exact base coordinates. | No new facts emerge from filtering or visual decomposition. |
| Attributes and evidence assessment | Inspector shows source-backed metadata and explicit evidence-completeness reasons. Unknown values are retained. | No implied live updates or clinical risk inference. |
| Actions | Every enabled action has a working, bounded result: select, navigate, filter, inspect, save, or permitted policy change. | No pretend production remediation or execution on real infrastructure. |
| Analytics | Counts reconcile with the currently defined subset; visible counts are distinct from total graph counts and decorative objects. | Charts do not treat particle density as data volume or source count as confidence. |
| Timeline | Supplied dates use an identified event/source type; unknown dates are visibly unknown and not fabricated for sorting. | A source update date is not a clinical event date. |
| Drag and attached links | Dragging an object moves only the intended object and recomputes every attached line/flow path and inspection anchor; camera motion does not accidentally drag. | Layout is authored presentation, not a measured physical location. |
| Zoom/hover/decomposition | Bounded zoom; stable picking through expanded parts; hover enter/leave and split/rejoin do not accumulate offsets. | Keyboard/touch controls reach equivalent information. |
| Per-link pipelines | Direction, pause, speed, and layer selection operate on the chosen link. Global pause and per-link pause compose predictably; hidden links do not intercept input. | Moving pulses are illustrative transport, not measured biological or network traffic. |
| Byte/bit inspection | Byte offsets, byte values, binary digits, and selected field spans reconcile with the exact locally encoded payload. Show its origin next to inspection controls. | The planned JSON encoding of edge attributes is **synthetic local visualization data**, not a packet capture or decoded wire protocol. |
| Saved views | Reload restores validated camera/layout/filter/layer/link settings within the correct universe. Missing/invalid fields produce clear errors; server validation is authoritative. | A saved view stores presentation state, not a new evidence record. |
| Access controls | Each protected request checks the current server-side universe role. UI capability visibility agrees with the server. | Original public atlas/evidence data remains public; auth protects persisted workspace state, not a private graph that does not exist. |
| Privacy/fallback | Requests remain local except explicit public-source navigation. Renderer failure preserves readable evidence and permitted workspace actions. | No capture, connector, private-data import, or external telemetry is implied. |

## Server authorization contract to verify

The implemented policy has one global bootstrap owner who administers accounts and per-universe grants. Other accounts receive `editor`, `viewer`, or `none` independently for each universe. Scoped owner grants are rejected. Editors save/delete their own views; viewers read their own previously saved views; `none` has no persisted-workspace access. Saved views and activity are personal: even the global owner cannot read or delete another user's views through these APIs. Public graph records remain readable without sign-in.

The first owner is created through the user's local form. Test accounts belong only to disposable test state. No default production credential or silently created owner is acceptable. First-owner initialization must be atomic so concurrent requests cannot each become bootstrap owners. Later registrations must not gain owner privileges by submitting role fields.

| Negative check | Expected result |
| --- | --- |
| Anonymous protected read/write | Denied by the server, with no saved state or policy contents returned. Public evidence routes remain intentionally public. |
| Viewer mutation | Denied even if the UI is bypassed with a direct request. |
| Editor policy change | Denied; editor role cannot grant itself or another account owner rights. |
| Cross-universe access | A role in one universe does not authorize a protected route in another. Unknown universe IDs do not become implicit workspaces. |
| Saved-view scope tampering | Reject a view or object ID that belongs outside its authorized universe or an unknown graph ID. All mutation paths check current scope. |
| Role revocation | A previously issued session cannot keep stale privileges after its universe role is removed. |
| Missing/invalid session | Denied; session identifiers are unpredictable and expire or are invalidated on logout. Credentials and stored password representations are never returned. |
| Missing/invalid CSRF token | Reject authenticated mutations. The token is tied to the current session; it is not a replacement for authorization. |
| Foreign/null origin or host confusion | Reject disallowed browser mutation origins and unexpected Host values; loopback binding alone does not establish request origin. No permissive CORS exposure of authenticated APIs. |
| Invalid payload | Reject malformed JSON, non-object data where an object is required, invalid IDs/roles, non-finite/out-of-range positions, and oversized bodies without partial writes. |
| Protected-file request | Static delivery cannot expose the auth database, session/view files, backups, server source containing deployment configuration, or arbitrary filesystem paths. |
| Concurrent save/bootstrap | Updates are atomic and preserve unrelated records; bootstrap ownership cannot be bypassed by a race. |
| Logout/restart | Logout invalidates the session. Restart behavior of accounts, views, roles, and sessions is explicit and tested where persistence is claimed. |

These are focused checks of this local prototype. They are not a full penetration test, network deployment review, or certification. Do not expose the service beyond loopback on the basis of this review.

## Evidence status

Independent reviewer execution: `node --test universe-model.test.js` passed all **11 tests** on October 4, 2026. These cover five scopes, shared IDs and source preservation, filters without dangling endpoints, explainable evidence flags, counts, known/unknown timeline dates, UTF-8/hex/bits round trips, saved-view validation including per-edge flow state, and parity of the generated server scope artifact. No biomedical record edits are involved.

Independent reviewer execution: `python3 -m unittest -v universe_server_test.py` passed all **10 test methods** after the server fix (0.795 seconds on this local run). These verify atomic single-owner bootstrap, anonymous/no-access denials, viewer/editor separation, cross-universe isolation, personal view/delete ownership, rejected scoped-owner grants, CSRF/Origin/Host denials, static dotfile/state/outside-symlink protection, immediate revocation, logout/expiry, malformed/non-finite/oversized requests, deeply nested JSON rejection, and authoritative saved-view validation. The first run found seven malformed saved-view cases accepted despite client validation; the corrected server now rejects them without writes. All test accounts and databases were temporary, using ephemeral loopback ports. The actual workspace account was not bootstrapped or modified. Restart persistence and internet deployment are not covered by this test run.

Scene source review found solid inference pipelines and pause-time spring snapping. Follow-up source inspection confirms segmented inferred lines, tracer gaps with hidden instances excluded from picking, and spring state held during pause unless an explicit target changes. The scene now exposes global and per-edge pause/direction controls; page integration and persistence of per-edge state still require verification. The scene owner's structural tests and the parent's browser QA are separate evidence from this reviewer's execution.

The scene owner reports structural checks using real Three.js geometry with a mock renderer: 14 inference dashes per stratum, one edge's pause freezing only its instances, global direction plus per-edge override, explicit edge visibility filtering, mid-transition pause stability, attached endpoint updates during drag, and view round trips. These do not establish visual quality, GPU performance, or browser usability. Controller source now explicitly sets four initial pipeline layers, matching the page selector.

Controller source review and syntax check completed. Saved names, activity and public metadata are escaped before HTML rendering; complete payload JSON uses text content. Loaded views are revalidated, and scene selection/camera fields are normalized for storage. Public graph browsing is deliberately independent of protected account storage. Guest views are separately labeled browser storage. Follow-up source inspection confirms fixes for lost focus when entity/byte buttons were recreated, stale per-edge status under global pause, and the misleading “Pause objects” label (now “Pause animation”). Per-edge pause/direction state is included in saved views. The scene's saved-view restore now uses the same pause setter as explicit controls, correcting the reduced-motion resume discrepancy. No open blocker remains from this bounded source/auth review. The parent reports the desktop Conditions universe rendered without browser errors; browser usability and screenshots are the parent's evidence, not independently executed here.

TypeSafe assessment: authorization, schema validation, graph filtering, exact encoding, counts, and animation state are deterministic rules. No bounded semantic judgment is needed in this implementation, and no Jev dependency, paid call, or data transfer has been added.
