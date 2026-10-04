import test from 'node:test';
import assert from 'node:assert/strict';
import { nodes, edges, sources, checkedAt, openAiExtractionRecords } from './data.js';
import { universes, universeById, buildUniverse, filterUniverse, evidenceAssessment, entityAttributes, analytics, timeline, encodeEdge, validateSavedView, SAVED_VIEW_LIMITS, SCULPTURE_LAYER_IDS } from './universe-model.js';
import { readFileSync } from 'node:fs';

test('five independent lenses preserve public IDs and one-hop scope', () => {
  assert.deepEqual(universes.map(item => item.id), ['conditions', 'genes', 'phenotypes', 'studies', 'community']);
  const genes = buildUniverse('genes'), studies = buildUniverse('studies');
  assert.deepEqual(new Set(genes.nodes.map(node => node.id)), new Set(['fxn', 'atm', 'frda', 'at', 'fxn-gaa', 'fes-mechanism']));
  assert.deepEqual(new Set(studies.nodes.map(node => node.id)), new Set(['unified', 'frda', 'fara', 'lynch']));
  assert.equal(studies.nodes.find(node => node.id === 'frda').label, genes.nodes.find(node => node.id === 'frda').label);
  assert.notEqual(studies.nodes.find(node => node.id === 'frda'), genes.nodes.find(node => node.id === 'frda'));
  assert.ok(genes.edges.some(edge => edge.id === 'frda-at'), 'retain the original cross-source edge between included neighbors');
  assert.equal(universeById.get('genes').primaryTypes[0], 'gene');
  assert.deepEqual(buildUniverse('community').primaryNodeIds, ['fara']);
  assert.deepEqual(new Set(buildUniverse('community').nodes.map(node => node.id)), new Set(['fara', 'frda', 'unified', 'fara-assets']));
  assert.throws(() => buildUniverse('diagnosis'), /Unknown/);
});

test('every scoped graph keeps valid endpoints and source references without changing original metadata', () => {
  for (const universe of universes) {
    const graph = buildUniverse(universe.id), ids = new Set(graph.nodes.map(node => node.id));
    for (const edge of graph.edges) {
      assert.ok(ids.has(edge.from) && ids.has(edge.to));
      assert.deepEqual(edge, edges.find(original => original.id === edge.id));
      for (const id of edge.sourceIds) assert.ok(graph.sources.some(source => source.id === id));
    }
    assert.ok(graph.primaryNodeIds.every(id => universe.primaryTypes.includes(graph.nodes.find(node => node.id === id).type)));
  }
  const graph = buildUniverse('conditions');
  graph.nodes[0].sourceIds.length = 0; graph.edges[0].note = 'changed locally'; graph.universe.primaryTypes.length = 0;
  assert.equal(buildUniverse('conditions').nodes[0].sourceIds.length, 1);
  assert.equal(nodes[0].sourceIds.length, 1);
  assert.notEqual(edges[0].note, 'changed locally');
  assert.deepEqual(universes[0].primaryTypes, ['disease']);
});

test('filters compose query/type/source/strength and never expand universe scope', () => {
  const graph = buildUniverse('conditions');
  assert.deepEqual(filterUniverse(graph, { query: 'ATM', type: 'gene' }).visibleIds, ['atm']);
  const registry = filterUniverse(graph, { source: 'ct-unified', strength: 'registry' });
  assert.deepEqual(new Set(registry.visibleIds), new Set(['frda', 'unified', 'fara']));
  assert.deepEqual(registry.edges.map(edge => edge.id), ['frda-unified', 'unified-fara']);
  const documented = filterUniverse(graph, { strength: 'documented' });
  assert.ok(documented.edges.every(edge => edge.strength === 'documented'));
  const genes = filterUniverse(buildUniverse('genes'), { query: 'study' });
  assert.equal(genes.nodes.length, 0);
  assert.equal(filterUniverse(graph, { source: 'not-a-source' }).nodes.length, 0);
  assert.equal(filterUniverse(graph, { query: 'not in this dataset' }).edges.length, 0);
  assert.equal(graph.nodes.length, 9);
});

