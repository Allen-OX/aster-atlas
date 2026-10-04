import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GATE_STATES,
  buildReleaseManifest,
  evaluateReleaseGate,
  summarizeRelease,
  validateReleaseManifest,
} from './release-gates.js';

const proof = (overrides = {}) => ({
  kind: 'test-report',
  path: 'release-audit/tests.json',
  recordedAt: '2026-10-04T08:00:00.000Z',
  buildFingerprint: 'sha256:build-123',
  ...overrides,
});

const gate = (overrides = {}) => ({
  id: 'automated-tests',
  dimension: 'code-and-functionality',
  required: true,
  external: false,
  state: 'pass',
  evidence: [proof()],
  ...overrides,
});

const manifest = (gates) => ({
  schemaVersion: 1,
  build: {
    fingerprint: 'sha256:build-123',
    generatedAt: '2026-10-04T08:00:00.000Z',
  },
  gates,
});

test('accepts exactly the four release states', () => {
  assert.deepEqual(GATE_STATES, ['pass', 'fail', 'pending-external', 'not-run']);
  for (const state of GATE_STATES) {
    const value = gate({ state, evidence: state === 'pass' ? [proof()] : [] });
    assert.equal(validateReleaseManifest(manifest([value])).valid, true, state);
  }
  const result = validateReleaseManifest(manifest([gate({ state: 'ready' })]));
  assert.equal(result.valid, false);
  assert.match(result.errors.join('\n'), /unsupported state/i);
});

test('rejects duplicate IDs and missing dimensions', () => {
  const result = validateReleaseManifest(manifest([
    gate(),
    gate({ dimension: '' }),
  ]));
  assert.equal(result.valid, false);
  assert.match(result.errors.join('\n'), /duplicate gate id/i);
  assert.match(result.errors.join('\n'), /dimension/i);
});

test('a pass requires complete evidence tied to the manifest build', () => {
  for (const missing of ['kind', 'path', 'recordedAt', 'buildFingerprint']) {
    const incomplete = proof();
    delete incomplete[missing];
    const result = validateReleaseManifest(manifest([gate({ evidence: [incomplete] })]));
    assert.equal(result.valid, false, missing);
    assert.match(result.errors.join('\n'), new RegExp(missing, 'i'));
  }

  const mismatch = validateReleaseManifest(manifest([
    gate({ evidence: [proof({ buildFingerprint: 'sha256:other' })] }),
  ]));
  assert.equal(mismatch.valid, false);
  assert.match(mismatch.errors.join('\n'), /fingerprint/i);

  const malformedDate = validateReleaseManifest(manifest([
    gate({ evidence: [proof({ recordedAt: 'yesterday' })] }),
  ]));
  assert.equal(malformedDate.valid, false);
  assert.match(malformedDate.errors.join('\n'), /recordedAt.*ISO/i);
});

test('forged external pass is downgraded to fail without completion proof', () => {
  const input = gate({
    id: 'hackos-confirmation',
    dimension: 'submission-readiness',
    external: true,
    evidence: [proof({ kind: 'prepared-checklist' })],
  });
  const result = evaluateReleaseGate(input);
  assert.equal(result.state, 'fail');
  assert.match(result.reasons.join('\n'), /completion evidence/i);

  const completed = evaluateReleaseGate({
    ...input,
    evidence: [proof({ kind: 'submission-receipt', completion: true })],
  });
  assert.equal(completed.state, 'pass');
});

test('pending external gates cannot carry a completion claim', () => {
  const result = validateReleaseManifest(manifest([
    gate({
      id: 'expert-review',
      dimension: 'scientific-credibility',
      external: true,
      state: 'pending-external',
      evidence: [proof({ kind: 'review-template', completion: true })],
    }),
  ]));
  assert.equal(result.valid, false);
  assert.match(result.errors.join('\n'), /pending.*completion/i);
});

test('evaluation and manifest construction never mutate caller input', () => {
  const input = manifest([gate()]);
  const before = structuredClone(input);
  evaluateReleaseGate(input.gates[0]);
  const built = buildReleaseManifest(input);
  assert.deepEqual(input, before);
  assert.notEqual(built, input);
  assert.notEqual(built.gates, input.gates);
});

test('dimension roll-up preserves the most blocking state', () => {
  const value = manifest([
    gate({ id: 'tests' }),
    gate({ id: 'browser', state: 'not-run', evidence: [] }),
    gate({ id: 'expert', dimension: 'scientific-credibility', state: 'pending-external', evidence: [], external: true }),
    gate({ id: 'submission', dimension: 'submission-readiness', state: 'fail', evidence: [] }),
  ]);
  const summary = summarizeRelease(value);
  assert.equal(summary.ready, false);
  assert.deepEqual(summary.dimensions, {
    'code-and-functionality': 'not-run',
    'scientific-credibility': 'pending-external',
    'submission-readiness': 'fail',
  });
  assert.deepEqual(summary.totals, { pass: 1, fail: 1, 'pending-external': 1, 'not-run': 1 });
});

test('only an all-pass required manifest is release ready', () => {
  const value = manifest([
    gate({ id: 'code' }),
    gate({ id: 'design', dimension: 'product-design' }),
    gate({
      id: 'expert-review',
      dimension: 'scientific-credibility',
      external: true,
      evidence: [proof({ kind: 'signed-review', completion: true })],
    }),
  ]);
  const summary = summarizeRelease(value);
  assert.equal(summary.ready, true);
  assert.deepEqual(summary.dimensions, {
    'code-and-functionality': 'pass',
    'product-design': 'pass',
    'scientific-credibility': 'pass',
  });
});
