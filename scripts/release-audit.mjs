import { spawnSync } from 'node:child_process';
import { access, cp, mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  composeAuditManifest,
  fingerprintFiles,
  isBuildArtifactPath,
  renderAuditMarkdown,
  scanTextForSecrets,
  validateSubmissionChecklist,
} from '../release-audit.js';
import { summarizeRelease, validateReleaseManifest } from '../release-gates.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputIndex = process.argv.indexOf('--output');
const stamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-');
const output = path.resolve(root, outputIndex >= 0 ? process.argv[outputIndex + 1] : `release-audit/${stamp}`);
const excludedDirectories = new Set(['.git', '.superpowers', '.aster-state', '__pycache__', 'node_modules', 'release-audit', 'submission-media']);
const fingerprintTraversalExcludedDirectories = new Set([...excludedDirectories, 'release', 'design', 'docs']);
const textExtensions = new Set(['.html', '.js', '.css', '.json', '.svg', '.geojson', '.py']);

async function collectFiles(directory = root) {
  const values = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && fingerprintTraversalExcludedDirectories.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) values.push(...await collectFiles(absolute));
    else if (entry.isFile()) {
      const relative = path.relative(root, absolute).replaceAll(path.sep, '/');
      if (isBuildArtifactPath(relative)) values.push({ path: relative, absolute });
    }
  }
  return values;
}

function run(command, args, cwd = root) {
  const started = Date.now();
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
  return {
    ok: result.status === 0,
    status: result.status,
    durationMs: Date.now() - started,
    command: [command, ...args].join(' '),
    tail: `${result.stdout || ''}\n${result.stderr || ''}`.trim().slice(-4_000),
  };
}

async function readJsonArtifact(relativePath) {
  const absolute = path.join(root, relativePath);
  try {
    return { path: relativePath, value: JSON.parse(await readFile(absolute, 'utf8')) };
  } catch (error) {
    if (error?.code === 'ENOENT') return null;
    return { path: relativePath, error: 'Malformed or unreadable JSON' };
  }
}

async function mediaRecord(role, relativePath, buildFingerprint) {
  const absolute = path.join(root, relativePath);
  const exists = await access(absolute).then(() => true).catch(() => false);
  let durationSeconds = null;
  if (exists) {
    const probe = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', absolute], { encoding: 'utf8' });
    const parsed = Number(probe.stdout?.trim());
    if (probe.status === 0 && Number.isFinite(parsed)) durationSeconds = parsed;
  }
  const fingerprintFile = path.join(root, 'submission-media', 'build-fingerprint.txt');
  const recordedFingerprint = await readFile(fingerprintFile, 'utf8').then(value => value.trim()).catch(() => null);
  return { role, path: relativePath, exists, durationSeconds, buildFingerprint: recordedFingerprint || null, auditedFingerprint: buildFingerprint };
}

async function cleanSmoke() {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'aster-release-audit-'));
  try {
    await cp(root, temporary, {
      recursive: true,
      filter: source => {
        const relative = path.relative(root, source);
        if (!relative) return true;
        return !relative.split(path.sep).some(part => excludedDirectories.has(part));
      },
    });
    const javascript = run('node', ['--test'], temporary);
    const server = run('python3', ['-m', 'unittest', '-v', 'universe_server_test.py'], temporary);
    return { ok: javascript.ok && server.ok, javascript, server };
  } finally {
    const normalized = path.resolve(temporary);
    if (normalized.startsWith(path.resolve(os.tmpdir()) + path.sep) && path.basename(normalized).startsWith('aster-release-audit-')) {
      await rm(normalized, { recursive: true, force: true });
    }
  }
}

