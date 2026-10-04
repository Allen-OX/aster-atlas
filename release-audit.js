import { createHash } from 'node:crypto';

const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const releaseState = (state, detail, evidence = []) => ({ state, detail, evidence });

export function fingerprintFiles(files) {
  const sorted = [...(Array.isArray(files) ? files : [])]
    .map(file => ({ path: String(file.path).replaceAll('\\', '/'), content: file.content }))
    .sort((a, b) => a.path.localeCompare(b.path));
  if (new Set(sorted.map(file => file.path)).size !== sorted.length) throw new TypeError('Release file paths must be unique.');
  const hash = createHash('sha256');
  for (const file of sorted) {
    const content = Buffer.isBuffer(file.content) ? file.content : Buffer.from(String(file.content));
    hash.update(file.path);
    hash.update('\0');
    hash.update(String(content.byteLength));
    hash.update('\0');
    hash.update(content);
    hash.update('\0');
  }
  return `sha256:${hash.digest('hex')}`;
}

export function validateMediaRecord(record, fingerprint) {
  const errors = [];
  if (!record?.exists) errors.push(`Media file is missing: ${record?.path || 'unknown'}.`);
  if (!['team-introduction', 'product-demo', 'technical-walkthrough'].includes(record?.role)) errors.push('Media role is not recognized.');
  if (!Number.isFinite(record?.durationSeconds) || record.durationSeconds <= 0) errors.push('Media duration is not verified.');
  else if (record.durationSeconds > 60) errors.push('Media duration exceeds 60 seconds.');
  if (!nonempty(record?.buildFingerprint) || record.buildFingerprint !== fingerprint) errors.push('Media build fingerprint does not match the audited build.');
  return { valid: errors.length === 0, errors };
}

export function redactFinding(finding) {
  return {
    file: nonempty(finding?.file) ? finding.file : 'unknown',
    line: Number.isInteger(finding?.line) && finding.line > 0 ? finding.line : 1,
    category: nonempty(finding?.category) ? finding.category : 'potential-secret',
  };
}

export function scanTextForSecrets(path, text) {
  const patterns = [
    ['private-key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
    ['openai-api-key', /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/],
    ['github-token', /\bgh[pousr]_[A-Za-z0-9]{20,}\b/],
    ['generic-secret-assignment', /\b(?:api[_-]?key|secret|token|password)\s*[:=]\s*["'][^"'\s]{12,}["']/i],
  ];
  const findings = [];
  String(text).split(/\r?\n/).forEach((line, index) => {
    for (const [category, pattern] of patterns) {
      if (pattern.test(line)) findings.push(redactFinding({ file: path, line: index + 1, category }));
    }
  });
  return findings;
}

export async function checkPublicSource(source, { timeoutMs = 5_000, checkedAt = new Date().toISOString(), fetchImpl = fetch } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(source.url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: { Accept: 'text/html,application/json,application/pdf,text/plain;q=0.8,*/*;q=0.5' },
    });
    return {
      sourceId: source.id,
      url: source.url,
      status: response.ok ? 'reachable' : 'unreachable',
      checkedAt,
      detail: `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      sourceId: source.id,
      url: source.url,
      status: 'unreachable',
      checkedAt,
      detail: error?.name === 'AbortError' ? `Timed out after ${timeoutMs} ms` : 'Network request failed',
    };
  } finally {
    clearTimeout(timeout);
  }
}

export function composeAuditManifest(input) {
  const tests = Object.values(input.tests || {});
  const testsPass = tests.length > 0 && tests.every(result => result?.ok === true);
  const proofErrors = (input.proofArtifacts || []).filter(artifact => nonempty(artifact?.error));
  const privacy = (input.privacyFindings || []).map(redactFinding);
  const media = (input.media || []).map(record => ({ ...record, validation: validateMediaRecord(record, input.buildFingerprint) }));
  const sources = structuredClone(input.sources || []);
  const sourceFailures = sources.filter(source => source.status === 'unreachable');
  const release = structuredClone(input.releaseSummary || { ready: false, dimensions: {}, totals: {} });

  const checks = {
    tests: testsPass
      ? releaseState('pass', `${tests.length} test groups passed.`)
      : releaseState('fail', 'One or more test groups failed or were not run.'),
    repository: input.git?.dirty
      ? releaseState('fail', `Working tree is dirty at ${input.git?.commit || 'unknown commit'}.`)
      : releaseState('pass', `Clean working tree at ${input.git?.commit || 'unknown commit'}.`),
    proofArtifacts: proofErrors.length
      ? releaseState('fail', `Malformed or unreadable proof artifacts: ${proofErrors.map(item => item.path).join(', ')}.`)
      : releaseState((input.proofArtifacts || []).length ? 'pass' : 'not-run', (input.proofArtifacts || []).length ? 'Proof artifacts parsed.' : 'No completed proof artifacts supplied.'),
    privacy: privacy.length
      ? releaseState('fail', `${privacy.length} potential secret findings require review.`, privacy)
      : releaseState('pass', 'No configured secret patterns detected.'),
    media: media.length && media.every(item => item.validation.valid)
      ? releaseState('pass', 'All required media records match the build and duration limit.', media)
      : releaseState('pending-external', media.length ? 'Media records are incomplete, stale, or invalid.' : 'Current final-build media is not supplied.', media),
    publicSources: !sources.length
      ? releaseState('not-run', 'Public source access was not checked.')
      : sourceFailures.length
        ? releaseState('fail', `${sourceFailures.length} public sources were unreachable.`, sources)
        : releaseState('pass', `${sources.length} public sources were reachable.`, sources),
  };
  const internalReady = Object.values(checks).every(check => check.state === 'pass');
  return {
    schemaVersion: 1,
    generatedAt: input.generatedAt || new Date().toISOString(),
    build: { fingerprint: input.buildFingerprint, commit: input.git?.commit || null, dirty: Boolean(input.git?.dirty) },
    checks,
    release,
    ready: internalReady && release.ready === true,
  };
}

export function renderAuditMarkdown(audit) {
  const rows = Object.entries(audit.checks)
    .map(([name, result]) => `| ${name} | ${result.state} | ${result.detail} |`)
    .join('\n');
  const dimensions = Object.entries(audit.release.dimensions || {})
    .map(([name, state]) => `| ${name} | ${state} |`)
    .join('\n');
  return `# Aster Atlas release audit\n\nBuild: \`${audit.build.fingerprint}\`  \nCommit: \`${audit.build.commit || 'unknown'}\`  \nGenerated: ${audit.generatedAt}\n\n## Automated checks\n\n| Check | State | Detail |\n| --- | --- | --- |\n${rows}\n\n## Release dimensions\n\n| Dimension | State |\n| --- | --- |\n${dimensions}\n\nOverall ready: **${audit.ready ? 'yes' : 'no'}**\n`;
}
