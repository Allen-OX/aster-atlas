import { evidencePackage } from './win-evidence.js';
import { OPENAI_DISCLOSURE } from './openai-disclosure.js';
// OpenAI Codex assisted implementation and build-time structured extraction.
// This is provenance for local work, not a runtime model or paid API execution.
const selected=['frda-iscu-mechanism','tissue-difference','model-counterexample','faclr-partner'];
export const extractionArtifact={
 schemaVersion:1,tool:'OpenAI Codex',mode:'implementation assistance and build-time structured extraction',runtimeModelCall:false,paidApiCall:false,
 disclosure:OPENAI_DISCLOSURE,
 model:null,modelDisclosure:'Exact model identifier was not exposed by this session; do not infer it.',
 promptVersion:'aster-win-readiness-extraction-v1',
 prompt:'Extract stable entities and exact source-supported claims about FRDA, ISCU, iron–sulfur biology and candidate asset reuse. Preserve source spans, distinguish inference and counterevidence, include tissue and model limitations, and mark every candidate pending independent expert review. Never infer treatment transfer or confirmed collaboration.',
 createdAt:'2026-10-04',reviewDecision:'pending-independent-expert',
 reviewerNote:'AI source checking and schema tests have completed. No qualified human approval or prize eligibility is asserted.',
 records:selected.map(id=>{const e=evidencePackage.edges.find(e=>e.id===id);return {
  id:`codex-v1-${id}`,model:null,promptVersion:'aster-win-readiness-extraction-v1',
  input:e.support?.map(s=>({sourceId:s.sourceId,exactPassage:s.passage||null,structuredField:s.field||null}))||[],
  proposedSubject:e.from,proposedRelationship:e.relation,proposedObject:e.to,edgeId:e.id,claim:e.claim,
  qualifiers:[e.evidenceStatus],limitations:e.limitations,supportingTextSpan:e.support||[],
  reviewDecision:'pending-independent-expert',reviewerNote:'Source checked by AI. A qualified reviewer must accept, revise or reject this candidate.'
 };})
};