test('evidence assessment flags gaps and inference with explainable provenance, never medical severity', () => {
  const graph = buildUniverse('conditions'), frda = graph.nodes.find(node => node.id === 'frda');
  const assessment = evidenceAssessment(frda, graph.edges, graph.sources, graph.universe);
  assert.equal(assessment.flags.missingSource, false);
  assert.equal(assessment.flags.inferredLink, true);
  assert.deepEqual(assessment.inferredEdgeIds, ['frda-at']);
  assert.equal(assessment.clinicalRisk, 'unassessed');
  assert.equal(assessment.scope, 'evidence-quality');
  assert.equal('severity' in assessment, false);
  assert.equal('probability' in assessment, false);
  const missing = evidenceAssessment({ id: 'x', sourceIds: ['absent'] }, [], []);
  assert.equal(missing.flags.missingSource, true);
  assert.deepEqual(missing.missingSourceIds, ['absent']);
  const uncited = evidenceAssessment({ id: 'x', sourceIds: [] }, [], []);
  assert.equal(uncited.flags.missingSource, true);
  assert.deepEqual(uncited.uncitedRecordIds, ['x']);
  const unrelatedInference = evidenceAssessment({ id: 'x', sourceIds: ['gr-at'] }, graph.edges, sources);
  assert.equal(unrelatedInference.flags.inferredLink, false);
});

test('entity attributes and visible analytics count only represented records', () => {
  const graph = buildUniverse('genes'), fxn = graph.nodes.find(node => node.id === 'fxn');
  const attrs = entityAttributes(fxn, graph);
  assert.equal(attrs.primary, true); assert.equal(attrs.connectionCount, 3); assert.equal(attrs.sourceCount, 1);
  assert.deepEqual(attrs.neighborIds, ['frda', 'fxn-gaa', 'fes-mechanism']);
  assert.ok(attrs.allowedActions.every(action => !/diagnos|treat|prescrib|enroll/.test(action)));
  const all = analytics(graph);
  assert.equal(all.visibleNodes, 6); assert.equal(all.visibleEdges, 6); assert.equal(all.connectedComponents, 1);
  assert.equal(all.inferredEdges, 1); assert.equal(all.sourceCount, 2);
  const subset = analytics(graph, new Set(['fxn', 'atm', 'nonexistent']));
  assert.equal(subset.visibleNodes, 2); assert.equal(subset.visibleEdges, 0); assert.equal(subset.connectedComponents, 2);
  assert.deepEqual(subset.byType, { gene: 2 });
});

test('timeline contains source dates and review date; missing dates stay explicitly unknown', () => {
  const records = timeline(buildUniverse('conditions'));
  assert.equal(records.length, 5);
  assert.deepEqual(records.filter(record => record.date).map(record => record.date), ['2025-06-26', '2026-09-01', '2026-09-22', checkedAt]);
  const registry = records.find(record => record.sourceId === 'ct-unified');
  assert.equal(registry.date, '2026-09-01'); assert.equal(registry.status, 'known'); assert.equal(registry.dateKnown, true);
  const unknown = records.find(record => record.sourceId === 'fara');
  assert.equal(unknown.date, null); assert.equal(unknown.status, 'unknown'); assert.equal(unknown.dateKnown, false);
  assert.ok(records.every(record => ['source-updated', 'snapshot-checked'].includes(record.type)));
  const impossibleDate = timeline({ id: 'custom', checkedAt: '2026-02-30', sources: [{ id: 'invalid', title: 'Invalid date fixture', updated: '2026-02-30' }] });
  assert.equal(impossibleDate.length, 1); assert.equal(impossibleDate[0].date, null);
});

test('edge JSON bytes, hex and bits round-trip exactly including UTF-8; no network origin is claimed', () => {
  const edge = { ...edges[7], note: `${edges[7].note} Unicode fixture: β → α.` };
  const encoded = encodeEdge(edge);
  assert.deepEqual(JSON.parse(new TextDecoder().decode(encoded.bytes)), encoded.payload);
  assert.deepEqual(Uint8Array.from(encoded.hex.split(' ').map(byte => Number.parseInt(byte, 16))), encoded.bytes);
  assert.deepEqual(Uint8Array.from(encoded.bits.map(byte => Number.parseInt(byte, 2))), encoded.bytes);
  assert.ok(encoded.bits.every(byte => /^[01]{8}$/.test(byte)));
  assert.equal(encoded.capturedNetworkTraffic, false);
  assert.match(encoded.payload.scope, /not a captured network packet/);
  assert.equal(encoded.payload.edge.strength, 'cross-source inference');
  assert.deepEqual(encoded.payload.edge.sourceIds, ['gr-frda', 'gr-at']);
  assert.throws(() => encodeEdge({ id: 'incomplete' }), /relationship/);
});

