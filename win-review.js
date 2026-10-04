/** Deterministic review gates only. No inference, network calls, or trusted-edge mutation. */
const text = value => typeof value === 'string' && value.trim().length > 0;
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const strings = value => Array.isArray(value) && value.every(text) && new Set(value).size === value.length;
const date = value => value === null || value === 'unknown' || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value);
const normalize = value => typeof value === 'string' ? value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase() : '';
const frozen = value => { if (object(value) || Array.isArray(value)) { Object.values(value).forEach(frozen); Object.freeze(value); } return value; };
export const REVIEW_CONFIG = frozen({
  dimensions: { evidenceStrength: .75, mechanisticRelevance: .6, assetUsefulness: .5, actionability: .5 },
  nodeTypes: ['disease', 'gene', 'variant', 'mechanism', 'pathway', 'phenotype', 'claim', 'publication', 'investigator', 'study', 'organization', 'community', 'asset', 'resource', 'funding', 'action', 'milestone'],
  reviewStatuses: ['human-reviewed', 'expert-reviewed', 'pending-expert', 'source-checked-by-ai;expert-review-pending', 'pending', 'rejected'],
  approvedStatuses: ['human-reviewed', 'expert-reviewed'],
  evidenceStatuses: ['direct', 'inferred', 'contradictory', 'unsupported'],
  maxRecords: 10000,
  scope: 'Prototype review triage thresholds; not calibrated clinical certainty or probabilities.',
});

/** Stable IDs, canonical names and synonyms share one collision-checked namespace. */
export function createCanonicalResolver(nodes = []) {
  const lookup = new Map(), collisions = [], errors = [];
  if (!Array.isArray(nodes)) return { valid: false, collisions: [], errors: ['Nodes must be an array.'], resolve: () => ({ status: 'invalid', nodeId: null }) };
  const ids = new Set();
  for (const node of nodes) {
    if (!object(node) || !text(node.id) || !text(node.canonicalName) || !strings(node.synonyms)) { errors.push('Canonical records require id, canonicalName and synonyms.'); continue; }
    if (ids.has(node.id)) errors.push(`Duplicate node ID: ${node.id}.`);
    ids.add(node.id);
    for (const alias of [node.id, node.canonicalName, ...node.synonyms]) {
      const key = normalize(alias), matches = lookup.get(key) || new Set();
      matches.add(node.id); lookup.set(key, matches);
    }
  }
  for (const [alias, ids] of lookup) if (ids.size > 1) collisions.push({ alias, nodeIds: [...ids].sort() });
  const valid = errors.length === 0 && collisions.length === 0;
  return { valid, collisions, errors, resolve(query) {
    const matches = lookup.get(normalize(query));
    if (matches?.size > 1) return { status: 'collision', nodeId: null, nodeIds: [...matches].sort() };
    if (!valid) return { status: 'invalid', nodeId: null };
    return matches ? { status: 'matched', nodeId: [...matches][0] } : { status: 'no-match', nodeId: null };
  } };
}

