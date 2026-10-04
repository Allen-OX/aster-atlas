/** Original illustrative instrument sculptures. Entity types choose visual families;
 * dimensions, ornament and motion do not encode biomedical properties or evidence.
 * No renderer, data imports, network requests, timers, or application state. */
export function buildDetailedObject({THREE,node,seed,parts,materials,own,mesh,boxes}) {
 const {shell,structure,core,detail}=parts,{metal,dark,pearl,accent,glow}=materials;
 if(!THREE||![shell,structure,core,detail].every(Boolean)||typeof mesh!=='function'||typeof boxes!=='function')throw new TypeError('Detailed objects require Three, four layer groups, and mesh/boxes helpers.');
 const identity=String(node?.id||'object');let idHash=2166136261;for(const character of identity){idHash^=character.charCodeAt(0);idHash=Math.imul(idHash,16777619);}seed=(Number.isFinite(seed)?seed:idHash)>>>0;
 const variant=seed%3,rounding=.85+((seed>>>8)%7)*.04,channelCount=5+(seed>>>4)%3,partRoots=[shell,structure,core,detail],created=[],cache=new Map();
 const add=(parent,geometry,material,position=[0,0,0],rotation)=>{const object=mesh(parent,geometry,material,position,rotation);created.push(object);return object;};
 const batch=(parent,size,positions,material)=>{if(!positions.length)return;const object=boxes(parent,size,positions,material);created.push(object);return object;};
 const cached=(key,create)=>{if(!cache.has(key))cache.set(key,own(create()));return cache.get(key);};
 function roundedShape(width,height,radius){const w=width/2,h=height/2,r=Math.min(radius,w,h),s=new THREE.Shape();s.moveTo(-w+r,-h);s.lineTo(w-r,-h);s.quadraticCurveTo(w,-h,w,-h+r);s.lineTo(w,h-r);s.quadraticCurveTo(w,h,w-r,h);s.lineTo(-w+r,h);s.quadraticCurveTo(-w,h,-w,h-r);s.lineTo(-w,-h+r);s.quadraticCurveTo(-w,-h,-w+r,-h);return s;}
 function plate(parent,w,h,d,mat,p,radius=.06,rotation){const bevel=Math.min(.022,d*.21);const key=['plate',w,h,d,radius].join(':');const geometry=cached(key,()=>{const g=new THREE.ExtrudeGeometry(roundedShape(w-bevel*2,h-bevel*2,radius*rounding),{depth:d-bevel*2,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:bevel,bevelThickness:bevel,curveSegments:4});g.translate(0,0,-(d-bevel*2)/2);return g;});return add(parent,geometry,mat,p,rotation);}
 function cylinder(parent,radius,length,mat,p,segments=24,rotation=[Math.PI/2,0,0]){return add(parent,cached(`c:${radius}:${length}:${segments}`,()=>new THREE.CylinderGeometry(radius,radius,length,segments,1)),mat,p,rotation);}
 function ring(parent,radius,tube,mat,p,rotation=[0,0,0],segments=48){return add(parent,cached(`t:${radius}:${tube}:${segments}`,()=>new THREE.TorusGeometry(radius,tube,6,segments)),mat,p,rotation);}
 function instances(parent,geometry,positions,mat,rotation=[0,0,0]){const object=own(new THREE.InstancedMesh(geometry,mat,positions.length)),pose=new THREE.Object3D();pose.rotation.set(...rotation);positions.forEach((p,i)=>{pose.position.set(...p);pose.updateMatrix();object.setMatrixAt(i,pose.matrix);});parent.add(object);created.push(object);return object;}
 function screws(parent,positions){instances(parent,cached('screw',()=>new THREE.CylinderGeometry(.022,.022,.018,8)),positions,metal,[Math.PI/2,0,0]);batch(parent,[.023,.005,.006],positions.map(([x,y,z])=>[x,y,z+.012]),dark);}
 function frontScrews(parent,width,height,y,z){screws(parent,[[-width/2,y-height/2,z],[width/2,y-height/2,z],[-width/2,y+height/2,z],[width/2,y+height/2,z]]);}
 function connectors(parent,x,y,z,count=4){const positions=Array.from({length:count},(_,i)=>[x+i*.075,y,z]);batch(parent,[.045,.052,.07],positions,dark);batch(detail,[.021,.029,.008],positions.map(([a,b,c])=>[a,b,c+.041]),metal);}
 function circuitBoard(w=.74,h=.59,y=.36,z=0){plate(core,w,h,.05,dark,[0,y,z],.025);batch(core,[.11,.09,.027],[[-.21,y+.12,z+.04],[.18,y-.10,z+.04],[.21,y+.16,z+.04]],metal);plate(core,.23,.19,.035,accent,[0,y,z+.052],.012);const traces=[];for(let i=0;i<channelCount;i++)traces.push([-.30+i*.10,y-.22,z+.035]);batch(detail,[.022,.18,.009],traces,pearl);batch(detail,[.031,.033,.035],traces.map(([x,yy,zz])=>[x,yy-.065,zz+.019]),metal);}
 function cartridge(){
  // Detached front/back armor leaves the inner cage and board readable on split.
  plate(shell,1.13,1.09,.15,pearl,[0,.38,-.32],.10);plate(shell,1.13,1.09,.12,pearl,[0,.38,.34],.10);
  plate(shell,.86,.78,.027,dark,[0,.38,.415],.065);plate(shell,.58,.23,.033,metal,[0,.56,.445],.025);plate(shell,.49,.135,.012,accent,[0,.56,.468],.013);
  batch(shell,[.044,.28,.018],Array.from({length:channelCount},(_,i)=>[-.29+i*.095,.17,.435]),metal);
  batch(structure,[.075,.90,.078],[[-.45,.36,-.19],[.45,.36,-.19],[-.45,.36,.19],[.45,.36,.19]],metal);
  batch(structure,[.94,.055,.055],[[0,-.08,0],[0,.82,0]],dark);circuitBoard();
  frontScrews(detail,.99,.94,.38,.417);connectors(detail,-.19,.81,.424,6);
  plate(detail,.11,.55,.035,accent,[.57,.38,.10],.014,[0,Math.PI/2,0]);
 }
 function scanner(){
  const shape=new THREE.Shape();shape.absarc(0,0,.59,0,Math.PI*2,false);const hole=new THREE.Path();hole.absarc(0,0,.405,0,Math.PI*2,true);shape.holes.push(hole);
  const housing=cached('scanner-ring',()=>{const g=new THREE.ExtrudeGeometry(shape,{depth:.22,bevelEnabled:true,bevelSegments:2,bevelSize:.022,bevelThickness:.022,curveSegments:32,steps:1});g.translate(0,0,-.11);return g;});add(shell,housing,pearl,[0,.43,0]);
  ring(shell,.49,.012,metal,[0,.43,.14]);ring(structure,.376,.029,dark,[0,.43,.015]);ring(core,.345,.014,accent,[0,.43,.04]);
  plate(structure,.89,.20,.65,dark,[0,-.15,0],.06);plate(shell,.97,.085,.69,pearl,[0,-.24,0],.05);
  plate(core,.31,.58,.27,metal,[0,.29,0],.03);plate(core,.25,.36,.035,dark,[0,.31,.157],.02);plate(core,.19,.21,.014,accent,[0,.36,.183],.008);
  const sensor=[];for(let i=0;i<12;i++){const a=i/12*Math.PI*2;sensor.push([Math.cos(a)*.343,.43+Math.sin(a)*.343,.083]);}instances(detail,cached('sensor',()=>new THREE.SphereGeometry(.017,8,5)),sensor,glow);
  const bolts=[];for(let i=0;i<8;i++){const a=i/8*Math.PI*2;bolts.push([Math.cos(a)*.52,.43+Math.sin(a)*.52,.15]);}screws(detail,bolts);connectors(detail,-.12,-.145,.346,4);
 }
 function helix(){
  plate(shell,.94,.13,.76,pearl,[0,-.16,0],.08);plate(shell,.79,.095,.65,metal,[0,1.03,0],.05);
  batch(structure,[.045,1.14,.05],[[-.39,.45,-.22],[.39,.45,-.22]],metal);
  const phase=(seed%7)*.11,twist=Math.PI*(2.55+variant*.17),paths=[[],[]];
  for(let i=0;i<=56;i++){const t=i/56,a=phase+t*twist;for(let strand=0;strand<2;strand++)paths[strand].push(new THREE.Vector3(Math.cos(a+strand*Math.PI)*.26,-.055+t*.98,Math.sin(a+strand*Math.PI)*.26));}
  paths.forEach((points,i)=>add(core,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),64,.039,7,false),i?metal:accent));
  const rungGeometry=cached('rung',()=>new THREE.CylinderGeometry(.014,.014,1,7)),rungs=own(new THREE.InstancedMesh(rungGeometry,pearl,13)),pose=new THREE.Object3D(),up=new THREE.Vector3(0,1,0),a=new THREE.Vector3(),b=new THREE.Vector3(),delta=new THREE.Vector3();
  for(let i=0;i<13;i++){const t=(i+.5)/13,angle=phase+t*twist;a.set(Math.cos(angle)*.235,-.055+t*.98,Math.sin(angle)*.235);b.set(-a.x,a.y,-a.z);delta.subVectors(b,a);pose.position.copy(a).add(b).multiplyScalar(.5);pose.quaternion.setFromUnitVectors(up,delta.clone().normalize());pose.scale.set(1,delta.length(),1);pose.updateMatrix();rungs.setMatrixAt(i,pose.matrix);}core.add(rungs);created.push(rungs);
  ring(structure,.34,.017,dark,[0,-.01,0],[Math.PI/2,0,0]);ring(structure,.34,.017,dark,[0,.96,0],[Math.PI/2,0,0]);
  frontScrews(detail,.77,.065,-.16,.394);batch(detail,[.06,.018,.015],Array.from({length:6},(_,i)=>[-.25+i*.10,-.15,.397]),glow);
  plate(shell,.34,.09,.032,dark,[0,1.03,.346],.016);plate(detail,.22,.018,.01,accent,[0,1.03,.37],.006);
 }
 function opticalSensor(){
  plate(shell,.91,.94,.16,pearl,[0,.40,-.20],.14);plate(structure,.70,.69,.18,dark,[0,.40,-.035],.08);
  cylinder(shell,.355,.15,metal,[0,.50,.11],32);cylinder(core,.302,.085,dark,[0,.50,.22],32);cylinder(core,.25,.029,accent,[0,.50,.275],40);
  ring(detail,.264,.018,pearl,[0,.50,.30]);ring(detail,.338,.015,dark,[0,.50,.199]);ring(core,.175,.008,metal,[0,.50,.296]);
  cylinder(core,.105,.014,glow,[0,.50,.296],32);const tick=[];for(let i=0;i<12;i++){const a=i*Math.PI/6;tick.push([Math.cos(a)*.305,.50+Math.sin(a)*.305,.208]);}instances(detail,cached('optic-marker',()=>new THREE.SphereGeometry(.012,6,4)),tick,pearl);
  frontScrews(detail,.71,.73,.40,-.107);plate(shell,.46,.15,.25,metal,[0,-.10,-.02],.04);plate(structure,.77,.075,.57,dark,[0,-.205,-.02],.05);
  connectors(detail,-.14,.10,.15,5);batch(detail,[.013,.21,.015],Array.from({length:7},(_,i)=>[-.26+i*.087,.52,-.293]),dark);
  if(variant!==0){cylinder(shell,.074,.06,metal,[.29,.09,.165],16);cylinder(detail,.048,.018,accent,[.29,.09,.207],16);}
 }
 function archiveConsole(){
  plate(shell,1.10,.99,.14,pearl,[0,.35,-.30],.08);batch(structure,[.07,1.00,.57],[[-.51,.35,0],[.51,.35,0]],metal);plate(shell,1.09,.12,.68,pearl,[0,.91,0],.07);plate(shell,1.09,.11,.68,pearl,[0,-.205,0],.07);
  const trays=3+variant;for(let i=0;i<trays;i++){const y=-.055+i*.16;plate(core,.89,.124,.52,dark,[0,y,-.015],.022);plate(core,.83,.096,.035,metal,[0,y,.263],.014);plate(detail,.33,.052,.029,pearl,[-.10,y,.292],.011);}
  plate(shell,.89,.19,.13,dark,[0,.715,.22],.025);plate(detail,.63,.096,.018,accent,[-.045,.722,.296],.012);
  const lamps=Array.from({length:trays},(_,i)=>[.33,-.055+i*.16,.291]);batch(detail,[.027,.018,.010],lamps,glow);frontScrews(detail,.97,.98,.35,.348);
  batch(structure,[.025,.80,.028],[[-.29,.35,-.203],[-.13,.35,-.203],[.13,.35,-.203],[.29,.35,-.203]],accent);connectors(detail,-.18,.715,.307,2);
 }
 function relay(){
  plate(shell,.87,.64,.38,pearl,[0,.17,0],.10);plate(core,.68,.44,.05,dark,[0,.18,.224],.038);plate(core,.44,.20,.037,accent,[0,.24,.272],.02);
  batch(structure,[.055,.59,.055],[[-.27,.64,-.07],[.27,.64,-.07]],metal);
  const dish=new THREE.SphereGeometry(.37,32,16,0,Math.PI*2,0,.85);dish.rotateX(Math.PI/2);add(shell,dish,metal,[0,.79,-.035]);
  ring(shell,.278,.018,pearl,[0,.79,.207]);cylinder(core,.065,.20,dark,[0,.79,.22],16);cylinder(detail,.045,.035,glow,[0,.79,.34],16);
  batch(detail,[.018,.019,.28],[[-.16,.79,.13],[.16,.79,.13]],metal);frontScrews(detail,.73,.49,.17,.211);connectors(detail,-.15,-.025,.271,5);
  const antennaX=variant===1?-.37:.37;batch(structure,[.028,.38,.028],[[antennaX,.65,0]],dark);cylinder(detail,.041,.053,pearl,[antennaX,.86,0],12,[0,0,0]);
  plate(shell,.94,.07,.56,dark,[0,-.205,0],.055);
 }
 const type=String(node?.type||'').toLowerCase();let family;
 if(type==='gene'||type==='variant'){family='helix-instrument';helix();}
 else if(type==='disease'){family=variant===1?'annular-scanner':'precision-cartridge';family==='annular-scanner'?scanner():cartridge();}
 else if(type==='phenotype'||type==='mechanism'){family='optical-sensor';opticalSensor();}
 else if(type==='study'||type==='asset'||type==='researcher'){family='archive-console';archiveConsole();}
 else if(type==='community'||type==='investigator'||type==='organization'||type==='resource'){family='relay-instrument';relay();}
 else{family='annular-scanner';scanner();}
 // Every component remains in its supplied decomposition layer; no root offsets.
 let meshCount=0,instanceCount=0,triangles=0;const bounds=new THREE.Box3(),box=new THREE.Box3(),toLocal=new THREE.Matrix4();
 for(const parent of partRoots){parent.updateMatrixWorld(true);parent.traverse(object=>{if(object.isMesh){object.userData.layerId=parent.name||Object.keys(parts).find(k=>parts[k]===parent);object.userData.entityId=identity;object.userData.illustrative=true;meshCount++;const count=object.isInstancedMesh?object.count:1;instanceCount+=object.isInstancedMesh?count:0;triangles+=(object.geometry.index?.count||object.geometry.attributes.position.count)/3*count;}});toLocal.copy(parent.matrixWorld).invert();box.setFromObject(parent).applyMatrix4(toLocal);bounds.union(box);}
 return {geometryVariant:`${family}-${variant+1}-${(seed>>>8)%7+1}`,family,illustrative:true,meshCount,instanceCount,triangles:Math.round(triangles),bounds:{min:bounds.min.toArray(),max:bounds.max.toArray()},meaning:'Illustrative instrument geometry; not a medical device, molecular model, or measured biological structure.'};
}
