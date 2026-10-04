import test from 'node:test';
import assert from 'node:assert/strict';
import {
  completeUsabilitySession,
  createUsabilitySession,
  serializeUsabilityStudy,
  summarizeUsabilityStudy,
} from './usability-study.js';

const create = (participantCode = 'P1', overrides = {}) => createUsabilitySession({
  participantCode,
  buildFingerprint: 'sha256:final-build',
  viewport: { width: 1280, height: 720 },
  startedAtMs: 1_000,
  ...overrides,
});

const finish = (participantCode = 'P1', overrides = {}) => completeUsabilitySession(
  create(participantCode, overrides.session),
  {
    completedAtMs: 51_000,
    completedJourney: true,
    helpCount: 0,
    wrongTurns: 0,
    answers: { problem: true, opportunity: true, limitation: true, nextAction: true },
    ...overrides.result,
  },
);

test('accepts only anonymous participant codes P1 through P99', () => {
  for (const code of ['P1', 'P9', 'P10', 'P99']) assert.equal(create(code).participantCode, code);
  for (const code of ['P0', 'P100', 'p1', 'Participant 1', '', ' P1 ']) {
    assert.throws(() => create(code), /participant code/i, code);
  }
});

test('requires a build fingerprint, viewport, and finite nonnegative start time', () => {
  assert.throws(() => create('P1', { buildFingerprint: '' }), /build fingerprint/i);
  assert.throws(() => create('P1', { viewport: { width: 0, height: 720 } }), /viewport/i);
  assert.throws(() => create('P1', { viewport: { width: 390 } }), /viewport/i);
  assert.throws(() => create('P1', { startedAtMs: -1 }), /start time/i);
  assert.throws(() => create('P1', { startedAtMs: Infinity }), /start time/i);
});

test('completion is monotonic, immutable, and records structured outcomes', () => {
  const session = create();
  const before = structuredClone(session);
  const result = completeUsabilitySession(session, {
    completedAtMs: 61_000,
    completedJourney: true,
    helpCount: 1,
    wrongTurns: 2,
    answers: { problem: true, opportunity: false, limitation: true, nextAction: true },
  });
  assert.deepEqual(session, before);
  assert.equal(result.durationSeconds, 60);
  assert.equal(result.unassisted, false);
  assert.equal(result.success, false);
  assert.equal(result.helpCount, 1);
  assert.equal(result.wrongTurns, 2);
  assert.throws(() => completeUsabilitySession(session, { completedAtMs: 999 }), /completion time/i);
});

test('completion requires nonnegative counts and four boolean answers', () => {
  const base = {
    completedAtMs: 2_000,
    completedJourney: true,
    helpCount: 0,
    wrongTurns: 0,
    answers: { problem: true, opportunity: true, limitation: true, nextAction: true },
  };
  assert.throws(() => completeUsabilitySession(create(), { ...base, helpCount: -1 }), /help count/i);
  assert.throws(() => completeUsabilitySession(create(), { ...base, wrongTurns: 1.5 }), /wrong turns/i);
  assert.throws(() => completeUsabilitySession(create(), { ...base, answers: { limitation: true } }), /four comprehension/i);
  assert.throws(() => completeUsabilitySession(create(), { ...base, answers: { ...base.answers, problem: 'yes' } }), /four comprehension/i);
});

test('exactly four of five unassisted sub-60-second final-build sessions pass', () => {
  const sessions = [1, 2, 3, 4].map(index => finish(`P${index}`));
  sessions.push(finish('P5', { result: { completedAtMs: 72_000 } }));
  const summary = summarizeUsabilityStudy(sessions);
  assert.equal(summary.passed, true);
  assert.equal(summary.metrics.participants, 5);
  assert.equal(summary.metrics.successes, 4);
  assert.equal(summary.metrics.medianSeconds, 50);
});

test('fewer people, duplicate participants, mixed builds, help, or missed comprehension keep the study open', () => {
  const four = [1, 2, 3, 4].map(index => finish(`P${index}`));
  assert.equal(summarizeUsabilityStudy(four).passed, false);
  assert.match(summarizeUsabilityStudy(four).reasons.join('\n'), /exactly five/i);

  const duplicate = [...four, finish('P4')];
  assert.match(summarizeUsabilityStudy(duplicate).reasons.join('\n'), /duplicate/i);

  const mixed = [...four, finish('P5', { session: { buildFingerprint: 'sha256:other-build' } })];
  assert.match(summarizeUsabilityStudy(mixed).reasons.join('\n'), /same build/i);

  const weak = [
    finish('P1'),
    finish('P2'),
    finish('P3'),
    finish('P4', { result: { helpCount: 1 } }),
    finish('P5', { result: { answers: { problem: true, opportunity: true, limitation: false, nextAction: true } } }),
  ];
  assert.equal(summarizeUsabilityStudy(weak).passed, false);
  assert.equal(summarizeUsabilityStudy(weak).metrics.successes, 3);
});

test('personal or free-form participant fields are rejected and never serialized', () => {
  for (const forbidden of [
    { name: 'Person' },
    { email: 'person@example.org' },
    { demographics: { age: 42 } },
    { ipAddress: '127.0.0.1' },
  ]) {
    assert.throws(() => create('P1', forbidden), /personal fields/i);
  }
  const session = finish('P1');
  const json = serializeUsabilityStudy([session]);
  assert.doesNotMatch(json, /name|email|demographic|ipAddress/i);
  const parsed = JSON.parse(json);
  assert.equal(parsed.sessions[0].participantCode, 'P1');
  assert.equal(parsed.summary.passed, false);
});
