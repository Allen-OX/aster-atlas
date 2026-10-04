# Aster Atlas final release checklist

This checklist is the human-readable companion to `release/submission-checklist.json`. A release is ready only when the machine-readable checklist validates with `ready: true` and the release audit also reports `ready: yes`. A prepared template, local test, old recording, localhost URL, or verbal confirmation is not completion evidence.

## Freeze one build

1. Run `npm run verify` from the repository root.
2. Commit the intended release so the working tree is clean.
3. Run `npm run audit:release -- --output release-audit/latest`.
4. Copy the full `sha256:…` value from `release-audit/latest/audit.json` into `release/submission-checklist.json`.
5. Put the same value, with no extra text, in `submission-media/build-fingerprint.txt` before auditing the final videos.
6. Re-run the audit after every release-file change. Any changed fingerprint invalidates earlier build-parity evidence.

## Required evidence

| Gate | Completion evidence | Current state |
| --- | --- | --- |
| Automated code and server checks | Passing `npm run verify` and isolated-copy smoke results in the audit | Implemented; re-run on frozen build |
| Browser/accessibility matrix | Final-build report and screenshots for desktop, mobile, 320 CSS px/200% zoom, keyboard, reduced motion, `?no3d=1`, stale search, dialog focus, and zero console errors | Pending final matrix |
| Independent scientific review | Completed review JSON covering every claim, with real reviewer identity, role, date, decision, note, and matching fingerprint | Pending external |
| Resource-owner confirmation | Retained response confirming access, current availability, terms, and suitability discussion; no silence-as-consent | Pending external |
| Five-person usability study | Five genuine unfamiliar participant records from one build; at least four complete unassisted in under 60 seconds and answer all four comprehension checks | Pending external |
| Public repository | Judge-accessible `https://github.com/<owner>/<repo>` plus a dated proof record | Pending external |
| Live deployment | Judge-accessible non-localhost HTTPS URL plus a dated proof record | Pending external |
| Team photograph | Accepted final file and proof that it meets the portal requirement | Pending external |
| Team-introduction video | Final-build file, measured at no more than 60 seconds, reviewed for privacy and linked to proof | Pending external |
| Product-demo video | Final-build file, measured at no more than 60 seconds, readable evidence shown, linked to proof | Pending external |
| Technical-walkthrough video | Final-build file, measured at no more than 60 seconds, current test/audit output shown, linked to proof | Pending external |
| OpenAI eligibility | Organizer/sponsor confirmation for the disclosed Codex use, retained as build-matched proof | Pending external |
| HackOS submission | Completed receipt or confirmation tied to the frozen build | Pending external |
| Organizer form | Completed receipt or confirmation tied to the frozen build | Pending external |

## Exact disclosure and product claims

Use this disclosure without shortening it:

> OpenAI Codex assisted implementation and build-time structured extraction; no runtime model or paid API call is used. The exact session model identifier is unknown, and independent expert review is pending.

The final pitch may claim that Aster Atlas:

- connects a small, source-linked graph of rare diseases, genes, variants, phenotypes, studies, researchers, organizations, and reusable research assets;
- exposes the exact evidence and limitation behind each displayed research connection;
- proposes a model-and-assay suitability review and a source-bound contact action;
- deterministically blocks unsupported paths and clears stale recommendations;
- presents a testable **10 fragmented weeks / 1 atlas-assisted week = 10× coordination hypothesis**.

The final pitch must not call the hypothesis a measured outcome, claim faster biology, diagnose or recommend treatment, determine study eligibility, promise asset availability, imply owner consent, or describe pending claims as expert-approved.

## Final command

Run:

```text
npm run verify && npm run audit:release -- --output release-audit/latest
```

Do not submit unless the audit shows a clean repository, matching build fingerprint, no configured secret findings, current media, completed submission package, and all required release gates at `pass`. Preserve the audit, proof JSON files, upload receipts, and submission confirmations together.