/** Metadata completeness is checked; source presence is not semantic verification. */
export function validateGraph(graph) {
  const errors = [], warnings = [];
  if (!object(graph) || !['nodes', 'edges', 'sources'].every(key => Array.isArray(graph[key]))) return { valid: false, errors: ['Graph requires nodes, edges and sources arrays.'], warnings };
  if (['nodes', 'edges', 'sources'].some(key => graph[key].length > REVIEW_CONFIG.maxRecords)) return { valid: false, errors: ['Graph exceeds bounded record limit.'], warnings };
  const collections = {};
  for (const key of ['nodes', 'edges', 'sources']) {
    collections[key] = new Map();
    graph[key].forEach((entry, index) => {
      if (!object(entry) || !text(entry.id)) { errors.push(`${key}[${index}] requires a stable id.`); return; }
      if (collections[key].has(entry.id)) errors.push(`Duplicate ${key} id: ${entry.id}.`);
      collections[key].set(entry.id, entry);
    });
  }
  const sourceIds = record => {
    if (!strings(record.sourceIds) || !record.sourceIds.length) { errors.push(`${record.id}: sourceIds must be nonempty unique strings.`); return []; }
    for (const id of record.sourceIds) if (!collections.sources.has(id)) errors.push(`${record.id}: missing source ${id}.`);
    return record.sourceIds;
  };
  for (const source of collections.sources.values()) {
    if (!text(source.title) || !text(source.url)) errors.push(`${source.id}: source requires title and URL.`);
    else { try { if (!['https:', 'http:'].includes(new URL(source.url).protocol)) errors.push(`${source.id}: source URL must be HTTP(S).`); } catch { errors.push(`${source.id}: invalid source URL.`); } }
    if (source.available !== undefined && typeof source.available !== 'boolean') errors.push(`${source.id}: available must be boolean.`);
  }
  for (const node of collections.nodes.values()) {
    if (!text(node.canonicalName) || !strings(node.synonyms) || !text(node.description) || !REVIEW_CONFIG.nodeTypes.includes(node.type)) errors.push(`${node.id}: missing or invalid required node fields.`);
    sourceIds(node);
    if (!REVIEW_CONFIG.reviewStatuses.includes(node.reviewStatus)) errors.push(`${node.id}: invalid reviewStatus.`);
    if (!Object.hasOwn(node, 'lastChecked') || !date(node.lastChecked)) errors.push(`${node.id}: lastChecked requires a real date, null or unknown.`);
    else if (node.lastChecked === null || node.lastChecked === 'unknown') warnings.push(`${node.id}: last-checked date unknown.`);
  }
  for (const edge of collections.edges.values()) {
    if (!collections.nodes.has(edge.from) || !collections.nodes.has(edge.to)) errors.push(`${edge.id}: missing endpoint.`);
    for (const key of ['relation', 'claim', 'evidenceType', 'strength', 'limitations']) if (!text(edge[key])) errors.push(`${edge.id}: ${key} is required.`);
    const ids = sourceIds(edge);
    if (!REVIEW_CONFIG.evidenceStatuses.includes(edge.evidenceStatus)) errors.push(`${edge.id}: invalid evidenceStatus.`);
    if (!REVIEW_CONFIG.reviewStatuses.includes(edge.reviewStatus)) errors.push(`${edge.id}: invalid reviewStatus.`);
    if (!Object.hasOwn(edge, 'lastChecked') || !date(edge.lastChecked)) errors.push(`${edge.id}: lastChecked requires a real date, null or unknown.`);
    else if (edge.lastChecked === null || edge.lastChecked === 'unknown') warnings.push(`${edge.id}: last-checked date unknown.`);
    if (!Array.isArray(edge.support) || !edge.support.length) errors.push(`${edge.id}: source passage or structured field required.`);
    else {
      for (const support of edge.support) {
        if (!object(support) || !ids.includes(support.sourceId) || (!text(support.passage) && !text(support.field))) errors.push(`${edge.id}: invalid source support.`);
        else {
          const source = collections.sources.get(support.sourceId);
          if (text(support.passage) && text(source?.text) && !source.text.includes(support.passage)) errors.push(`${edge.id}: supporting passage absent from supplied source text.`);
          if (text(support.field) && object(source?.fields) && !Object.hasOwn(source.fields, support.field)) errors.push(`${edge.id}: supporting field absent from supplied source fields.`);
        }
      }
      for (const id of ids) if (!edge.support.some(item => item?.sourceId === id)) errors.push(`${edge.id}: missing support for source ${id}.`);
    }
  }
  const canonical = createCanonicalResolver(graph.nodes);
  errors.push(...canonical.errors, ...canonical.collisions.map(item => `Canonical collision: ${item.alias} (${item.nodeIds.join(', ')}).`));
  return { valid: errors.length === 0, errors, warnings };
}

/** All-or-nothing display gate; each supplied sentence must be an exact stored claim. */
export function gateExplanation(graph, sentences, { allowPendingExpert = false } = {}) {
  const validation = validateGraph(graph), errors = [...validation.errors], output = [];
  if (!Array.isArray(sentences) || !sentences.length) errors.push('At least one evidence-linked sentence is required.');
  if (!validation.valid || !Array.isArray(sentences)) return { visible: false, status: 'blocked', sentences: [], errors, pendingExpert: false };
  const edges = new Map(graph.edges.map(edge => [edge.id, edge])), sources = new Map(graph.sources.map(source => [source.id, source]));
  for (const sentence of sentences) {
    if (!object(sentence) || !text(sentence.text) || !strings(sentence.edgeIds) || !sentence.edgeIds.length) { errors.push('Every sentence requires text and nonempty unique edgeIds.'); continue; }
    const cited = sentence.edgeIds.map(id => edges.get(id));
    if (cited.some(edge => !edge)) { errors.push('An explanation cites a missing edge.'); continue; }
    if (!cited.some(edge => edge.claim.trim() === sentence.text.trim())) errors.push('Explanation prose is not an approved exact claim; human review of paraphrases is required.');
    let pending = false;
    for (const edge of cited) {
      if (!['direct', 'inferred'].includes(edge.evidenceStatus) || edge.reviewStatus === 'rejected') errors.push(`${edge.id}: evidence is not acceptable for explanation.`);
      if (!REVIEW_CONFIG.approvedStatuses.includes(edge.reviewStatus)) {
        if (['pending-expert', 'source-checked-by-ai;expert-review-pending'].includes(edge.reviewStatus) && allowPendingExpert === true) pending = true;
        else errors.push(`${edge.id}: review is incomplete.`);
      }
      if (edge.sourceIds.some(id => !sources.has(id) || sources.get(id).available === false)) errors.push(`${edge.id}: supporting source is unavailable.`);
    }
    output.push({ text: sentence.text.trim(), edgeIds: [...sentence.edgeIds], pendingExpert: pending, label: pending ? 'Pending expert review' : cited.some(edge => edge.evidenceStatus === 'inferred') ? 'Reviewed inference' : 'Reviewed source claim', limitations: [...new Set(cited.map(edge => edge.limitations))] });
  }
  const pendingExpert = output.some(sentence => sentence.pendingExpert);
  return { visible: errors.length === 0, status: errors.length ? 'blocked' : pendingExpert ? 'pending-expert' : 'reviewed', sentences: errors.length ? [] : output, errors, pendingExpert: errors.length ? false : pendingExpert };
}

