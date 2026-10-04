import test from 'node:test';
import assert from 'node:assert/strict';
import {stepSpring,pointerSpeed,dampingForSpeed,layerPosition,frameSummary,CARTESIAN_LAYOUT,HOLOGRAM_LIMITS} from './hologram-math.js';
const close=(a,b,tolerance=1e-9)=>assert(Math.abs(a-b)<=tolerance,`${a} differs from ${b}`);
test('closed-form motion agrees at 30, 60, and 144 Hz for every damping regime',()=>{
 for(const dampingRatio of [.65,1,1.4]){
  const expected=stepSpring({value:0,velocity:0},1.2,.5,{dampingRatio});
  for(const fps of [30,60,144]){let state={value:0,velocity:0};for(let i=0;i<fps/2;i++)state=stepSpring(state,1.2,1/fps,{dampingRatio});close(state.value,expected.value);close(state.velocity,expected.velocity);}
 }
});
test('rapid repeated enter/leave settles without accumulated offset',()=>{
 let state={value:0,velocity:0};let peak=0;
 for(let cycle=0;cycle<100;cycle++)for(const target of [1,0])for(let i=0;i<8;i++){state=stepSpring(state,target,1/60);peak=Math.max(peak,Math.abs(state.value));assert(Number.isFinite(state.velocity));}
 for(let i=0;i<360;i++)state=stepSpring(state,0,1/60);
 close(state.value,0,1e-6);close(state.velocity,0,1e-6);assert(peak<1.15);
});
test('springs settle and remain finite across large frame delays',()=>{
 for(const dampingRatio of [.86,1,1.4]){let state=stepSpring({value:-.5,velocity:3},1.15,10,{dampingRatio});close(state.value,1.15,1e-6);close(state.velocity,0,1e-6);}
 assert.throws(()=>stepSpring({value:NaN,velocity:0},1,.1),TypeError);
 assert.throws(()=>stepSpring({value:0,velocity:0},1,.1,{frequency:0}),RangeError);
});
test('pointer pacing is local bounded velocity, with increasing damping',()=>{
 close(pointerSpeed({x:0,y:0},{x:3,y:4},10),.5);
 close(pointerSpeed({x:0,y:0},{x:500,y:500},1),HOLOGRAM_LIMITS.maxPointerSpeed);
 assert.equal(pointerSpeed(null,{x:0,y:0},16),0);assert.equal(pointerSpeed({x:0,y:0},{x:1,y:1},0),0);
 assert(dampingForSpeed(2)>dampingForSpeed(.1));assert.equal(dampingForSpeed(Infinity),.86);
});
test('Cartesian layer placement never mutates bases or accumulates movement',()=>{
 const base=Object.freeze([.2,.3,.4]),axis=Object.freeze([0,0,.5]);
 for(let i=0;i<100;i++){assert.deepEqual(layerPosition(base,axis,1),[.2,.3,.9]);assert.deepEqual(layerPosition(base,axis,0),base);}
 assert.deepEqual(base,[.2,.3,.4]);assert.equal(CARTESIAN_LAYOUT.length,12);assert.equal(HOLOGRAM_LIMITS.maxItems,12);assert(CARTESIAN_LAYOUT.every(p=>p[2]===0&&Object.isFrozen(p)));
});
test('performance summaries report measured bounded samples, not claims',()=>{
 const s=frameSummary(Array.from({length:200},(_,i)=>10+i));assert.equal(s.sampleCount,180);close(s.medianMs,120);close(s.p95Ms,201);assert.equal(frameSummary([]).medianMs,null);
});
