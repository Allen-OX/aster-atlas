const FORBIDDEN_CLINICAL_ACTION = /\b(enroll|eligible|diagnos(?:e|is)|prescrib(?:e|ing)|treat(?:ment)? recommendation)\b/i;

export function calculateAcceleration(baselineWeeks, assistedWeeks) {
  if (!Number.isFinite(baselineWeeks) || !Number.isFinite(assistedWeeks) || baselineWeeks <= 0 || assistedWeeks <= 0) {
    throw new TypeError('Timeline values must be positive finite numbers.');
  }
  if (assistedWeeks >= baselineWeeks) throw new RangeError('The assisted timeline must be shorter than the baseline.');
  const ratio = baselineWeeks / assistedWeeks;
  return {
    baselineWeeks,
    assistedWeeks,
    ratio,
    label: `${Number.isInteger(ratio) ? ratio : ratio.toFixed(1)}×`
  };
}

export function validateCaseStudy(study, graph) {
  const errors = [];
  if (!study || !graph) return ['Case study and graph are required.'];
  const nodeIds = new Set((graph.nodes || []).map(node => node.id));
  const edgeById = new Map((graph.edges || []).map(edge => [edge.id, edge]));
  const sourceIds = new Set((graph.sources || []).map(source => source.id));

  for (const id of study.recommendedNodeIds || []) if (!nodeIds.has(id)) errors.push(`Missing recommended node: ${id}`);
  for (const id of study.evidenceEdgeIds || []) {
    const edge = edgeById.get(id);
    if (!edge) { errors.push(`Missing evidence edge: ${id}`); continue; }
    if (!edge.claim || !edge.evidenceType || !edge.evidenceStatus || !edge.reviewStatus || !edge.limitations) errors.push(`Incomplete evidence edge: ${id}`);
    for (const sourceId of edge.sourceIds || []) if (!sourceIds.has(sourceId)) errors.push(`Missing edge source: ${sourceId}`);
  }
  for (const sourceId of study.action?.sourceIds || []) if (!sourceIds.has(sourceId)) errors.push(`Missing action source: ${sourceId}`);
  if (FORBIDDEN_CLINICAL_ACTION.test(study.action?.text || '')) errors.push('Unsafe clinical action language.');
  if (study.rejectedCandidate?.decision !== 'not-actionable') errors.push('Rejected candidate must remain not-actionable.');
  if ((study.recommendedNodeIds || []).includes(study.rejectedCandidate?.nodeId)) errors.push('Rejected candidate cannot be recommended.');
  try { calculateAcceleration(study.impact?.baselineWeeks, study.impact?.assistedWeeks); } catch (error) { errors.push(`Invalid impact hypothesis: ${error.message}`); }
  return errors;
}