/** Dimension inputs are review annotations, not independently verified model scores. */
export function assessCandidate(candidate, graph) {
  const reasons = [], dimensions = {}, result = decision => ({ decision, reasons, dimensions, trusted: false, scope: REVIEW_CONFIG.scope });
  if (!object(candidate)) { reasons.push('Candidate is missing.'); return result('reject'); }
  const validation = validateGraph(graph);
  if (!validation.valid) { reasons.push(...validation.errors); return result('reject'); }
  if (candidate.apiStatus !== undefined && !['ok', 'not-called'].includes(candidate.apiStatus)) { reasons.push('Model/API result is unavailable; no promotion permitted.'); return result('review'); }
  if (!strings(candidate.edgeIds) || !candidate.edgeIds.length) { reasons.push('Candidate has no supporting edge IDs.'); return result('reject'); }
  const edges = candidate.edgeIds.map(id => graph.edges.find(edge => edge.id === id));
  if (edges.some(edge => !edge)) { reasons.push('Candidate cites missing evidence.'); return result('reject'); }
  if (edges.some(edge => edge.evidenceStatus === 'unsupported' || edge.reviewStatus === 'rejected')) { reasons.push('Unsupported or rejected evidence.'); return result('reject'); }
  const contradictions = graph.edges.filter(edge => edge.evidenceStatus === 'contradictory' && edges.some(item => (item.from === edge.from && item.to === edge.to) || (item.from === edge.to && item.to === edge.from)));
  if (contradictions.length) reasons.push(`Contradictory evidence requires review: ${contradictions.map(edge => edge.id).join(', ')}.`);
  for (const [key, threshold] of Object.entries(REVIEW_CONFIG.dimensions)) {
    const value = candidate.dimensions?.[key]; dimensions[key] = typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1 ? value : null;
    if (dimensions[key] === null) reasons.push(`Missing or invalid dimension: ${key}.`);
    else if (value < threshold) reasons.push(`${key} is below the review threshold (${threshold}).`);
  }
  if (edges.some(edge => !REVIEW_CONFIG.approvedStatuses.includes(edge.reviewStatus) || edge.evidenceStatus === 'inferred')) reasons.push('Inferred or incompletely reviewed evidence requires expert review.');
  if (edges.some(edge => edge.sourceIds.some(id => graph.sources.find(source => source.id === id)?.available === false))) reasons.push('Source unavailable; check the original record.');
  return result(reasons.length ? 'review' : 'supported');
}

/** Replace prior result state with this object; never merge prior recommendations. */
export function noSupportedRoute({ query = '', searchedSources = [], searchedTypes = [], considered = [], missingEvidence = [], nextQuestion = 'Which source-supported mechanism or reusable asset should be investigated next?' } = {}) {
  const list = value => Array.isArray(value) ? value.filter(text) : [];
  return { status: 'no-supported-route', title: 'No supported connection found', query: typeof query === 'string' ? query : '', searchedSources: list(searchedSources), searchedTypes: list(searchedTypes), considered: Array.isArray(considered) ? structuredClone(considered) : [], missingEvidence: list(missingEvidence), nextQuestion: text(nextQuestion) ? nextQuestion : 'What evidence is missing?', recommendations: [], path: [], explanation: [], selectedCandidateId: null };
}