const releaseFiles = await collectFiles();
const fingerprintInput = await Promise.all(releaseFiles.map(async file => ({ path: file.path, content: await readFile(file.absolute) })));
const buildFingerprint = fingerprintFiles(fingerprintInput);
const generatedAt = new Date().toISOString();
const javascript = run('node', ['--test']);
const server = run('python3', ['-m', 'unittest', '-v', 'universe_server_test.py']);
const clean = await cleanSmoke();
const commit = run('git', ['rev-parse', '--short=12', 'HEAD']).tail.split(/\s/)[0] || null;
const status = run('git', ['status', '--porcelain=v1', '--untracked-files=all']);
const dirty = Boolean(status.tail.trim());

const privacyFindings = [];
for (const file of releaseFiles.filter(file => textExtensions.has(path.extname(file.path).toLowerCase()))) {
  privacyFindings.push(...scanTextForSecrets(file.path, await readFile(file.absolute, 'utf8')));
}

const proofArtifacts = (await Promise.all([
  'release/scientific-review-completed.json',
  'release/usability-study.json',
  'release/submission-confirmations.json',
].map(readJsonArtifact))).filter(Boolean);

const sourceArtifact = await readJsonArtifact('release/source-checks.json');
const sources = Array.isArray(sourceArtifact?.value?.checks) ? sourceArtifact.value.checks : [];
const media = await Promise.all([
  ['team-introduction', 'submission-media/aster-atlas-team.mp4'],
  ['product-demo', 'submission-media/aster-atlas-demo.mp4'],
  ['technical-walkthrough', 'submission-media/aster-atlas-tech.mp4'],
].map(([role, mediaPath]) => mediaRecord(role, mediaPath, buildFingerprint)));

const baseline = JSON.parse(await readFile(path.join(root, 'release', 'release-evidence.json'), 'utf8'));
baseline.build = { fingerprint: buildFingerprint, generatedAt };
const automated = baseline.gates.find(gate => gate.id === 'automated-tests');
if (javascript.ok && server.ok && clean.ok) {
  automated.state = 'pass';
  automated.evidence = [{ kind: 'test-report', path: path.relative(root, path.join(output, 'audit.json')).replaceAll(path.sep, '/'), recordedAt: generatedAt, buildFingerprint }];
}
const baselineValidation = validateReleaseManifest(baseline);
if (!baselineValidation.valid) proofArtifacts.push({ path: 'release/release-evidence.json', error: 'Release manifest failed validation' });
const releaseSummary = summarizeRelease(baseline);
const submissionChecklist = JSON.parse(await readFile(path.join(root, 'release', 'submission-checklist.json'), 'utf8'));
submissionChecklist.buildFingerprint = buildFingerprint;
const submissionValidation = validateSubmissionChecklist(submissionChecklist);

const audit = composeAuditManifest({
  generatedAt,
  buildFingerprint,
  git: { commit, dirty },
  tests: { javascript, server, cleanSmoke: clean },
  proofArtifacts,
  privacyFindings,
  media,
  sources,
  submissionValidation,
  releaseSummary,
});
audit.inputs = {
  releaseFileCount: releaseFiles.length,
  proofArtifactPaths: proofArtifacts.map(artifact => artifact.path),
  sourceChecksRecorded: sources.length,
  mediaRecords: media.map(item => ({ role: item.role, path: item.path, exists: item.exists, durationSeconds: item.durationSeconds, buildFingerprint: item.buildFingerprint })),
};

await mkdir(output, { recursive: true });
await writeFile(path.join(output, 'audit.json'), `${JSON.stringify(audit, null, 2)}\n`);
await writeFile(path.join(output, 'audit.md'), renderAuditMarkdown(audit));
await writeFile(path.join(output, 'build-files.json'), `${JSON.stringify({ fingerprint: buildFingerprint, files: releaseFiles.map(file => file.path) }, null, 2)}\n`);
console.log(`Release audit written to ${path.relative(root, output) || output}`);
console.log(`Build ${buildFingerprint} · ready: ${audit.ready ? 'yes' : 'no'}`);
for (const [name, result] of Object.entries(audit.checks)) console.log(`${name}: ${result.state} — ${result.detail}`);
if (!javascript.ok || !server.ok || !clean.ok) process.exitCode = 1;
