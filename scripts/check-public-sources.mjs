import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkPublicSource } from '../release-audit.js';
import { evidencePackage } from '../win-evidence.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputIndex = process.argv.indexOf('--output');
const output = path.resolve(root, outputIndex >= 0 ? process.argv[outputIndex + 1] : 'release/source-checks.json');
const timeoutIndex = process.argv.indexOf('--timeout');
const timeoutMs = timeoutIndex >= 0 ? Number(process.argv[timeoutIndex + 1]) : 8_000;
if (!Number.isFinite(timeoutMs) || timeoutMs < 250 || timeoutMs > 30_000) throw new TypeError('Timeout must be between 250 and 30000 ms.');

const checkedAt = new Date().toISOString();
const checks = [];
for (const source of evidencePackage.sources) {
  checks.push(await checkPublicSource(source, { timeoutMs, checkedAt }));
}
await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify({ schemaVersion: 1, checkedAt, checks }, null, 2)}\n`);
const reachable = checks.filter(check => check.status === 'reachable').length;
console.log(`Checked ${checks.length} public sources: ${reachable} reachable, ${checks.length - reachable} unreachable.`);
if (reachable !== checks.length) process.exitCode = 2;
