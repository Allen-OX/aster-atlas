# Release evidence contract

`release-evidence.json` is the truthful input record for Aster Atlas release gates. The release auditor replaces `unverified-local-build` in generated audit output; it does not silently rewrite this source file.

## States

- `pass`: the required outcome happened and at least one proof record is attached.
- `fail`: a check ran and failed, or a claimed pass lacks valid proof.
- `pending-external`: completion requires a genuine person, public service, authenticated portal, or organizer decision.
- `not-run`: a controllable check has not been executed for this build.

A passing proof record contains `kind`, repository-relative `path`, ISO-8601 `recordedAt`, and the exact `buildFingerprint`. A gate marked `external: true` also requires `completion: true`. Preparation artifacts may be listed while a gate is pending, but they must not claim completion.

The release is ready only when every required gate evaluates to `pass`. Tests, templates, scripts, old videos, localhost, draft URLs, and designed cards do not prove independent scientific approval, five-person usability, public deployment, accepted media, or completed submission.

## Adding authentic proof

1. Finish the outside action against the exact audited build.
2. Save a minimal receipt, structured result, or verification record without credentials or private account data.
3. Record the artifact using the audited build fingerprint.
4. Run `npm run audit:release` after the release auditor is installed.
5. Keep the gate pending if the artifact is incomplete, from another build, or cannot be independently checked.
