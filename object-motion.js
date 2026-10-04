// Visual encodings of known graph attributes, not biological measurements.
export const MOTION_PROFILES = Object.freeze({
  disease: {label:'Condition',period:7.2,depth:.14,spread:.20},
  gene: {label:'Gene',period:5.6,depth:.18,spread:.24},
  phenotype: {label:'Phenotype',period:6.4,depth:.12,spread:.18},
  study: {label:'Study',period:8.4,depth:.16,spread:.28},
  community: {label:'Community',period:9.2,depth:.13,spread:.22},
});
export function motionAttributes(item,index=0) {
  const profile=MOTION_PROFILES[item.type] || {label:'Entity',period:8,depth:.12,spread:.18};
  return {...profile,phase:index*2.3999632297,sourceCount:Math.max(0,Math.min(32,Math.floor(item.sourceCount||0))),connectionCount:Math.max(0,Math.min(64,Math.floor(item.connectionCount||0)))};
}
export function sampleObjectMotion(attributes,time) {
  const phase=time*Math.PI*2/attributes.period+attributes.phase;
  return {depth:attributes.depth*(.5+.5*Math.sin(phase)),spread:.08+attributes.spread*(.5+.5*Math.sin(phase*.75)),scanY:Math.sin(phase*1.7*(1+Math.min(attributes.connectionCount,8)*.08))*.53,pulse:.35+.65*(.5+.5*Math.sin(phase*2)),phase};
}
