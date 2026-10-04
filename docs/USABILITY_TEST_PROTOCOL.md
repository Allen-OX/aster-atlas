# Aster Atlas five-person usability protocol

Status: prepared protocol. No participant result is implied by this document.

## Gate

The human-usability gate passes only when exactly five unfamiliar participants use the same final build and at least four complete the Judge Mode unassisted in under 60 seconds while correctly identifying the important limitation and next action. A changed build requires a fresh round.

## Privacy

Use codes `P1` through `P5`. Do not collect names, emails, demographics, IP addresses, recordings, or free-form participant notes. The local moderator page keeps the current study in memory and downloads structured JSON only when requested. It sends no telemetry.

## Moderator steps

1. Run `npm start` and open `http://127.0.0.1:4173/usability.html`.
2. Confirm the displayed build fingerprint matches the release being evaluated.
3. Seat an unfamiliar participant at the device and select the next participant code.
4. Read: “Please determine what Aster Atlas found, the most important limitation, and what should happen next. Tell me when you are finished.”
5. Start the timer. Do not coach, explain labels, or point to controls.
6. Stop after the participant says they are finished or abandons the task.
7. Ask, without leading:
   - What problem does Aster Atlas solve?
   - What research opportunity did it identify?
   - What important uncertainty or limitation remains?
   - What should happen next?
8. Mark structured outcomes, help requests, wrong turns, and correct answers.
9. Repeat for five genuine participants on the unchanged build.
10. Download the JSON result and attach it to the matching release fingerprint.

## Invalid rounds

Discard and repeat the round if the build changes, the moderator coaches, the participant is already familiar with the flow, timing is interrupted, or the result contains personal information. Do not merge results from multiple build fingerprints.
