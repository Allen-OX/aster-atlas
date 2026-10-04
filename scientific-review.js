const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const validDate = value => typeof value === 'string'
  && /^\d{4}-\d{2}-\d{2}$/.test(value)
  && Number.isFinite(Date.parse(value))
  && new Date(value).toISOString().slice(0, 10) === value;

export const REVIEW_DECISIONS = Object.freeze(['accept', 'revise', 'reject']);

export function validateScientificReviewRecord(record, graph) {
  const errors = [];
  if (!object(record)) return { valid: false, errors: ['Review record must be an object.'] };
  const edge = Array.isArray(graph?.edges) ? graph.edges.find(item => item.id === record.claimId) : null;
  if (!edge) errors.push(`Unknown claim: ${String(record.claimId)}.`);
  else if (record.claim !== edge.claim) errors.push(`Claim text does not match the current graph for ${record.claimId}.`);
  if (!REVIEW_DECISIONS.includes(record.decision)) errors.push('Decision must be accept, revise, or reject.');
  if (!object(record.reviewer) || !nonempty(record.reviewer.name)) errors.push('Reviewer name is required.');
  if (!object(record.reviewer) || !nonempty(record.reviewer.role)) errors.push('Reviewer role is required.');
  if (!validDate(record.reviewedAt)) errors.push('Review date must use YYYY-MM-DD.');
  if (!nonempty(record.note)) errors.push('Reviewer note is required.');
  return { valid: errors.length === 0, errors };
}

export function assessScientificReviewCoverage(graph, records) {
  const accepted = [];
  const revised = [];
  const rejected = [];
  const invalidRecords = [];
  const seen = new Set();
  const validReviewed = new Set();

  for (const [index, record] of (Array.isArray(records) ? records : []).entries()) {
    const result = validateScientificReviewRecord(record, graph);
    const errors = [...result.errors];
    if (nonempty(record?.claimId) && seen.has(record.claimId)) errors.push(`Duplicate review record for ${record.claimId}.`);
    if (nonempty(record?.claimId)) seen.add(record.claimId);
    if (errors.length) {
      invalidRecords.push({ index, claimId: record?.claimId || null, errors });
      continue;
    }
    validReviewed.add(record.claimId);
    if (record.decision === 'accept') accepted.push(record.claimId);
    if (record.decision === 'revise') revised.push(record.claimId);
    if (record.decision === 'reject') rejected.push(record.claimId);
  }

  const missingIds = (graph?.edges || []).map(edge => edge.id).filter(id => !validReviewed.has(id));
  const passed = invalidRecords.length === 0
    && missingIds.length === 0
    && revised.length === 0
    && rejected.length === 0
    && accepted.length === (graph?.edges || []).length;
  return { passed, accepted, revised, rejected, missingIds, invalidRecords };
}

export function classifySourceCheck(result) {
  const sourceId = nonempty(result?.sourceId) ? result.sourceId : '';
  const url = nonempty(result?.url) ? result.url : '';
  if (!nonempty(result?.checkedAt)) {
    return { sourceId, url, status: 'not-checked', checkedAt: null, detail: 'No source-access check recorded.' };
  }
  if (result.ok === true) {
    const code = Number.isInteger(result.statusCode) ? `HTTP ${result.statusCode}` : 'Reachable';
    return { sourceId, url, status: 'reachable', checkedAt: result.checkedAt, detail: code };
  }
  const parts = [];
  if (Number.isInteger(result.statusCode)) parts.push(`HTTP ${result.statusCode}`);
  if (nonempty(result.error)) parts.push(result.error.trim());
  return {
    sourceId,
    url,
    status: 'unreachable',
    checkedAt: result.checkedAt,
    detail: parts.join(' · ') || 'Source could not be reached.',
  };
}

export function createScientificReviewTemplate(graph) {
  const sources = new Map((graph?.sources || []).map(source => [source.id, source]));
  return {
    schemaVersion: 1,
    graphCheckedAt: graph?.checkedAt || null,
    status: 'pending-independent-review',
    records: (graph?.edges || []).map(edge => ({
      claimId: edge.id,
      claim: edge.claim,
      relationshipType: edge.relationshipType || edge.relation,
      evidenceStatus: edge.evidenceStatus,
      limitations: edge.limitations,
      sources: edge.sourceIds.map(sourceId => ({
        sourceId,
        title: sources.get(sourceId)?.title || sourceId,
        url: sources.get(sourceId)?.url || '',
      })),
      decision: null,
      reviewer: { name: '', role: '' },
      reviewedAt: null,
      note: '',
    })),
  };
}

export function renderScientificReviewPacket(graph, template = createScientificReviewTemplate(graph)) {
  const sections = template.records.map(record => {
    const sourceLinks = record.sources
      .map(source => `[${source.title}](${source.url})`)
      .join('; ');
    return [
      `## ${record.claimId}`,
      '',
      record.claim,
      '',
      `Evidence status: ${record.evidenceStatus}.`,
      '',
      `Limitation: ${record.limitations}`,
      '',
      `Sources: ${sourceLinks}`,
      '',
      'Decision: [ ] Accept  [ ] Revise  [ ] Reject',
      '',
      'Reviewer note:',
      '',
    ].join('\n');
  });
  return [
    '# Independent scientific review packet',
    '',
    'Status: pending. AI source checking is not independent expert approval.',
    '',
    `Graph checked: ${template.graphCheckedAt || 'unknown'}`,
    '',
    'Reviewer name:',
    '',
    'Reviewer role/qualification:',
    '',
    'Review date (YYYY-MM-DD):',
    '',
    'Instructions: review every claim against its linked source and limitation. Mark exactly one decision per claim. A revision or rejection keeps the scientific release gate open until the graph is updated and reviewed again.',
    '',
    ...sections,
  ].join('\n').trimEnd() + '\n';
}