const validView = () => ({ version: 1, universeId: 'genes', name: 'Gene associations', selectedNodeId: 'fxn', selectedEdgeId: 'frda-fxn', positions: { fxn: [-2, .5, 1], frda: [0, 0, 0] }, camera: { position: [0, 2, 14], target: [0, 0, 0] }, filters: { query: 'FXN', type: 'gene', source: 'gr-frda', strength: 'documented' }, visibleIds: ['fxn', 'frda'], routeEdgeIds: ['frda-fxn'], paused: true, flowPaused: false, flowDirection: -1, dragMode: false, layers: 3, layerIds: ['shell', 'core'], animationRate: 1.5 });
test('saved views accept bounded public state and return isolated cloned values', () => {
  const original = validView(), result = validateSavedView(original);
  assert.equal(result.valid, true, result.errors.join('; '));
  assert.deepEqual(validateSavedView(JSON.stringify(original)).value, original);
  result.value.positions.fxn[0] = 50;
  assert.equal(original.positions.fxn[0], -2);
  assert.equal(validateSavedView({ ...validView(), layerIds: [...SCULPTURE_LAYER_IDS] }).valid, true);
  assert.equal(validateSavedView({ ...validView(), layerIds: ['fxn'] }).valid, false);
  assert.equal(validateSavedView({ ...validView(), layerIds: ['core', 'core'] }).valid, false);
});

test('server scope artifact exactly matches the current public graphs and sculpture layers', () => {
  const artifact = JSON.parse(readFileSync(new URL('./universe-scopes.json', import.meta.url), 'utf8'));
  assert.equal(artifact.version, 1);
  assert.equal(artifact.checkedAt, checkedAt);
  assert.deepEqual(artifact.layerIds, SCULPTURE_LAYER_IDS);
  assert.deepEqual(artifact.limits, SAVED_VIEW_LIMITS);
  assert.deepEqual(Object.keys(artifact.universes).sort(), universes.map(item => item.id).sort());
  for (const definition of universes) {
    const graph = buildUniverse(definition.id), scope = artifact.universes[definition.id];
    assert.deepEqual(scope.nodeIds, graph.nodes.map(node => node.id));
    assert.deepEqual(scope.edgeIds, graph.edges.map(edge => edge.id));
    assert.deepEqual(scope.sourceIds, graph.sources.map(source => source.id));
    assert.deepEqual(scope.types, [...new Set(graph.nodes.map(node => node.type))].sort());
    assert.deepEqual(scope.strengths, [...new Set(graph.edges.map(edge => edge.strength))].sort());
    assert.deepEqual(scope.primaryNodeIds, graph.primaryNodeIds);
  }
});

test('OpenAI Codex extraction artifact exactly matches the reviewed public records', () => {
  const artifact = JSON.parse(readFileSync(new URL('./data/openai-codex-extraction.json', import.meta.url), 'utf8'));
  assert.equal(artifact.schemaVersion, 1);
  assert.equal(artifact.checkedAt, checkedAt);
  assert.match(artifact.boundary, /build-time/i);
  assert.match(artifact.boundary, /not live/i);
  assert.deepEqual(artifact.records, openAiExtractionRecords);
  assert.ok(artifact.records.every(record => record.reviewStatus === 'source-checked-by-ai;expert-review-pending'));
});

