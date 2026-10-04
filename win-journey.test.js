import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {coordinationImpact,coordinationHypothesis} from './win-journey.js';
import {extractionArtifact} from './win-openai.js';
import {evidencePackage} from './win-evidence.js';
test('coordination estimates report actual ratios including no gain and slower scenarios',()=>{
 assert.equal(coordinationImpact(10,1).ratio,10);assert.equal(coordinationImpact(10,5).ratio,2);
 assert.equal(coordinationImpact(10,10).ratio,1);assert.equal(coordinationImpact(5,10).ratio,.5);
 for(const [a,b] of [[0,1],[1,0],[-1,2],[1,Infinity],[NaN,1],[1e308,1e-308]])assert.equal(coordinationImpact(a,b),null);
});
test('the rendered milestone contract is the disclosed 10-week to 1-week hypothesis',()=>{
 assert.equal(coordinationHypothesis.baselineWeeks,10);assert.equal(coordinationHypothesis.assistedWeeks,1);assert.equal(coordinationHypothesis.ratio,10);
 assert.match(coordinationHypothesis.label,/illustrative/i);assert.match(coordinationHypothesis.label,/not a measured result/i);
 assert.match(coordinationHypothesis.exclusions,/biological progress/i);assert.match(coordinationHypothesis.exclusions,/clinical review/i);
});
test('offline extraction artifact preserves real source inputs without fabricating a model or human approval',()=>{
 assert.equal(extractionArtifact.model,null);assert.equal(extractionArtifact.reviewDecision,'pending-independent-expert');
 for(const record of extractionArtifact.records){const edge=evidencePackage.edges.find(e=>e.id===record.edgeId);assert.equal(record.claim,edge.claim);assert.ok(record.input.length);assert.ok(record.supportingTextSpan.every(s=>s.passage||s.field));assert.equal(record.reviewDecision,'pending-independent-expert');}
 const stored=JSON.parse(readFileSync(new URL('./data/openai-win-extraction.json',import.meta.url)));assert.deepEqual(stored,extractionArtifact);
});
