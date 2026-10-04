const FORBIDDEN_CLINICAL_ACTION = /\b(?:enroll(?:ment)?|eligib(?:le|ility)|qualif(?:y|ies|ied|ication)|diagnos(?:e|is)|prescrib(?:e|ing)|treat(?:ment)? recommendation|join(?:ing)?\s+(?:the\s+)?(?:study|trial))\b/i;
const APPROVED_ACTION_TYPES = new Set(['contact-source-owner-for-research-coordination-review']);

function isNonEmptyStringArray(value) {
  return Array.isArray(value) && value.length > 0 && value.every(item => typeof item === 'string' && item.trim());
}

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

  if (!isNonEmptyStringArray(study.recommendedNodeIds)) errors.push('Recommended nodes must be a non-empty list.');
  if (!isNonEmptyStringArray(study.evidenceEdgeIds)) errors.push('Evidence edges must be a non-empty list.');
  for (const id of study.recommendedNodeIds || []) if (!nodeIds.has(id)) errors.push(`Missing recommended node: ${id}`);
  for (const id of study.evidenceEdgeIds || []) {
    const edge = edgeById.get(id);
    if (!edge) { errors.push(`Missing evidence edge: ${id}`); continue; }
    if (!edge.claim || !edge.evidenceType || !edge.evidenceStatus || !edge.reviewStatus || !edge.limitations) errors.push(`Incomplete evidence edge: ${id}`);
    if (!isNonEmptyStringArray(edge.sourceIds)) errors.push(`Edge sources must be non-empty: ${id}`);
    if (!edge.sourceIds?.length) errors.push(`Missing edge sources: ${id}`);
    for (const sourceId of edge.sourceIds || []) if (!sourceIds.has(sourceId)) errors.push(`Missing edge source: ${sourceId}`);
  }

  if (!APPROVED_ACTION_TYPES.has(study.action?.type)) errors.push(`Unsupported action type: ${study.action?.type || 'missing'}`);
  if (!isNonEmptyStringArray(study.action?.sourceIds)) errors.push('Action sources must be a non-empty list.');
  if (!study.action?.sourceIds?.length) errors.push('Missing action sources.');
  if (study.action?.type !== 'contact-source-owner-for-research-coordination-review') errors.push('Unsupported action type.');
  for (const route of study.routes || []) {
    if (route.edgeIds?.length !== route.nodeIds?.length - 1) errors.push('Invalid route hop count.');
    (route.edgeIds || []).forEach((id,index)=>{const e=edgeById.get(id),a=route.nodeIds[index],b=route.nodeIds[index+1];if(!e||!((e.from===a&&e.to===b)||(e.to===a&&e.from===b)))errors.push(`Unsupported route hop: ${id}`);});
  }
  if (study.id==='frda-action-journey' && (study.impact?.baselineWeeks!==10||study.impact?.assistedWeeks!==1)) errors.push('Legacy 10-to-1 hypothesis metadata is inconsistent.');
  for (const sourceId of study.action?.sourceIds || []) if (!sourceIds.has(sourceId)) errors.push(`Missing action source: ${sourceId}`);
  const actionLanguage = [study.action?.text, study.action?.output].filter(Boolean).join(' ');
  if (FORBIDDEN_CLINICAL_ACTION.test(actionLanguage)) errors.push('Unsafe clinical action language.');

  const usedRouteEdges = new Set();
  const usedRouteNodes = new Set();
  if (!Array.isArray(study.routes) || !study.routes.length) errors.push('At least one explicit evidence route is required.');
  for (const route of study.routes || []) {
    if (!route?.id || !route?.label || !isNonEmptyStringArray(route.nodeIds) || route.nodeIds.length < 2 || !isNonEmptyStringArray(route.edgeIds)) {
      errors.push(`Invalid route definition: ${route?.id || 'unknown'}`);
      continue;
    }
    if (route.edgeIds.length !== route.nodeIds.length - 1) errors.push(`Route hop count mismatch: ${route.id}`);
    route.nodeIds.forEach(id => {
      usedRouteNodes.add(id);
      if (!nodeIds.has(id)) errors.push(`Missing route node: ${id}`);
    });
    route.edgeIds.forEach((edgeId, index) => {
      usedRouteEdges.add(edgeId);
      const edge = edgeById.get(edgeId);
      if (!edge) { errors.push(`Missing route edge: ${edgeId}`); return; }
      if (!(study.evidenceEdgeIds || []).includes(edgeId)) errors.push(`Route edge is outside evidence set: ${edgeId}`);
      const from = route.nodeIds[index];
      const to = route.nodeIds[index + 1];
      if (!from || !to || !((edge.from === from && edge.to === to) || (edge.from === to && edge.to === from))) {
        errors.push(`Unsupported route hop in ${route.id}: ${from || 'missing'} to ${to || 'missing'} via ${edgeId}`);
      }
    });
  }
  for (const id of study.recommendedNodeIds || []) if (!usedRouteNodes.has(id)) errors.push(`Recommended node is not on an evidence route: ${id}`);
  for (const id of study.evidenceEdgeIds || []) if (!usedRouteEdges.has(id)) errors.push(`Evidence edge is not displayed on a route: ${id}`);

  if (study.rejectedCandidate?.decision !== 'not-actionable') errors.push('Rejected candidate must remain not-actionable.');
  if ((study.recommendedNodeIds || []).includes(study.rejectedCandidate?.nodeId)) errors.push('Rejected candidate cannot be recommended.');
  const rejectedEdge = edgeById.get(study.rejectedCandidate?.edgeId);
  if (!nodeIds.has(study.rejectedCandidate?.nodeId)) errors.push('Rejected candidate node is missing.');
  if (!rejectedEdge || ![rejectedEdge.from, rejectedEdge.to].includes(study.rejectedCandidate?.nodeId)) errors.push('Rejected candidate edge is missing or unrelated.');
  if ((study.evidenceEdgeIds || []).includes(study.rejectedCandidate?.edgeId)) errors.push('Rejected candidate edge cannot be part of the recommended evidence route.');

  try {
    const impact = calculateAcceleration(study.impact?.baselineWeeks, study.impact?.assistedWeeks);
    if (impact.baselineWeeks !== 10 || impact.assistedWeeks !== 1 || impact.ratio !== 10) errors.push('Impact hypothesis must remain the disclosed 10-to-1 coordination scenario.');
  } catch (error) { errors.push(`Invalid impact hypothesis: ${error.message}`); }
  return errors;
}
