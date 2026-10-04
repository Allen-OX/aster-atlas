import { nodes as publicNodes, edges as publicEdges, sources as publicSources, checkedAt } from './data.js';

// TypeSafe/Jev assessment: scoping, filters, provenance flags, byte encoding and
// saved-view validation are exact rules over public records; no semantic model,
// credentials, external inference calls, or nonfunctional dependency is needed.

const clone = value => structuredClone(value);
const freeze = value => { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
const actions = ['inspect_entity', 'inspect_relationship', 'trace_route', 'open_source', 'filter', 'inspect_local_payload', 'save_view'];
const qualityModel = {
  scope: 'Evidence provenance only; clinical risk is unassessed.',
  flags: ['missingSource', 'inferredLink', 'unknownUpdateDate'],
  meaning: 'Flags identify citation gaps, explicitly inferred links, or unavailable source dates. No clinical severity, probability, eligibility, treatment effect, or live status is calculated.',
};
const definition = (id, label, primaryTypes, accent, description, layerLabels) => ({ id, label, name: label, primaryTypes, accent, description, allowedActions: [...actions], layerLabels, evidenceQualityModel: clone(qualityModel), riskModel: clone(qualityModel) });

export const universes = freeze([
  definition('conditions', 'Conditions', ['disease'], '#d5ee9b', 'Explore source-linked conditions and their immediate genetic, phenotype, study, and community connections.', ['Condition overview', 'Connected entities', 'Relationship evidence', 'Original source records']),
  definition('genes', 'Genes', ['gene'], '#acbff2', 'Inspect the cited gene associations and connected conditions in this reviewed snapshot.', ['Gene overview', 'Condition associations', 'Association evidence', 'Original source records']),
  definition('phenotypes', 'Phenotypes', ['phenotype'], '#e4bd9c', 'Follow reported manifestations and distinguish phenotype-level links from broader clinical claims.', ['Phenotype overview', 'Reported connections', 'Relationship evidence', 'Original source records']),
  definition('studies', 'Studies', ['study'], '#c6b3ec', 'Inspect study-reference connections and open the registry for current status, sites, and eligibility.', ['Study reference', 'Study-focus connections', 'Registry provenance', 'Original registry record']),
  definition('community', 'Community', ['community', 'organization', 'resource'], '#a9d5c7', 'Explore cited patient and research resources without implying endorsement or a care recommendation.', ['Resource overview', 'Community connections', 'Resource provenance', 'Original organization record']),
]);
export const universeById = new Map(universes.map(universe => [universe.id, universe]));
const knownDefinition = id => universes.find(universe => universe.id === id);
const unique = values => [...new Set(values)];
const sourceIdsOf = record => Array.isArray(record?.sourceIds) ? record.sourceIds.filter(id => typeof id === 'string') : [];
const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;

/** One-hop scope, with induced original edges: IDs remain shared across universes. */
export function buildUniverse(id) {
  const universe = knownDefinition(id);
  if (!universe) throw new RangeError(`Unknown research universe: ${String(id)}`);
  const primaryNodeIds = publicNodes.filter(node => universe.primaryTypes.includes(node.type)).map(node => node.id);
  const included = new Set(primaryNodeIds);
  for (const edge of publicEdges) if (primaryNodeIds.includes(edge.from) || primaryNodeIds.includes(edge.to)) { included.add(edge.from); included.add(edge.to); }
  const nodes = publicNodes.filter(node => included.has(node.id));
  const edges = publicEdges.filter(edge => included.has(edge.from) && included.has(edge.to));
  const referenced = new Set([...nodes, ...edges].flatMap(sourceIdsOf));
  return { id, universe: clone(universe), checkedAt, nodes: clone(nodes), edges: clone(edges), sources: clone(publicSources.filter(source => referenced.has(source.id))), primaryNodeIds, neighborNodeIds: nodes.filter(node => !primaryNodeIds.includes(node.id)).map(node => node.id) };
}

/** Query/type restrict entities. Source/strength restrict relationships and their endpoints. */
export function filterUniverse(graph, { query = '', type = 'all', source = 'all', strength = 'all' } = {}) {
  const filters = { query: String(query).trim().slice(0, 240), type: String(type), source: String(source), strength: String(strength) };
  const words = filters.query.toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const eligibleEdges = graph.edges.filter(edge => (filters.source === 'all' || sourceIdsOf(edge).includes(filters.source)) && (filters.strength === 'all' || edge.strength === filters.strength));
  const relationshipEndpoints = new Set(eligibleEdges.flatMap(edge => [edge.from, edge.to]));
  const sourceEdges = new Set(graph.edges.filter(edge => filters.source === 'all' || sourceIdsOf(edge).includes(filters.source)).flatMap(edge => [edge.from, edge.to]));
  const nodes = graph.nodes.filter(node => {
    const text = [node.id, node.label, node.short, node.type, node.summary].filter(Boolean).join(' ').toLocaleLowerCase();
    return (filters.type === 'all' || node.type === filters.type) && words.every(word => text.includes(word)) && (filters.source === 'all' || sourceIdsOf(node).includes(filters.source) || sourceEdges.has(node.id)) && (filters.strength === 'all' || relationshipEndpoints.has(node.id));
  });
  const visibleIds = nodes.map(node => node.id), visible = new Set(visibleIds);
  const edges = eligibleEdges.filter(edge => visible.has(edge.from) && visible.has(edge.to));
  const referenced = new Set([...nodes, ...edges].flatMap(sourceIdsOf));
  return { ...clone(graph), nodes: clone(nodes), edges: clone(edges), sources: clone(graph.sources.filter(item => referenced.has(item.id))), primaryNodeIds: graph.primaryNodeIds.filter(id => visible.has(id)), neighborNodeIds: graph.neighborNodeIds.filter(id => visible.has(id)), visibleIds, filters };
}

/** The assessment describes source metadata, never a person's medical risk. */
export function evidenceAssessment(node, edges = [], sources = [], universe = null) {
  const adjacent = edges.filter(edge => edge.from === node.id || edge.to === node.id);
  const available = new Map(sources.map(source => [source.id, source]));
  const sourceIds = unique([node, ...adjacent].flatMap(sourceIdsOf));
  const missingSourceIds = sourceIds.filter(id => !available.has(id));
  const uncitedRecordIds = [node, ...adjacent].filter(record => sourceIdsOf(record).length === 0).map(record => record.id);
  const inferredEdgeIds = adjacent.filter(edge => edge.strength === 'cross-source inference').map(edge => edge.id);
  const unknownDateSourceIds = sourceIds.filter(id => available.has(id) && !validDate(available.get(id).updated));
  const flags = { missingSource: missingSourceIds.length > 0 || uncitedRecordIds.length > 0, inferredLink: inferredEdgeIds.length > 0, unknownUpdateDate: unknownDateSourceIds.length > 0 };
  const reasons = [];
  if (flags.missingSource) reasons.push({ flag: 'missingSource', message: 'Some records have no citation or reference an unavailable source.', recordIds: uncitedRecordIds, sourceIds: missingSourceIds });
  if (flags.inferredLink) reasons.push({ flag: 'inferredLink', message: 'An adjacent relationship is explicitly marked as a cross-source inference; its note and cited references require inspection.', edgeIds: inferredEdgeIds });
  if (flags.unknownUpdateDate) reasons.push({ flag: 'unknownUpdateDate', message: 'A source update date is not supplied in this snapshot. Open the original record for current information.', sourceIds: unknownDateSourceIds });
  if (!reasons.length) reasons.push({ flag: null, message: 'Citations resolve and supplied source dates are known. This does not establish clinical validity or current applicability.' });
  return { scope: 'evidence-quality', clinicalRisk: 'unassessed', universeId: universe?.id || null, status: Object.values(flags).some(Boolean) ? 'review-needed' : 'source-linked', flags, reasons, sourceIds, missingSourceIds, uncitedRecordIds, inferredEdgeIds, unknownDateSourceIds };
}

export function entityAttributes(node, graph) {
  const connected = graph.edges.filter(edge => edge.from === node.id || edge.to === node.id);
  const assessment = evidenceAssessment(node, graph.edges, graph.sources, graph.universe);
  return { id: node.id, type: node.type, label: node.label, universeId: graph.id, primary: graph.primaryNodeIds.includes(node.id), sourceCount: unique(sourceIdsOf(node)).length, sourceIds: [...sourceIdsOf(node)], connectionCount: connected.length, neighborIds: unique(connected.map(edge => edge.from === node.id ? edge.to : edge.from)), relationshipTypes: unique(connected.map(edge => edge.relation)), evidenceStrengths: unique(connected.map(edge => edge.strength)), position: [node.x, node.y, node.z], allowedActions: [...graph.universe.allowedActions], layerLabels: [...graph.universe.layerLabels], assessment, scope: 'Public entity and provenance attributes; not live measurements.' };
}

export function analytics(graph, visibleIds = graph.nodes.map(node => node.id)) {
  const visible = new Set(visibleIds), nodes = graph.nodes.filter(node => visible.has(node.id));
  const edges = graph.edges.filter(edge => visible.has(edge.from) && visible.has(edge.to));
  const byType = {}, byStrength = {}, degree = Object.fromEntries(nodes.map(node => [node.id, 0]));
  for (const node of nodes) byType[node.type] = (byType[node.type] || 0) + 1;
  for (const edge of edges) { byStrength[edge.strength] = (byStrength[edge.strength] || 0) + 1; degree[edge.from]++; degree[edge.to]++; }
  const references = unique([...nodes, ...edges].flatMap(sourceIdsOf)), sourceMap = new Map(graph.sources.map(source => [source.id, source]));
  const linked = record => sourceIdsOf(record).length > 0 && sourceIdsOf(record).every(id => sourceMap.has(id));
  const visited = new Set(); let connectedComponents = 0;
  for (const node of nodes) if (!visited.has(node.id)) {
    connectedComponents++; const queue = [node.id]; visited.add(node.id);
    for (let index = 0; index < queue.length; index++) for (const edge of edges) {
      const next = edge.from === queue[index] ? edge.to : edge.to === queue[index] ? edge.from : null;
      if (next !== null && !visited.has(next)) { visited.add(next); queue.push(next); }
    }
  }
  return { universeId: graph.id, totalNodes: graph.nodes.length, totalEdges: graph.edges.length, visibleNodes: nodes.length, visibleEdges: edges.length, primaryNodes: graph.primaryNodeIds.filter(id => visible.has(id)).length, contextNodes: nodes.filter(node => !graph.primaryNodeIds.includes(node.id)).length, sourceCount: references.filter(id => sourceMap.has(id)).length, missingSourceIds: references.filter(id => !sourceMap.has(id)), sourceLinkedNodeCount: nodes.filter(linked).length, sourceLinkedEdgeCount: edges.filter(linked).length, inferredEdges: edges.filter(edge => edge.strength === 'cross-source inference').length, unknownUpdateDates: references.filter(id => sourceMap.has(id) && !validDate(sourceMap.get(id).updated)).length, connectedComponents, byType, byStrength, degree, scope: 'Counts from the displayed public-source graph; no clinical or population statistics.' };
}

/** Source-update dates and review snapshot only. No fabricated clinical events. */
export function timeline(graph) {
  const records = graph.sources.map(source => {
    const known = validDate(source.updated);
    return { id: `source-updated:${source.id}`, type: 'source-updated', sourceId: source.id, date: known ? source.updated : null, status: known ? 'known' : 'unknown', dateKnown: known, label: source.title, detail: known ? 'Source update date recorded in the public-source snapshot.' : `Source update date unavailable: ${source.updated || 'not supplied'}. Open the live source.`, url: source.url };
  });
  if (validDate(graph.checkedAt)) records.push({ id: `snapshot-checked:${graph.id}`, type: 'snapshot-checked', sourceId: null, date: graph.checkedAt, status: 'known', dateKnown: true, label: 'Snapshot checked', detail: 'Date the source snapshot was checked; not a clinical event or a live study-status update.' });
  return records.sort((a, b) => a.date === null ? b.date === null ? a.id.localeCompare(b.id) : 1 : b.date === null ? -1 : a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
}

/** Read-only byte representation of a public relationship, never network capture. */
export function encodeEdge(edge) {
  if (!edge || !['id', 'from', 'to', 'relation', 'strength'].every(key => typeof edge[key] === 'string')) throw new TypeError('A relationship with known IDs and attributes is required.');
  const payload = { kind: 'synthetic-local-relationship-record', scope: 'Synthetic local visualization payload; not a captured network packet or live biological signal.', edge: { id: edge.id, from: edge.from, to: edge.to, relation: edge.relation, strength: edge.strength, sourceIds: [...sourceIdsOf(edge)], note: typeof edge.note === 'string' ? edge.note : '' } };
  const text = JSON.stringify(payload), bytes = new TextEncoder().encode(text);
  return { payload, text, bytes, hex: Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join(' '), bits: Array.from(bytes, byte => byte.toString(2).padStart(8, '0')), origin: 'synthetic local visualization', capturedNetworkTraffic: false };
}

export const SAVED_VIEW_LIMITS = freeze({ maxBytes: 65536, maxNodes: 64, maxEdges: 128, maxCoordinate: 100, maxNameLength: 80, maxQueryLength: 240 });
export const SCULPTURE_LAYER_IDS = freeze(['shell', 'structure', 'core', 'detail']);
const isPlainObject = value => value !== null && typeof value === 'object' && !Array.isArray(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value));

/** Validation is pure. The caller decides where an accepted public view is stored. */
export function validateSavedView(input) {
  const errors = [];
  let value;
  try {
    const serialized = typeof input === 'string' ? input : JSON.stringify(input);
    if (typeof serialized !== 'string') return { valid: false, errors: ['Saved view must be a JSON object.'], value: null };
    if (new TextEncoder().encode(serialized).length > SAVED_VIEW_LIMITS.maxBytes) return { valid: false, errors: ['Saved view exceeds 64 KiB.'], value: null };
    value = typeof input === 'string' ? JSON.parse(input) : input;
  } catch { return { valid: false, errors: ['Saved view is not valid JSON.'], value: null }; }
  if (!isPlainObject(value)) return { valid: false, errors: ['Saved view must be a plain object.'], value: null };
  const permitted = new Set(['version', 'universeId', 'name', 'selectedNodeId', 'selectedEdgeId', 'filters', 'positions', 'visibleIds', 'routeEdgeIds', 'camera', 'paused', 'flowPaused', 'flowDirection', 'dragMode', 'layers', 'layerIds', 'exploded', 'animationRate', 'edgeFlows', 'objectExplosions', 'isolatedNodeId']);
  for (const key of Object.keys(value)) if (!permitted.has(key)) errors.push(`Unsupported saved-view field: ${key}.`);
  if (value.version !== 1) errors.push('Saved view version must be 1.');
  const definition = knownDefinition(value.universeId);
  if (!definition) errors.push('Unknown universeId.');
  const graph = definition ? buildUniverse(definition.id) : { nodes: [], edges: [], sources: [] };
  const nodeIds = new Set(graph.nodes.map(node => node.id)), edgeIds = new Set(graph.edges.map(edge => edge.id)), sourceIds = new Set(graph.sources.map(source => source.id));
  if (value.name !== undefined && (typeof value.name !== 'string' || value.name.length > SAVED_VIEW_LIMITS.maxNameLength)) errors.push('View name must be a string of at most 80 characters.');
  for (const [key, allowed] of [['selectedNodeId', nodeIds], ['selectedEdgeId', edgeIds], ['isolatedNodeId', nodeIds]]) if (value[key] !== undefined && value[key] !== null && !allowed.has(value[key])) errors.push(`${key} is outside the selected universe.`);
  const vector = entry => Array.isArray(entry) && entry.length === 3 && entry.every(coordinate => typeof coordinate === 'number' && Number.isFinite(coordinate) && Math.abs(coordinate) <= SAVED_VIEW_LIMITS.maxCoordinate);
  if (value.positions !== undefined) {
    if (!isPlainObject(value.positions) || Object.keys(value.positions).length > SAVED_VIEW_LIMITS.maxNodes) errors.push('Positions must be a bounded object keyed by entity ID.');
    else for (const [id, position] of Object.entries(value.positions)) if (!nodeIds.has(id) || !vector(position)) errors.push(`Invalid saved position for ${id}.`);
  }
  if (value.objectExplosions !== undefined) {
    if (!isPlainObject(value.objectExplosions) || Object.keys(value.objectExplosions).length > SAVED_VIEW_LIMITS.maxNodes) errors.push('objectExplosions must be a bounded object keyed by entity ID.');
    else for (const [id, amount] of Object.entries(value.objectExplosions)) {
      if (!nodeIds.has(id) || typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0 || amount > 1) errors.push(`Invalid saved expansion for ${id}.`);
    }
  }
  if (value.edgeFlows !== undefined) {
    if (!isPlainObject(value.edgeFlows) || Object.keys(value.edgeFlows).length > SAVED_VIEW_LIMITS.maxEdges) errors.push('edgeFlows must be a bounded object keyed by relationship ID.');
    else for (const [id, flow] of Object.entries(value.edgeFlows)) {
      if (!edgeIds.has(id) || !isPlainObject(flow) || Object.keys(flow).length !== 2 || !Object.hasOwn(flow, 'paused') || !Object.hasOwn(flow, 'direction') || typeof flow.paused !== 'boolean' || (flow.direction !== 1 && flow.direction !== -1)) errors.push(`Invalid saved flow for ${id}.`);
    }
  }
  if (value.camera !== undefined && (!isPlainObject(value.camera) || Object.keys(value.camera).some(key => !['position', 'target'].includes(key)) || !vector(value.camera.position) || !vector(value.camera.target))) errors.push('Camera position and target must be finite coordinate triples within bounds.');
  for (const [key, allowed, cap] of [['visibleIds', nodeIds, SAVED_VIEW_LIMITS.maxNodes], ['routeEdgeIds', edgeIds, SAVED_VIEW_LIMITS.maxEdges]]) if (value[key] !== undefined && (!Array.isArray(value[key]) || value[key].length > cap || new Set(value[key]).size !== value[key].length || !value[key].every(id => allowed.has(id)))) errors.push(`${key} must contain unique IDs from this universe within the size limit.`);
  for (const key of ['paused', 'flowPaused', 'dragMode', 'exploded']) if (value[key] !== undefined && typeof value[key] !== 'boolean') errors.push(`${key} must be boolean.`);
  if (value.flowDirection !== undefined && value.flowDirection !== 1 && value.flowDirection !== -1) errors.push('flowDirection must be 1 or -1.');
  if (value.layers !== undefined && (!Number.isInteger(value.layers) || value.layers < 1 || value.layers > 4)) errors.push('layers must be an integer from 1 to 4.');
  if (value.layerIds !== undefined && (!Array.isArray(value.layerIds) || value.layerIds.length > SCULPTURE_LAYER_IDS.length || new Set(value.layerIds).size !== value.layerIds.length || !value.layerIds.every(id => SCULPTURE_LAYER_IDS.includes(id)))) errors.push('layerIds must contain unique sculpture part IDs: shell, structure, core, detail.');
  if (value.animationRate !== undefined && (typeof value.animationRate !== 'number' || !Number.isFinite(value.animationRate) || value.animationRate < .25 || value.animationRate > 2)) errors.push('animationRate must be between 0.25 and 2.');
  if (value.filters !== undefined) {
    const filter = value.filters;
    if (!isPlainObject(filter) || Object.keys(filter).some(key => !['query', 'type', 'source', 'strength'].includes(key))) errors.push('Filters contain unsupported fields.');
    else {
      if (filter.query !== undefined && (typeof filter.query !== 'string' || filter.query.length > SAVED_VIEW_LIMITS.maxQueryLength)) errors.push('Filter query must be at most 240 characters.');
      if (filter.type !== undefined && filter.type !== 'all' && !graph.nodes.some(node => node.type === filter.type)) errors.push('Unknown type filter for this universe.');
      if (filter.source !== undefined && filter.source !== 'all' && !sourceIds.has(filter.source)) errors.push('Unknown source filter for this universe.');
      if (filter.strength !== undefined && filter.strength !== 'all' && !graph.edges.some(edge => edge.strength === filter.strength)) errors.push('Unknown strength filter for this universe.');
    }
  }
  return { valid: errors.length === 0, errors, value: errors.length ? null : clone(value) };
}
