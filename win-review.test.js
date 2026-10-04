import test from 'node:test';
import assert from 'node:assert/strict';
import { REVIEW_CONFIG, validateGraph, createCanonicalResolver, gateExplanation, assessCandidate, noSupportedRoute } from './win-review.js';
const node = (id, canonicalName, type, synonyms = []) => ({ id, canonicalName, type, synonyms, description: 'Synthetic test entity.', sourceIds: ['source-a'], reviewStatus: 'human-reviewed', lastChecked: null });
const fixture = () => ({ nodes: [node('a', 'Condition Alpha', 'disease', ['Alpha syndrome']), node('b', 'Mechanism Beta', 'mechanism', ['Beta'])], sources: [{ id: 'source-a', title: 'Synthetic fixture, not medical evidence', url: 'https://example.org/source', text: 'Alpha has a reported relationship to Beta.', fields: { 'result.association': 'Alpha to Beta' } }], edges: [{ id: 'ab', from: 'a', to: 'b', relation: 'reported relationship', claim: 'Alpha has a reported relationship to Beta.', sourceIds: ['source-a'], support: [{ sourceId: 'source-a', passage: 'Alpha has a reported relationship to Beta.' }], evidenceStatus: 'direct', evidenceType: 'synthetic test fixture', strength: 'documented', limitations: 'Synthetic assertion; no clinical implication.', reviewStatus: 'human-reviewed', lastChecked: '2026-10-04' }] });
const candidate = () => ({ edgeIds: ['ab'], dimensions: { evidenceStrength: .9, mechanisticRelevance: .8, assetUsefulness: .8, actionability: .8 }, apiStatus: 'not-called' });
const sentence = graph => [{ text: graph.edges[0].claim, edgeIds: ['ab'] }];

test('complete graph accepts explicit unknown dates and validates every mandatory field', () => {
  const graph = fixture(), result = validateGraph(graph);
  assert.equal(result.valid, true); assert.equal(result.warnings.length, 2); assert.equal(graph.nodes[0].lastChecked, null);
  for (const key of ['id', 'canonicalName', 'synonyms', 'type', 'description', 'sourceIds', 'reviewStatus', 'lastChecked']) {
    const invalid = fixture(); delete invalid.nodes[0][key]; assert.equal(validateGraph(invalid).valid, false, key);
  }
  for (const key of ['id', 'from', 'to', 'relation', 'claim', 'sourceIds', 'support', 'evidenceStatus', 'evidenceType', 'strength', 'limitations', 'reviewStatus', 'lastChecked']) {
    const invalid = fixture(); delete invalid.edges[0][key]; assert.equal(validateGraph(invalid).valid, false, key);
  }
  const invalid = fixture(); invalid.edges[0].lastChecked = '2026-02-30'; assert.equal(validateGraph(invalid).valid, false);
});

test('canonical exact resolution handles normalized synonyms and rejects collisions and duplicates', () => {
  const resolver = createCanonicalResolver(fixture().nodes);
  assert.deepEqual(resolver.resolve('  ALPHA   syndrome '), { status: 'matched', nodeId: 'a' });
  assert.equal(resolver.resolve('Alpha syndrom').status, 'no-match');
  const nodes = fixture().nodes; nodes[1].synonyms.push('alpha syndrome');
  const collision = createCanonicalResolver(nodes); assert.equal(collision.valid, false); assert.equal(collision.resolve('Alpha syndrome').status, 'collision');
  assert.equal(collision.resolve('Beta').status, 'invalid', 'a collided namespace must not be partially accepted');
  const dup = fixture(); dup.nodes[1].canonicalName = dup.nodes[0].canonicalName; assert.equal(validateGraph(dup).valid, false);
  dup.nodes[1] = structuredClone(dup.nodes[0]); assert.equal(validateGraph(dup).valid, false);
});

test('missing endpoints, sources, passages, fields and multi-source support fail validation', () => {
  for (const mutate of [g => { g.edges[0].to = 'missing'; }, g => { g.sources = []; }, g => { g.edges[0].support = []; }, g => { g.edges[0].support[0].passage = 'fabricated passage'; }, g => { g.edges[0].support = [{ sourceId: 'source-a', field: 'absent.field' }]; }, g => { g.sources.push({ id: 'source-b', title: 'B', url: 'https://example.org/b' }); g.edges[0].sourceIds.push('source-b'); }]) {
    const graph = fixture(); mutate(graph); assert.equal(validateGraph(graph).valid, false);
  }
  const field = fixture(); field.edges[0].support = [{ sourceId: 'source-a', field: 'result.association' }]; assert.equal(validateGraph(field).valid, true);
});

test('exact approved explanation is removed when any cited edge or supporting source disappears', () => {
  const graph = fixture(); assert.equal(gateExplanation(graph, sentence(graph)).visible, true);
  const claimed = sentence(graph); graph.edges = []; const removed = gateExplanation(graph, claimed); assert.equal(removed.visible, false); assert.deepEqual(removed.sentences, []);
  const two = fixture(); two.edges.push({ ...structuredClone(two.edges[0]), id: 'ab2' });
  const both = [{ text: two.edges[0].claim, edgeIds: ['ab', 'ab2'] }];
  two.edges[1].reviewStatus = 'rejected'; assert.equal(gateExplanation(two, both).visible, false);
  const missing = fixture(); missing.sources[0].available = false; assert.equal(gateExplanation(missing, sentence(missing)).visible, false);
});

