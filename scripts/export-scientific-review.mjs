import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { evidencePackage } from '../win-evidence.js';
import { createScientificReviewTemplate, renderScientificReviewPacket } from '../scientific-review.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const targets = {
  json: path.join(root, 'release', 'scientific-review-template.json'),
  markdown: path.join(root, 'docs', 'EXPERT_REVIEW_PACKET.md'),
};
const template = createScientificReviewTemplate(evidencePackage);
const expected = {
  json: `${JSON.stringify(template, null, 2)}\n`,
  markdown: renderScientificReviewPacket(evidencePackage, template),
};

if (process.argv.includes('--check')) {
  const mismatches = [];
  for (const [kind, target] of Object.entries(targets)) {
    const actual = await readFile(target, 'utf8').catch(() => '');
    if (actual !== expected[kind]) mismatches.push(path.relative(root, target));
  }
  if (mismatches.length) {
    console.error(`Scientific review artifacts are stale: ${mismatches.join(', ')}`);
    process.exitCode = 1;
  } else {
    console.log(`Scientific review artifacts match ${template.records.length} graph claims.`);
  }
} else {
  await writeFile(targets.json, expected.json);
  await writeFile(targets.markdown, expected.markdown);
  console.log(`Wrote scientific review template and packet for ${template.records.length} graph claims.`);
}
