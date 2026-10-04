/** Deterministic scalar mechanics. No storage, device profiling, or network state. */
export const HOLOGRAM_LIMITS=Object.freeze({maxItems:12,highParticlesPerItem:1024,lowParticlesPerItem:256,maxPointerSpeed:2.4,maxFrameSeconds:.1});
export const CARTESIAN_LAYOUT=Object.freeze([
 Object.freeze([-3.30,2.45,0]),Object.freeze([-1.10,2.45,0]),Object.freeze([1.10,2.45,0]),Object.freeze([3.30,2.45,0]),
 Object.freeze([-3.30,0,0]),Object.freeze([-1.10,0,0]),Object.freeze([1.10,0,0]),Object.freeze([3.30,0,0]),
 Object.freeze([-3.30,-2.45,0]),Object.freeze([-1.10,-2.45,0]),Object.freeze([1.10,-2.45,0]),Object.freeze([3.30,-2.45,0]),
]);
export function clamp(value,min,max){return Math.max(min,Math.min(max,value));}

/** Closed-form damped spring for a target held constant over dt seconds.
 * Handles under-, critically-, and over-damped motion without Euler drift.
 */
export function stepSpring(state,target,dt,{frequency=2.8,dampingRatio=.86}={}){
 const {value,velocity}=state;
 if(![value,velocity,target,dt,frequency,dampingRatio].every(Number.isFinite))throw new TypeError('Spring inputs must be finite.');
 if(frequency<=0||dampingRatio<0)throw new RangeError('Spring frequency must be positive and damping nonnegative.');
 if(dt<=0)return {value,velocity};
 const w=2*Math.PI*frequency,z=dampingRatio,x=value-target,v=velocity;
 let nextX,nextV;
 if(Math.abs(z-1)<1e-5){
  const e=Math.exp(-w*dt),b=v+w*x;nextX=(x+b*dt)*e;nextV=(v-w*b*dt)*e;
 }else if(z<1){
  const wd=w*Math.sqrt(1-z*z),e=Math.exp(-z*w*dt),c=Math.cos(wd*dt),s=Math.sin(wd*dt),b=(v+z*w*x)/wd;
  nextX=e*(x*c+b*s);nextV=e*(-z*w*(x*c+b*s)+wd*(-x*s+b*c));
 }else{
  const root=Math.sqrt(z*z-1),r1=-w*(z-root),r2=-w*(z+root),a=(v-r2*x)/(r1-r2),b=x-a,e1=Math.exp(r1*dt),e2=Math.exp(r2*dt);
  nextX=a*e1+b*e2;nextV=r1*a*e1+r2*b*e2;
 }
 if(Math.abs(nextX)<1e-7&&Math.abs(nextV)<1e-7)return {value:target,velocity:0};
 return {value:target+nextX,velocity:nextV};
}

/** Pixels per millisecond, bounded; callers retain only the immediately prior point. */
export function pointerSpeed(previous,current,elapsedMs){
 if(!previous||!current||!Number.isFinite(elapsedMs)||elapsedMs<=0)return 0;
 const distance=Math.hypot(current.x-previous.x,current.y-previous.y);
 return Number.isFinite(distance)?clamp(distance/elapsedMs,0,HOLOGRAM_LIMITS.maxPointerSpeed):0;
}
export function dampingForSpeed(speed){
 return .86+.54*clamp(Number.isFinite(speed)?speed:0,0,HOLOGRAM_LIMITS.maxPointerSpeed)/HOLOGRAM_LIMITS.maxPointerSpeed;
}
export function layerPosition(base,axis,amount){
 if(base.length!==3||axis.length!==3||![...base,...axis,amount].every(Number.isFinite))throw new TypeError('Layer coordinates must be finite xyz values.');
 return base.map((coordinate,i)=>coordinate+axis[i]*amount);
}
export function frameSummary(samples){
 const ordered=samples.filter(n=>Number.isFinite(n)&&n>0).slice(-180).sort((a,b)=>a-b);
 return {sampleCount:ordered.length,medianMs:ordered.length?ordered[Math.floor(ordered.length*.5)]:null,p95Ms:ordered.length?ordered[Math.min(ordered.length-1,Math.floor(ordered.length*.95))]:null};
}