test('uncited and overconfident explanations cannot borrow legitimate evidence IDs', () => {
  const graph = fixture();
  for (const sentences of [[], [{ text: graph.edges[0].claim, edgeIds: [] }], [{ text: 'This proves a cure will work.', edgeIds: ['ab'] }], [{ text: graph.edges[0].claim + ' Everyone benefits.', edgeIds: ['ab'] }]]) {
    const result = gateExplanation(graph, sentences); assert.equal(result.visible, false); assert.deepEqual(result.sentences, []);
  }
});

test('pending-expert evidence is valid metadata, hidden by default, explicitly labeled if requested', () => {
  const graph = fixture(); graph.edges[0].reviewStatus = 'source-checked-by-ai;expert-review-pending';
  assert.equal(validateGraph(graph).valid, true); assert.equal(gateExplanation(graph, sentence(graph)).visible, false);
  const result = gateExplanation(graph, sentence(graph), { allowPendingExpert: true });
  assert.equal(result.visible, true); assert.equal(result.status, 'pending-expert'); assert.equal(result.sentences[0].label, 'Pending expert review');
  assert.equal(assessCandidate(candidate(), graph).decision, 'review');
});

test('review dimensions have independent thresholds and never promote or mutate a trusted edge', () => {
  const graph = fixture(), original = structuredClone(graph), accepted = assessCandidate(candidate(), graph);
  assert.equal(accepted.decision, 'supported'); assert.equal(accepted.trusted, false); assert.deepEqual(graph, original);
  for (const dimension of Object.keys(REVIEW_CONFIG.dimensions)) {
    const value = candidate(); value.dimensions[dimension] = REVIEW_CONFIG.dimensions[dimension] - .001;
    assert.equal(assessCandidate(value, graph).decision, 'review', dimension);
    value.dimensions[dimension] = true; assert.equal(assessCandidate(value, graph).decision, 'review');
  }
});

test('unsupported candidates reject; contradictions route to review even if caller omits counteredge', () => {
  const unsupported = fixture(); unsupported.edges[0].evidenceStatus = 'unsupported';
  assert.equal(assessCandidate(candidate(), unsupported).decision, 'reject'); assert.equal(gateExplanation(unsupported, sentence(unsupported)).visible, false);
  const conflict = fixture(); conflict.edges.push({ ...structuredClone(conflict.edges[0]), id: 'counter', evidenceStatus: 'contradictory', claim: 'The relationship does not generalize.' });
  const assessed = assessCandidate(candidate(), conflict); assert.equal(assessed.decision, 'review'); assert.ok(assessed.reasons.some(reason => reason.includes('counter')));
});

test('API failures, missing evidence and low-confidence dimensions never create a trusted result', () => {
  const graph = fixture();
  for (const apiStatus of ['error', 'timeout', 'malformed', null]) { const result = assessCandidate({ ...candidate(), apiStatus }, graph); assert.equal(result.decision, 'review'); assert.equal(result.trusted, false); }
  assert.equal(assessCandidate({ ...candidate(), edgeIds: ['absent'] }, graph).decision, 'reject');
  assert.equal(assessCandidate({ edgeIds: ['ab'] }, graph).decision, 'review');
  assert.equal(graph.edges.length, 1);
});

test('no-match result explicitly clears every recommendation and preserves research next steps', () => {
  const result = noSupportedRoute({ query: 'Unknown condition', searchedSources: ['source-a'], searchedTypes: ['mechanism'], considered: [{ id: 'weak', reason: 'Phenotype only.' }], missingEvidence: ['Mechanism-level evidence.'] });
  const displayed = { recommendations: ['stale'], path: ['ab'], explanation: ['stale'], selectedCandidateId: 'prior', ...result };
  assert.equal(displayed.status, 'no-supported-route'); assert.deepEqual(displayed.recommendations, []); assert.deepEqual(displayed.path, []); assert.deepEqual(displayed.explanation, []); assert.equal(displayed.selectedCandidateId, null); assert.ok(displayed.nextQuestion); assert.equal(displayed.considered[0].reason, 'Phenotype only.');
});

test('current evidence package validates, keeps expert review pending, rejects weak bridge, and gates actual claims', async () => {
  const { evidencePackage: graph, candidateOpportunity, rejectedCandidates } = await import('./win-evidence.js');
  const checked = validateGraph(graph); assert.equal(checked.valid, true, checked.errors.join('\n'));
  assert.equal(createCanonicalResolver(graph.nodes).resolve('FRDA').nodeId, 'frda');
  const assessed = assessCandidate(candidateOpportunity, graph);
  assert.equal(assessed.decision, 'review'); assert.equal(assessed.trusted, false);
  assert.ok(assessed.reasons.some(reason => reason.includes('model-counterexample')));
  assert.equal(assessCandidate(rejectedCandidates[0], graph).decision, 'reject');
  const edge = graph.edges.find(edge => edge.id === 'frda-iscu-mechanism');
  const sentences = [{ text: edge.claim, edgeIds: [edge.id] }];
  assert.equal(gateExplanation(graph, sentences).visible, false);
  const displayed = gateExplanation(graph, sentences, { allowPendingExpert: true });
  assert.equal(displayed.visible, true); assert.equal(displayed.sentences[0].label, 'Pending expert review');
  const deleted = structuredClone(graph); deleted.edges = deleted.edges.filter(record => record.id !== edge.id);
  assert.equal(gateExplanation(deleted, sentences, { allowPendingExpert: true }).visible, false);
});
