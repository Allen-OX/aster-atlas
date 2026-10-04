import test from 'node:test';
import assert from 'node:assert/strict';
import { evidencePackage as graph } from './win-evidence.js';
import {
  REVIEW_DECISIONS,
  assessScientificReviewCoverage,
  classifySourceCheck,
  createScientificReviewTemplate,
  renderScientificReviewPacket,
  validateScientificReviewRecord,
} from './scientific-review.js';

const recordFor = (edge, overrides = {}) => ({
  claimId: edge.id,
  claim: edge.claim,
  decision: 'accept',
  reviewer: {
    name: 'Independent Reviewer',
    role: 'Rare-disease research scientist',
  },
  reviewedAt: '2026-10-04',
  note: 'The wording is bounded by the cited source and stated limitation.',
  ...overrides,
});

test('accepts exactly the three scientific decisions with reviewer evidence', () => {
  assert.deepEqual(REVIEW_DECISIONS, ['accept', 'revise', 'reject']);
  const edge = graph.edges[0];
  for (const decision of REVIEW_DECISIONS) {
    const result = validateScientificReviewRecord(recordFor(edge, { decision }), graph);
    assert.equal(result.valid, true, decision);
  }
});

test('rejects unknown and stale claims before they can count as review', () => {
  const edge = graph.edges[0];
  const unknown = validateScientificReviewRecord(recordFor(edge, { claimId: 'not-a-claim' }), graph);
  assert.equal(unknown.valid, false);
  assert.match(unknown.errors.join('\n'), /unknown claim/i);

  const stale = validateScientificReviewRecord(recordFor(edge, { claim: `${edge.claim} Changed.` }), graph);
  assert.equal(stale.valid, false);
  assert.match(stale.errors.join('\n'), /does not match/i);
});

test('requires reviewer identity, role, date, and decision note', () => {
  const edge = graph.edges[0];
  const cases = [
    { reviewer: { name: '', role: 'Scientist' }, expected: /reviewer name/i },
    { reviewer: { name: 'Reviewer', role: '' }, expected: /reviewer role/i },
    { reviewedAt: '', expected: /review date/i },
    { reviewedAt: '10/04/2026', expected: /review date/i },
    { note: '', expected: /note/i },
    { decision: 'approve', expected: /decision/i },
  ];
  for (const { expected, ...override } of cases) {
    const result = validateScientificReviewRecord(recordFor(edge, override), graph);
    assert.equal(result.valid, false, JSON.stringify(override));
    assert.match(result.errors.join('\n'), expected);
  }
});

test('only complete all-accepted edge coverage passes scientific review', () => {
  const records = graph.edges.map(edge => recordFor(edge));
  const before = structuredClone(graph);
  const result = assessScientificReviewCoverage(graph, records);
  assert.equal(result.passed, true);
  assert.equal(result.accepted.length, 31);
  assert.deepEqual(result.revised, []);
  assert.deepEqual(result.rejected, []);
  assert.deepEqual(result.missingIds, []);
  assert.deepEqual(result.invalidRecords, []);
  assert.deepEqual(graph, before);
});

test('revised, rejected, missing, and duplicate records prevent promotion', () => {
  const records = graph.edges.map(edge => recordFor(edge));
  records[0] = recordFor(graph.edges[0], { decision: 'revise' });
  records[1] = recordFor(graph.edges[1], { decision: 'reject' });
  records.pop();
  records.push(recordFor(graph.edges[2]));

  const result = assessScientificReviewCoverage(graph, records);
  assert.equal(result.passed, false);
  assert.deepEqual(result.revised, [graph.edges[0].id]);
  assert.deepEqual(result.rejected, [graph.edges[1].id]);
  assert.deepEqual(result.missingIds, [graph.edges.at(-1).id]);
  assert.ok(result.invalidRecords.some(item => item.errors.some(error => /duplicate/i.test(error))));
});

test('invalid reviewer records remain visible and do not count toward coverage', () => {
  const edge = graph.edges[0];
  const result = assessScientificReviewCoverage(graph, [
    recordFor(edge, { reviewer: { name: '', role: 'Scientist' } }),
  ]);
  assert.equal(result.passed, false);
  assert.deepEqual(result.accepted, []);
  assert.ok(result.missingIds.includes(edge.id));
  assert.equal(result.invalidRecords.length, 1);
});

test('unreachable source checks retain citation identity without implying scientific rejection', () => {
  const result = classifySourceCheck({
    sourceId: 'mochel-2008',
    url: 'https://example.org/article',
    checkedAt: '2026-10-04T08:00:00.000Z',
    ok: false,
    statusCode: 503,
    error: 'Service unavailable',
  });
  assert.deepEqual(result, {
    sourceId: 'mochel-2008',
    url: 'https://example.org/article',
    status: 'unreachable',
    checkedAt: '2026-10-04T08:00:00.000Z',
    detail: 'HTTP 503 · Service unavailable',
  });

  const notChecked = classifySourceCheck({ sourceId: 'source-a', url: 'https://example.org' });
  assert.equal(notChecked.status, 'not-checked');
  assert.equal(notChecked.checkedAt, null);
});

test('review templates derive every claim and leave human decisions blank', () => {
  const template = createScientificReviewTemplate(graph);
  assert.equal(template.schemaVersion, 1);
  assert.equal(template.graphCheckedAt, '2026-10-04');
  assert.equal(template.records.length, 31);
  assert.deepEqual(template.records.map(record => record.claimId), graph.edges.map(edge => edge.id));
  assert.ok(template.records.every(record => record.decision === null));
  assert.ok(template.records.every(record => record.reviewer.name === '' && record.reviewer.role === ''));

  const packet = renderScientificReviewPacket(graph, template);
  assert.match(packet, /^# Independent scientific review packet/m);
  assert.match(packet, /Status: pending/m);
  assert.match(packet, /## frda-fxn/m);
  assert.match(packet, /Decision: \[ \] Accept  \[ \] Revise  \[ \] Reject/m);
});
