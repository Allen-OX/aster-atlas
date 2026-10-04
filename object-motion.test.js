import test from 'node:test';
import assert from 'node:assert/strict';
import {nodes} from './data.js';
import {motionAttributes,sampleObjectMotion} from './object-motion.js';

test('every entity has bounded continuous motion and preserves a frozen time sample',()=>{
 for(const [index,node] of nodes.entries()){
  const attributes=motionAttributes({...node,sourceCount:node.sourceIds.length},index);
  assert.equal(attributes.sourceCount,node.sourceIds.length);
  let changes=0;
  for(let time=0;time<30;time+=.1){
   const sample=sampleObjectMotion(attributes,time),next=sampleObjectMotion(attributes,time+.001);
   for(const value of Object.values(sample))assert.ok(Number.isFinite(value));
   assert.ok(sample.depth>=0&&sample.depth<=attributes.depth);
   assert.ok(sample.spread>=.08&&sample.spread<=.08+attributes.spread);
   assert.ok(Math.abs(sample.scanY)<=.53);
   assert.ok(Math.abs(next.depth-sample.depth)<.001);
   assert.deepEqual(sampleObjectMotion(attributes,time),sample);
   if(next.depth!==sample.depth)changes++;
  }
  assert.ok(changes>250);
 }
});
