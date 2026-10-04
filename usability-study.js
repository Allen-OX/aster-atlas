const nonempty = value => typeof value === 'string' && value.length > 0;
const finiteNonnegative = value => Number.isFinite(value) && value >= 0;
const wholeNonnegative = value => Number.isInteger(value) && value >= 0;
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const personalKey = key => /^(name|email|demographics?|age|gender|sex|ip|ipaddress|notes?|freeform)$/i.test(key);
const answerKeys = Object.freeze(['problem', 'opportunity', 'limitation', 'nextAction']);

function containsPersonalFields(value) {
  if (!object(value) && !Array.isArray(value)) return false;
  return Object.entries(value).some(([key, child]) => personalKey(key) || containsPersonalFields(child));
}

function assertNoPersonalFields(value) {
  if (containsPersonalFields(value)) throw new TypeError('Personal fields are not permitted in usability records.');
}

export function createUsabilitySession(input) {
  if (!object(input)) throw new TypeError('Session input must be an object.');
  assertNoPersonalFields(input);
  if (!/^P(?:[1-9]|[1-9]\d)$/.test(input.participantCode || '')) throw new TypeError('Participant code must be P1 through P99.');
  if (!nonempty(input.buildFingerprint)) throw new TypeError('Build fingerprint is required.');
  if (!object(input.viewport)
    || !Number.isInteger(input.viewport.width)
    || !Number.isInteger(input.viewport.height)
    || input.viewport.width <= 0
    || input.viewport.height <= 0) throw new TypeError('Viewport width and height must be positive integers.');
  if (!finiteNonnegative(input.startedAtMs)) throw new TypeError('Start time must be finite and nonnegative.');
  return Object.freeze({
    schemaVersion: 1,
    status: 'in-progress',
    participantCode: input.participantCode,
    buildFingerprint: input.buildFingerprint,
    viewport: Object.freeze({ width: input.viewport.width, height: input.viewport.height }),
    startedAtMs: input.startedAtMs,
  });
}

export function completeUsabilitySession(session, result) {
  if (!object(session) || session.status !== 'in-progress') throw new TypeError('An in-progress session is required.');
  if (!object(result)) throw new TypeError('Completion result must be an object.');
  assertNoPersonalFields(result);
  if (!finiteNonnegative(result.completedAtMs) || result.completedAtMs < session.startedAtMs) throw new TypeError('Completion time must be finite and no earlier than start time.');
  if (typeof result.completedJourney !== 'boolean') throw new TypeError('completedJourney must be boolean.');
  if (!wholeNonnegative(result.helpCount)) throw new TypeError('Help count must be a nonnegative integer.');
  if (!wholeNonnegative(result.wrongTurns)) throw new TypeError('Wrong turns must be a nonnegative integer.');
  if (!object(result.answers)
    || Object.keys(result.answers).length !== answerKeys.length
    || !answerKeys.every(key => typeof result.answers[key] === 'boolean')) {
    throw new TypeError('All four comprehension answers must be boolean.');
  }

  const durationSeconds = (result.completedAtMs - session.startedAtMs) / 1000;
  const unassisted = result.helpCount === 0;
  const comprehensionPassed = result.answers.limitation && result.answers.nextAction;
  const success = result.completedJourney && unassisted && durationSeconds < 60 && comprehensionPassed;
  return Object.freeze({
    ...session,
    viewport: { ...session.viewport },
    status: 'complete',
    completedAtMs: result.completedAtMs,
    durationSeconds,
    completedJourney: result.completedJourney,
    helpCount: result.helpCount,
    wrongTurns: result.wrongTurns,
    answers: Object.freeze({ ...result.answers }),
    unassisted,
    comprehensionPassed,
    success,
  });
}

export function summarizeUsabilityStudy(sessions) {
  const values = Array.isArray(sessions) ? sessions : [];
  const reasons = [];
  if (values.length !== 5) reasons.push('The study requires exactly five genuine participants.');
  const codes = values.map(session => session?.participantCode);
  if (new Set(codes).size !== codes.length) reasons.push('Duplicate participant codes are not allowed.');
  const builds = new Set(values.map(session => session?.buildFingerprint));
  if (builds.size > 1) reasons.push('Every participant must test the same build.');
  if (values.some(session => session?.status !== 'complete')) reasons.push('Every session must be complete.');
  const successes = values.filter(session => session?.success === true).length;
  if (successes < 4) reasons.push('At least four participants must finish unassisted in under 60 seconds and identify the limitation and next action.');
  const durations = values
    .map(session => session?.durationSeconds)
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  const medianSeconds = durations.length
    ? durations.length % 2
      ? durations[(durations.length - 1) / 2]
      : (durations[durations.length / 2 - 1] + durations[durations.length / 2]) / 2
    : null;
  return {
    passed: reasons.length === 0,
    reasons,
    metrics: {
      participants: values.length,
      successes,
      medianSeconds,
      buildFingerprint: builds.size === 1 ? [...builds][0] : null,
    },
  };
}

export function serializeUsabilityStudy(sessions) {
  const sorted = structuredClone(Array.isArray(sessions) ? sessions : [])
    .sort((a, b) => String(a.participantCode).localeCompare(String(b.participantCode), undefined, { numeric: true }));
  assertNoPersonalFields(sorted);
  return `${JSON.stringify({ schemaVersion: 1, summary: summarizeUsabilityStudy(sorted), sessions: sorted }, null, 2)}\n`;
}
