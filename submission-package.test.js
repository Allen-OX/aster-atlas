import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { OPENAI_DISCLOSURE, validateSubmissionChecklist } from './release-audit.js';

const baseline = JSON.parse(await readFile(new URL('./release/submission-checklist.json', import.meta.url), 'utf8'));
const fingerprint = 'sha256:final-build';
const proof = (kind, path) => ({ kind, path, recordedAt: '2026-10-04T08:00:00.000Z', buildFingerprint: fingerprint, completion: true });

const completed = () => ({
  ...structuredClone(baseline),
  buildFingerprint: fingerprint,
  openAiDisclosure: OPENAI_DISCLOSURE,
  repository: { status: 'pass', url: 'https://github.com/allen-ox/aster-atlas', proof: proof('public-repository-check', 'release/repository-proof.json') },
  deployment: { status: 'pass', url: 'https://allen-ox.github.io/aster-atlas/', proof: proof('deployment-check', 'release/deployment-proof.json') },
  teamPhoto: { status: 'pass', path: 'submission-media/team-photo.jpg', proof: proof('team-photo-check', 'release/team-photo-proof.json') },
  scientificReview: { status: 'pass', proof: proof('signed-scientific-review', 'release/scientific-review-completed.json') },
  usabilityStudy: { status: 'pass', proof: proof('five-person-usability-study', 'release/usability-study.json') },
  openAiEligibility: { status: 'pass', proof: proof('organizer-eligibility-confirmation', 'release/openai-eligibility.json') },
  videos: [
    { role: 'team-introduction', status: 'pass', path: 'submission-media/team.mp4', durationSeconds: 50, buildFingerprint: fingerprint, proof: proof('media-check', 'release/team-video-proof.json') },
    { role: 'product-demo', status: 'pass', path: 'submission-media/demo.mp4', durationSeconds: 55, buildFingerprint: fingerprint, proof: proof('media-check', 'release/demo-video-proof.json') },
    { role: 'technical-walkthrough', status: 'pass', path: 'submission-media/technical.mp4', durationSeconds: 59.5, buildFingerprint: fingerprint, proof: proof('media-check', 'release/technical-video-proof.json') },
  ],
  hackos: { status: 'pass', proof: proof('submission-receipt', 'release/hackos-receipt.json') },
  organizerForm: { status: 'pass', proof: proof('submission-receipt', 'release/organizer-form-receipt.json') },
});

test('baseline checklist contains every required deliverable and remains pending', () => {
  assert.equal(baseline.schemaVersion, 1);
  assert.deepEqual(baseline.videos.map(video => video.role).sort(), ['product-demo', 'team-introduction', 'technical-walkthrough']);
  assert.equal(baseline.openAiDisclosure, OPENAI_DISCLOSURE);
  const result = validateSubmissionChecklist(baseline);
  assert.equal(result.valid, true);
  assert.equal(result.ready, false);
  assert.ok(result.pending.includes('scientificReview'));
  assert.ok(result.pending.includes('usabilityStudy'));
});

test('a complete exact-build package with all receipts is ready', () => {
  const result = validateSubmissionChecklist(completed());
  assert.deepEqual(result, { valid: true, ready: true, errors: [], pending: [] });
});

test('completed repository and deployment require judge-accessible HTTPS URLs', () => {
  for (const [field, url] of [
    ['repository', 'http://github.com/allen-ox/aster-atlas'],
    ['repository', 'https://example.com/repo'],
    ['deployment', 'http://localhost:4173/'],
    ['deployment', 'file:///tmp/index.html'],
  ]) {
    const value = completed();
    value[field].url = url;
    const result = validateSubmissionChecklist(value);
    assert.equal(result.ready, false, `${field}: ${url}`);
    assert.match(result.errors.join('\n'), field === 'repository' ? /GitHub/i : /HTTPS deployment/i);
  }
});

test('all three videos must be final-build files no longer than 60 seconds', () => {
  for (const mutation of [
    video => { video.durationSeconds = 60.01; },
    video => { video.durationSeconds = null; },
    video => { video.buildFingerprint = 'sha256:older-build'; },
    video => { video.path = ''; },
  ]) {
    const value = completed();
    mutation(value.videos[1]);
    const result = validateSubmissionChecklist(value);
    assert.equal(result.ready, false);
    assert.ok(result.errors.length > 0);
  }
});

test('team photo, HackOS, organizer form, and every pass require matching completion proof', () => {
  for (const mutate of [
    value => { value.teamPhoto.proof = null; },
    value => { value.hackos.proof = null; },
    value => { value.organizerForm.proof = null; },
    value => { value.repository.proof.buildFingerprint = 'sha256:other'; },
    value => { value.deployment.proof.completion = false; },
    value => { value.hackos.proof.recordedAt = 'yesterday'; },
  ]) {
    const value = completed();
    mutate(value);
    const result = validateSubmissionChecklist(value);
    assert.equal(result.ready, false);
    assert.match(result.errors.join('\n'), /proof/i);
  }
});

test('completed records reject placeholders and imprecise OpenAI disclosure', () => {
  const placeholder = completed();
  placeholder.teamPhoto.path = 'TODO/team-photo.jpg';
  assert.match(validateSubmissionChecklist(placeholder).errors.join('\n'), /placeholder/i);

  const vague = completed();
  vague.openAiDisclosure = 'We used AI.';
  assert.match(validateSubmissionChecklist(vague).errors.join('\n'), /OpenAI disclosure/i);
});

test('a failed required deliverable can never produce a ready package', () => {
  for (const mutate of [
    value => { value.scientificReview.status = 'fail'; },
    value => { value.videos[0].status = 'fail'; },
  ]) {
    const value = completed();
    mutate(value);
    const result = validateSubmissionChecklist(value);
    assert.equal(result.ready, false);
    assert.match(result.errors.join('\n'), /failed/i);
  }
});
