# Aster Atlas

An original, dependency-free solo hackathon prototype for inspecting a small network of rare-disease evidence. It covers two example conditions and eight linked entities. Every biomedical connection has a public source. The graph makes its one cross-source inference explicit and never infers diagnosis, treatment, or study eligibility.

## Run

From this folder, run `npm start` and open `http://localhost:4173`. Run `npm test` to check graph integrity and retrieval behavior.

## Scope and interaction

- Search and filter diseases, genes, phenotypes, a study, and a community resource.
- Trace a route between two entities; documented edges are preferred over a shorter cross-source inference.
- Ask a two-entity route question in plain language. A transparent, deterministic parser resolves known names and aliases, then the graph search returns a cited route. Unknown questions are rejected rather than answered speculatively.
- Select graph nodes, accessible index rows, or the top-left Living Hologram to inspect source-backed connections.
- Switch family/researcher routes through the same evidence.
- Fixed-camera Cartesian projection, spring-based hover depth, cube fission, and source-particle condensation are decorative. The evidence list remains keyboard accessible and reduced-motion mode freezes the animation.
- Pointer velocity only changes the local spring damping. No pointer events are saved or sent anywhere.

The demo deliberately uses deterministic retrieval over reviewed records. Evidence relation checking and query routing would be suitable bounded semantic judgments for a future TypeSafe/Jev integration, but this version has no external inference API, credential, dependency, or data transfer.

The source code is prepared under the MIT license in `LICENSE`. The repository has not been published yet.

## Source and medical boundaries

See the in-app provenance panel. Source snapshot checked 2026-10-03. Open the source records for current registry and clinical information. This is a research-navigation demonstration, not a medical device or clinical advice.