test('saved views reject malformed JSON, nonfinite coordinates, foreign IDs, and unsupported state', () => {
  const invalids = [null, [], '{', { ...validView(), universeId: 'secret-project' }, { ...validView(), positions: { fxn: [Infinity, 0, 0] } }, { ...validView(), positions: { fxn: [NaN, 0, 0] } }, { ...validView(), positions: { fxn: [101, 0, 0] } }, { ...validView(), positions: { unified: [0, 0, 0] } }, { ...validView(), selectedNodeId: 'fara' }, { ...validView(), routeEdgeIds: ['frda-unified'] }, { ...validView(), visibleIds: ['fxn', 'fxn'] }, { ...validView(), flowDirection: 0 }, { ...validView(), layers: 5 }, { ...validView(), layerIds: ['unknown'] }, { ...validView(), animationRate: NaN }, { ...validView(), paused: 'true' }, { ...validView(), credentials: 'not permitted' }, { ...validView(), filters: { source: 'ct-unified' } }, { ...validView(), camera: { position: [1, 2], target: [0, 0, 0] } }];
  for (const value of invalids) { const result = validateSavedView(value); assert.equal(result.valid, false, JSON.stringify(value)); assert.equal(result.value, null); assert.ok(result.errors.length); }
  const circular = validView(); circular.positions = circular;
  assert.equal(validateSavedView(circular).valid, false);
  assert.equal(validateSavedView(' '.repeat(SAVED_VIEW_LIMITS.maxBytes + 1)).valid, false);
  assert.equal(validateSavedView(JSON.parse('{"version":1,"universeId":"genes","positions":{"__proto__":[0,0,0]}}')).valid, false);
});


test('saved per-edge flows retain absolute direction and reject malformed or foreign state', () => {
  const input = { ...validView(), flowDirection: -1, edgeFlows: { 'frda-fxn': { paused: true, direction: 1 }, 'frda-at': { paused: false, direction: -1 } } };
  const result = validateSavedView(input);
  assert.equal(result.valid, true, result.errors.join('; '));
  assert.deepEqual(result.value.edgeFlows, input.edgeFlows);
  result.value.edgeFlows['frda-fxn'].paused = false;
  assert.equal(input.edgeFlows['frda-fxn'].paused, true);
  assert.equal(validateSavedView({ ...validView(), edgeFlows: {} }).valid, true);
  const malformed = [null, [], true, { 'frda-unified': { paused: false, direction: 1 } }, { absent: { paused: true, direction: -1 } }, { 'frda-fxn': null }, { 'frda-fxn': [] }, { 'frda-fxn': { paused: true } }, { 'frda-fxn': { direction: 1 } }, { 'frda-fxn': { paused: true, direction: 1, extra: false } }, { 'frda-fxn': { paused: 1, direction: 1 } }, { 'frda-fxn': { paused: true, direction: true } }, { 'frda-fxn': { paused: true, direction: 0 } }, { 'frda-fxn': { paused: true, direction: NaN } }, { 'frda-fxn': { paused: true, direction: Infinity } }];
  for (const edgeFlows of malformed) assert.equal(validateSavedView({ ...validView(), edgeFlows }).valid, false, JSON.stringify(edgeFlows));
});


test('saved object expansion and isolation remain scoped, finite, and isolated on clone', () => {
  const input = { ...validView(), objectExplosions: { fxn: 0, frda: 1, atm: .5 }, isolatedNodeId: 'frda' };
  const result = validateSavedView(input);
  assert.equal(result.valid, true, result.errors.join('; '));
  assert.deepEqual(validateSavedView(JSON.stringify(input)).value, input);
  result.value.objectExplosions.atm = 1;
  assert.equal(input.objectExplosions.atm, .5);
  assert.equal(validateSavedView({ ...validView(), objectExplosions: {}, isolatedNodeId: null }).valid, true);
  for (const objectExplosions of [null, [], true, 1, { unknown: .5 }, { fara: .5 }, { fxn: true }, { fxn: false }, { fxn: null }, { fxn: '.5' }, { fxn: [] }, { fxn: { amount: .5 } }, { fxn: -.001 }, { fxn: 1.001 }, { fxn: NaN }, { fxn: Infinity }, Object.fromEntries(Array.from({ length: 65 }, (_, i) => ['node' + i, .5]))]) {
    assert.equal(validateSavedView({ ...validView(), objectExplosions }).valid, false, JSON.stringify(objectExplosions));
  }
  for (const isolatedNodeId of ['unknown', 'fara', 'frda-fxn', true, false, 0, [], {}]) {
    assert.equal(validateSavedView({ ...validView(), isolatedNodeId }).valid, false, JSON.stringify(isolatedNodeId));
  }
});
