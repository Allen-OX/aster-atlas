import test from 'node:test';
import assert from 'node:assert/strict';
import { nodes, edges, sources, caseStudy, openAiExtractionRecords } from './data.js';
import { validateCaseStudy, calculateAcceleration } from './judge-journey.js';

const graph = { nodes, edges, sources };

test('the judge journey contains every entity class needed for a patient action', () => {
  const types = new Set(nodes.map(node => node.type));
  for (const type of ['disease', 'gene', 'variant', 'mechanism', 'phenotype', 'study', 'organization', 'investigator', 'asset']) {
    assert.ok(types.has(type), `missing ${type}`);
  }
});

test('trusted journey edges carry inspectable claim-level evidence', () => {
  const journeyEdges = edges.filter(edge => caseStudy.evidenceEdgeIds.includes(edge.id));
  assert.ok(journeyEdges.length >= 6);
  for (const edge of journeyEdges) {
    assert.ok(edge.claim);
    assert.ok(edge.evidenceType);
    assert.ok(['direct', 'registry', 'organization'].includes(edge.evidenceStatus));
    assert.equal(edge.reviewStatus, 'human-reviewed');
    assert.ok(edge.limitations);
  }
});

test('the phenotype-only A-T comparison is rejected rather than recommended', () => {
  assert.equal(caseStudy.rejectedCandidate.nodeId, 'at');
  assert.equal(caseStudy.rejectedCandidate.edgeId, 'frda-at');
  assert.equal(caseStudy.rejectedCandidate.decision, 'not-actionable');
  assert.match(caseStudy.rejectedCandidate.reason, /phenotype/i);
  assert.equal(caseStudy.recommendedNodeIds.includes('at'), false);
});

test('the patient action is source-bound and avoids clinical eligibility claims', () => {
  assert.deepEqual(caseStudy.action.sourceIds.sort(), ['ct-unified', 'fara-resources']);
  assert.equal(caseStudy.action.timeframe, 'this week');
  assert.match(caseStudy.action.text, /contact/i);
  assert.doesNotMatch(caseStudy.action.text, /eligible|enroll|treatment recommendation/i);
  assert.deepEqual(validateCaseStudy(caseStudy, graph), []);
});

test('Codex extraction records preserve source input and human review', () => {
  assert.ok(openAiExtractionRecords.length >= 3);
  for (const record of openAiExtractionRecords) {
    assert.equal(record.tool, 'OpenAI Codex');
    assert.equal(record.mode, 'build-time structured extraction');
    assert.equal(record.reviewStatus, 'human-reviewed');
    assert.ok(sources.some(source => source.id === record.sourceId));
    assert.ok(record.inputExcerpt.length > 0);
    assert.ok(record.output.edgeId);
    assert.ok(edges.some(edge => edge.id === record.output.edgeId));
  }
});

test('the disclosed coordination hypothesis is exactly 10x and rejects invalid inputs', () => {
  assert.deepEqual(calculateAcceleration(10, 1), { baselineWeeks: 10, assistedWeeks: 1, ratio: 10, label: '10×' });
  assert.throws(() => calculateAcceleration(0, 1), /positive/);
  assert.throws(() => calculateAcceleration(10, 0), /positive/);
  assert.throws(() => calculateAcceleration(1, 2), /shorter/);
});

test('validation rejects an unsupported or clinically unsafe action', () => {
  const unsupported = structuredClone(caseStudy);
  unsupported.action.sourceIds = ['missing'];
  assert.ok(validateCaseStudy(unsupported, graph).some(error => /action source/i.test(error)));
  const unsafe = structuredClone(caseStudy);
  unsafe.action.text = 'Enroll this patient in treatment now.';
  assert.ok(validateCaseStudy(unsafe, graph).some(error => /clinical action/i.test(error)));
});
