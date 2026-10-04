import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {
  checkPublicSource,
  composeAuditManifest,
  fingerprintFiles,
  redactFinding,
  validateMediaRecord,
} from './release-audit.js';

const buildFingerprint = 'sha256:audited-build';

test('file fingerprints are path-sorted, stable, and content-sensitive', () => {
  const first = fingerprintFiles([
    { path: 'b.js', content: 'second' },
    { path: 'a.js', content: 'first' },
  ]);
  const reordered = fingerprintFiles([
    { path: 'a.js', content: 'first' },
    { path: 'b.js', content: 'second' },
  ]);
  const changed = fingerprintFiles([
    { path: 'a.js', content: 'FIRST' },
    { path: 'b.js', content: 'second' },
  ]);
  assert.match(first, /^sha256:[a-f0-9]{64}$/);
  assert.equal(first, reordered);
  assert.notEqual(first, changed);
});

test('media records fail for missing files, over-60 duration, or build mismatch', () => {
  const valid = { role: 'product-demo', path: 'submission-media/demo.mp4', exists: true, durationSeconds: 59.9, buildFingerprint };
  assert.deepEqual(validateMediaRecord(valid, buildFingerprint), { valid: true, errors: [] });
  assert.match(validateMediaRecord({ ...valid, exists: false }, buildFingerprint).errors.join('\n'), /missing/i);
  assert.match(validateMediaRecord({ ...valid, durationSeconds: 60.01 }, buildFingerprint).errors.join('\n'), /60 seconds/i);
  assert.match(validateMediaRecord({ ...valid, buildFingerprint: 'sha256:other' }, buildFingerprint).errors.join('\n'), /fingerprint/i);
  assert.match(validateMediaRecord({ ...valid, durationSeconds: null }, buildFingerprint).errors.join('\n'), /duration/i);
});

test('secret findings expose only location and category', () => {
  const result = redactFinding({
    file: 'config.js',
    line: 12,
    category: 'api-key',
    value: 'sk-sensitive-value',
    excerpt: 'API_KEY=sk-sensitive-value',
  });
  assert.deepEqual(result, { file: 'config.js', line: 12, category: 'api-key' });
  assert.doesNotMatch(JSON.stringify(result), /sensitive/i);
});

test('audit composition reports dirty state and malformed proof without turning external gates green', () => {
  const result = composeAuditManifest({
    generatedAt: '2026-10-04T08:00:00.000Z',
    buildFingerprint,
    git: { commit: 'abc1234', dirty: true },
    tests: { javascript: { ok: true }, server: { ok: true }, cleanSmoke: { ok: true } },
    proofArtifacts: [{ path: 'release/expert-review.json', error: 'Malformed JSON' }],
    privacyFindings: [],
    media: [],
    sources: [{ sourceId: 'source-a', url: 'https://example.org', status: 'unreachable', checkedAt: '2026-10-04T08:00:00.000Z', detail: 'HTTP 503' }],
    releaseSummary: { ready: false, dimensions: { 'scientific-credibility': 'pending-external' }, totals: { pass: 0, fail: 0, 'pending-external': 1, 'not-run': 0 } },
  });
  assert.equal(result.checks.repository.state, 'fail');
  assert.match(result.checks.repository.detail, /dirty/i);
  assert.equal(result.checks.proofArtifacts.state, 'fail');
  assert.match(result.checks.proofArtifacts.detail, /malformed/i);
  assert.equal(result.checks.publicSources.state, 'fail');
  assert.equal(result.release.dimensions['scientific-credibility'], 'pending-external');
  assert.equal(result.ready, false);
});

test('public source checks use real bounded HTTP behavior and preserve source identity', async t => {
  const server = http.createServer((request, response) => {
    if (request.url === '/ok') { response.writeHead(200, { 'Content-Type': 'text/plain' }); response.end('ok'); return; }
    response.writeHead(503, { 'Content-Type': 'text/plain' }); response.end('unavailable');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const good = await checkPublicSource({ id: 'good', url: `${base}/ok` }, { timeoutMs: 1_000, checkedAt: '2026-10-04T08:00:00.000Z' });
  const bad = await checkPublicSource({ id: 'bad', url: `${base}/fail` }, { timeoutMs: 1_000, checkedAt: '2026-10-04T08:00:00.000Z' });
  assert.deepEqual(good, { sourceId: 'good', url: `${base}/ok`, status: 'reachable', checkedAt: '2026-10-04T08:00:00.000Z', detail: 'HTTP 200' });
  assert.deepEqual(bad, { sourceId: 'bad', url: `${base}/fail`, status: 'unreachable', checkedAt: '2026-10-04T08:00:00.000Z', detail: 'HTTP 503' });
});
