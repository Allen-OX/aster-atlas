import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// The sculptures, double helix, meridians, dust and light are abstract decoration.
// They are not molecular structures, measurements, or biological simulation.
// The only graph entities and relationships are those supplied by data.js.
const PEARL=0xe3dfea, VIOLET=0xa498c9, SELECT=0xdde996;
const TAU=Math.PI*2;
const HOME=new THREE.Vector3(0.4,1.4,14.5);
const LAYOUT=[[-2.25,.5,1.05],[2.65,.10,.20],[-3.40,-1.35,-.3],[3.35,2.05,-.75],[.50,3.20,-.75],[-1.05,-3.0,-.30],[2.05,-2.35,.7],[-2.75,2.50,-.6]];
const glowVertex=`attribute float aLight;varying float vLight;uniform float uTime;void main(){vec3 p=position;p.x+=sin(uTime*.16+p.y)*.025;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp((3.+aLight*16.)*11./max(2.,-mv.z),1.,18.);vLight=aLight;}`;
const glowFragment=`varying float vLight;uniform vec3 uColor;void main(){float d=length(gl_PointCoord-.5)*2.;if(d>1.)discard;float a=(exp(-d*d*5.5)*.68+exp(-d*d*24.)*.32)*(.09+vLight*.68);gl_FragColor=vec4(uColor*(1.+exp(-d*d*24.)*1.5),a);
#include <colorspace_fragment>
}`;

/** Owns its canvas renderer and stable label buttons. Selection callbacks use IDs. */
export function createAtlasScene({canvas,container,labels,nodes,edges,onSelect=()=>{},onEdge=()=>{},onReady=()=>{},onStatus=()=>{}}){
 if(!canvas||!container||!labels)throw new TypeError('Atlas scene requires canvas, container and label container.');
 const media=window.matchMedia('(prefers-reduced-motion: reduce)');
 let reducedMotion=media.matches,paused=false,exploded=false,disposed=false,hovered=null,selected=null,visibleIds=new Set(nodes.map(n=>n.id)),routeEdgeIds=new Set();
 let time=0,last=performance.now(),raf=0,focusGoal=null,down=null,animationRate=1;
 let inViewport=true,lastVisibleFrame=null,renderedFrames=0,contextAvailable=true,initializing=true,suspended=false;const frameIntervals=[];
 const owned=new Set(), nodeObjects=new Map(),edgeObjects=new Map(),labelButtons=new Map(),pickables=[];
 const resource=r=>{owned.add(r);return r;};
 const cleanup=[];let renderer=null,scene=null;
 const notify=(status,message,error)=>{try{onStatus({status,message,...(error?{error:String(error.message||error)}:{})});}catch(callbackError){console.warn('Atlas status callback failed.',callbackError);}};
 function dispose(){
  if(disposed)return;disposed=true;contextAvailable=false;cancelAnimationFrame(raf);
  for(const release of cleanup.reverse()){try{release();}catch(error){console.warn('Atlas cleanup failed.',error);}}
  labelButtons.forEach(button=>button.remove());
  for(const item of [...owned].reverse()){try{item.dispose();}catch(error){console.warn('Atlas resource cleanup failed.',error);}}
  scene?.clear();renderer?.dispose();
 }
 try{
 renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.6));renderer.setClearColor(0x08090d,0);
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
 scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x0b0c13,.026);
 const camera=new THREE.PerspectiveCamera(39,1,.1,70);camera.position.copy(HOME);
 const controls=new OrbitControls(camera,canvas);cleanup.push(()=>controls.dispose());controls.target.set(0,0,0);controls.enableDamping=!reducedMotion;controls.dampingFactor=.065;controls.minDistance=6;controls.maxDistance=27;controls.enablePan=true;controls.maxPolarAngle=Math.PI*.79;controls.minPolarAngle=Math.PI*.19;
 scene.add(new THREE.HemisphereLight(0xf7ecff,0x151321,2));
 const key=new THREE.DirectionalLight(0xfff7ea,4.2);key.position.set(-5,7,8);scene.add(key);
 const rim=new THREE.DirectionalLight(0x9783d6,3.2);rim.position.set(6,2,-5);scene.add(rim);
 const fill=new THREE.PointLight(0xece4ff,32,20,2);fill.position.set(0,2,3);scene.add(fill);

 // Rebuild GPU-only reflections after restoration; temporary cards are exception-safe.
 let envTarget=null;
 cleanup.push(()=>envTarget?.dispose());
 function rebuildEnvironment(){
  const studio=new THREE.Scene();studio.background=new THREE.Color(0x343543);
  const temporary=[];let pmrem=null,replacement=null;
  try{
   for(const [p,s,c] of [[[0,5,0],[10,.1,7],0xe9e7ed],[[-5,0,1],[.1,8,6],0x77728d],[[4,2,-3],[.1,6,7],0xc3bdd4]]){
    const geo=new THREE.BoxGeometry(...s);temporary.push(geo);
    const mat=new THREE.MeshBasicMaterial({color:c});temporary.push(mat);
    const card=new THREE.Mesh(geo,mat);card.position.set(...p);studio.add(card);
   }
   pmrem=new THREE.PMREMGenerator(renderer);replacement=pmrem.fromScene(studio,.07);
   const previous=envTarget;envTarget=replacement;scene.environment=envTarget.texture;scene.environmentIntensity=.70;previous?.dispose();
  }finally{temporary.forEach(item=>item.dispose());pmrem?.dispose();studio.clear();}
 }
 const onContextLost=event=>{
  event.preventDefault();contextAvailable=false;controls.enabled=false;lastVisibleFrame=null;last=performance.now();hovered=null;down=null;
  notify('context-lost','The 3D view was interrupted. Entity and source navigation remain available.');
 };
 const onContextRestored=()=>{
  if(disposed)return;contextAvailable=false;notify('restoring','Restoring the 3D view and lighting…');
  try{
   rebuildEnvironment();if(!suspended)renderer.render(scene,camera);
   if(renderer.getContext().isContextLost())throw new Error('The graphics context is still unavailable.');
   if(!suspended)renderedFrames++;contextAvailable=true;controls.enabled=true;lastVisibleFrame=null;last=performance.now();
   notify('ready','The spatial atlas is ready.');
  }catch(error){contextAvailable=false;notify('error','The 3D view could not be restored. Continue with the entity index.',error);}
 };
 canvas.addEventListener('webglcontextlost',onContextLost);cleanup.push(()=>canvas.removeEventListener('webglcontextlost',onContextLost));
 canvas.addEventListener('webglcontextrestored',onContextRestored);cleanup.push(()=>canvas.removeEventListener('webglcontextrestored',onContextRestored));
 rebuildEnvironment();
 const platinum=resource(new THREE.MeshStandardMaterial({color:0x9f9dac,metalness:.94,roughness:.19}));
 const dark=resource(new THREE.MeshStandardMaterial({color:0x11131d,metalness:.94,roughness:.22}));
 const pearl=resource(new THREE.MeshStandardMaterial({color:0xc7c1d2,metalness:.70,roughness:.20,emissive:0x1e172b,emissiveIntensity:.25}));
 const softLight=resource(new THREE.MeshBasicMaterial({color:0xe8e3f4,transparent:true,opacity:.75,toneMapped:false}));
 const violetLight=resource(new THREE.MeshBasicMaterial({color:VIOLET,transparent:true,opacity:.48,toneMapped:false}));
 function mesh(parent,geometry,material,p=[0,0,0],rotation=null){const o=new THREE.Mesh(resource(geometry),material);o.position.set(...p);if(rotation)o.rotation.set(...rotation);parent.add(o);return o;}
 function path(parent,points,r,material){return mesh(parent,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),Math.max(48,points.length),r,6,false),material);}
 function circlePoints(radius,count=128){return Array.from({length:count+1},(_,i)=>new THREE.Vector3(Math.cos(i/count*TAU)*radius,Math.sin(i/count*TAU)*radius,0));}
 function line(parent,points,color=VIOLET,opacity=.15){const geo=resource(new THREE.BufferGeometry().setFromPoints(points)),mat=resource(new THREE.LineBasicMaterial({color,transparent:true,opacity,depthWrite:false}));const o=new THREE.Line(geo,mat);parent.add(o);return o;}
 const decorative=new THREE.Group();decorative.name='Abstract discovery sculpture — decorative';decorative.userData.decorative=true;scene.add(decorative);
 const helix=new THREE.Group();helix.name='Abstract double helix — not a molecular model';decorative.add(helix);
 const helixPoints=[];
 for(let strand=0;strand<2;strand++){
  const points=Array.from({length:180},(_,i)=>{const q=i/179,a=q*TAU*1.55+strand*Math.PI;return new THREE.Vector3(Math.cos(a)*.70,(q-.5)*4.85,Math.sin(a)*.70);});
  path(helix,points,.075,strand?platinum:pearl);path(helix,points.map(p=>new THREE.Vector3(p.x*1.16,p.y,p.z*1.16)),.016,strand?violetLight:softLight);helixPoints.push(...points);
 }
 // Fine dark collars segment the rails into a fabricated, precise surface.
 const collarGeometry=resource(new THREE.TorusGeometry(.084,.016,5,14));
 const collars=resource(new THREE.InstancedMesh(collarGeometry,dark,72));
 const collarPose=new THREE.Object3D();
 for(let i=0;i<72;i++){const strand=i%2,q=(Math.floor(i/2)+.5)/36,a=q*TAU*1.55+strand*Math.PI;collarPose.position.set(Math.cos(a)*.70,(q-.5)*4.85,Math.sin(a)*.70);const tangent=new THREE.Vector3(-Math.sin(a)*.70*TAU*1.55,4.85,Math.cos(a)*.70*TAU*1.55).normalize();collarPose.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),tangent);collarPose.updateMatrix();collars.setMatrixAt(i,collarPose.matrix);}helix.add(collars);
 const rungGeometry=resource(new THREE.CylinderGeometry(.018,.018,1,8));
 const rungs=resource(new THREE.InstancedMesh(rungGeometry,platinum,22));const dummy=new THREE.Object3D();
 for(let i=0;i<22;i++){const q=(i+.5)/22,a=q*TAU*1.55;const start=new THREE.Vector3(Math.cos(a)*.67,(q-.5)*4.85,Math.sin(a)*.67),end=start.clone().set(-start.x,start.y,-start.z);dummy.position.copy(start).add(end).multiplyScalar(.5);dummy.scale.set(1,start.distanceTo(end),1);dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),end.sub(start).normalize());dummy.updateMatrix();rungs.setMatrixAt(i,dummy.matrix);}helix.add(rungs);
 // Graph-independent metallic vanes and fine latitude filigree frame the helix.
 const shardGeometry=resource(new THREE.OctahedronGeometry(.085,0));
 const shards=resource(new THREE.InstancedMesh(shardGeometry,platinum,44));
 for(let i=0;i<44;i++){const q=(i+.5)/44,a=q*TAU*1.55;dummy.position.set(Math.cos(a)*.82,(q-.5)*4.85,Math.sin(a)*.82);dummy.scale.set(.36,1.8,.75);dummy.rotation.set(.15,a,.28);dummy.updateMatrix();shards.setMatrixAt(i,dummy.matrix);}helix.add(shards);
 for(const y of [-2.56,2.56]){const cap=mesh(helix,new THREE.TorusGeometry(.43,.015,5,64),platinum,[0,y,0],[Math.PI/2,0,0]);const fine=mesh(helix,new THREE.TorusGeometry(.56,.006,4,64),softLight,[0,y,0],[Math.PI/2,0,0]);}

 const meridians=[];
 for(let i=0;i<4;i++){
  const ring=line(decorative,circlePoints(2.72+i*.16),i%2?0xaba0c4:0xd0cadb,i===0?.16:.075);
  ring.rotation.set(.27+i*.55,i*.48,.21+i*.32);meridians.push(ring);
 }
 const equator=line(decorative,circlePoints(3.62),0x8f859f,.09);equator.rotation.x=Math.PI/2.55;
 const reticle=[];
 for(let i=0;i<90;i++){const a=i/90*TAU,r=3.50;reticle.push(new THREE.Vector3(Math.cos(a)*r,Math.sin(a)*r,0),new THREE.Vector3(Math.cos(a)*(r+(i%5?0.025:.075)),Math.sin(a)*(r+(i%5?0.025:.075)),0));}
 const reticleObject=new THREE.LineSegments(resource(new THREE.BufferGeometry().setFromPoints(reticle)),resource(new THREE.LineBasicMaterial({color:0xaaa0b8,transparent:true,opacity:.12})));reticleObject.rotation.set(.34,.18,.06);decorative.add(reticleObject);
 const dustPositions=[],lightValues=[];
 let seed=6271;const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<900;i++){const a=random()*TAU,r=1.0+random()*4.8;dustPositions.push(Math.cos(a)*r,(random()-.5)*8,Math.sin(a)*r-1.2);lightValues.push(random()*.32);}
 const dustGeometry=resource(new THREE.BufferGeometry());dustGeometry.setAttribute('position',new THREE.Float32BufferAttribute(dustPositions,3));dustGeometry.setAttribute('aLight',new THREE.Float32BufferAttribute(lightValues,1));
 const dustMaterial=resource(new THREE.ShaderMaterial({vertexShader:glowVertex,fragmentShader:glowFragment,uniforms:{uTime:{value:0},uColor:{value:new THREE.Color(0xe4d8ff)}},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));
 const dust=new THREE.Points(dustGeometry,dustMaterial);decorative.add(dust);
 const helixGlowGeometry=resource(new THREE.BufferGeometry());
 helixGlowGeometry.setAttribute('position',new THREE.Float32BufferAttribute(helixPoints.flatMap(p=>[p.x*1.16,p.y,p.z*1.16]),3));
 helixGlowGeometry.setAttribute('aLight',new THREE.Float32BufferAttribute(helixPoints.map(()=>.52+random()*.48),1));
 const helixGlow=new THREE.Points(helixGlowGeometry,dustMaterial);helix.add(helixGlow);

 function nodeSculpture(node,index){
  const group=new THREE.Group();group.name=node.label;group.position.set(...(LAYOUT[index]||[node.x*4,node.y*4,node.z*3]));scene.add(group);
  const body=new THREE.Group();group.add(body);
  const accent=resource(new THREE.MeshStandardMaterial({color:PEARL,metalness:.6,roughness:.20,emissive:0x221b2c,emissiveIntensity:.35}));
  const parts=[];
  const part=(object,offset)=>{parts.push({object,base:object.position.clone(),rotation:object.rotation.clone(),offset:new THREE.Vector3(...offset)});return object;};
  if(node.type==='disease'){
   mesh(body,new THREE.IcosahedronGeometry(.36,1),dark);
   mesh(body,new THREE.OctahedronGeometry(.20,0),accent);
   const collar=mesh(body,new THREE.TorusGeometry(.43,.022,6,48),platinum,[0,0,0],[Math.PI/2,.18,0]);part(collar,[0,.12,0]);
   for(let i=0;i<3;i++){const shield=mesh(body,new THREE.SphereGeometry(.51,20,14,i*TAU/3+.08,TAU/3-.26,.24,Math.PI-.48),i%2?platinum:pearl);part(shield,[Math.cos(i*TAU/3)*.25,0,Math.sin(i*TAU/3)*.25]);}
  }else if(node.type==='gene'){
   mesh(body,new THREE.OctahedronGeometry(.31,0),dark);
   mesh(body,new THREE.OctahedronGeometry(.21,0),accent,[0,0,.13]);
   for(let i=0;i<2;i++){const ring=mesh(body,new THREE.TorusGeometry(.45,.075,8,36),i?platinum:pearl,[0,0,0],[Math.PI/2,i*.9+.35,.35]);part(ring,[i?.19:-.19,i?.13:-.13,0]);}
  }else if(node.type==='phenotype'){
   mesh(body,new THREE.IcosahedronGeometry(.28,1),dark);
   mesh(body,new THREE.TorusGeometry(.30,.018,5,36),accent,[0,0,0],[.25,.25,.25]);
   for(let i=0;i<3;i++){const ring=mesh(body,new THREE.TorusGeometry(.41,.045,8,36),i%2?platinum:pearl,[0,0,0],[i*1.047,.52,i*.32]);part(ring,[0,(i-1)*.21,0]);}
  }else if(node.type==='study'){
   for(let i=0;i<4;i++){const plate=mesh(body,new THREE.CylinderGeometry(.43,.43,.10,6),i===3?accent:platinum,[0,(i-1.5)*.17,0],[.16,i*.13,.10]);part(plate,[0,(i-1.5)*.15,0]);}
  }else{
   mesh(body,new THREE.IcosahedronGeometry(.25,1),accent);
   for(let i=0;i<6;i++){const a=i/6*TAU;const bead=mesh(body,new THREE.SphereGeometry(.115,12,10),pearl,[Math.cos(a)*.42,Math.sin(a)*.42,0]);part(bead,[Math.cos(a)*.18,Math.sin(a)*.18,0]);}
  }
  // Small metal indexing teeth are abstract interface decoration.
  const toothGeometry=resource(new THREE.BoxGeometry(.018,.044,.035));
  const teeth=resource(new THREE.InstancedMesh(toothGeometry,platinum,20));
  const toothPose=new THREE.Object3D();
  for(let i=0;i<20;i++){const a=i/20*TAU;toothPose.position.set(Math.cos(a)*.61,Math.sin(a)*.61,0);toothPose.rotation.z=a-Math.PI/2;toothPose.updateMatrix();teeth.setMatrixAt(i,toothPose.matrix);}group.add(teeth);
  const selectionRing=mesh(group,new THREE.TorusGeometry(.64,.011,5,64),resource(new THREE.MeshBasicMaterial({color:SELECT,transparent:true,opacity:.80,toneMapped:false})));selectionRing.visible=false;
  const backing=mesh(group,new THREE.TorusGeometry(.62,.008,4,64),resource(new THREE.MeshBasicMaterial({color:0xc6bdde,transparent:true,opacity:.18})));backing.rotation.x=.4;
  // Covers the largest fully unfolded animated envelope (disease shell <1.02).
  const hit=mesh(group,new THREE.SphereGeometry(1.15,12,8),resource(new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,colorWrite:false})));hit.userData.nodeId=node.id;pickables.push(hit);
  body.traverse(o=>{if(o.isMesh)o.userData.nodeId=node.id;});
  const button=document.createElement('button');button.type='button';button.className='atlas-node-label';button.dataset.nodeId=node.id;button.setAttribute('aria-label',`Explore ${node.label}, ${node.type}`);button.setAttribute('aria-pressed','false');
  const title=document.createElement('span');title.className='atlas-node-label-name';title.textContent=node.short||node.label;
  const kind=document.createElement('small');kind.className='atlas-node-label-type';kind.textContent=node.type;button.append(title,kind);
  Object.assign(button.style,{position:'absolute',transform:'translate(-50%,0)',pointerEvents:'auto'});
  button.addEventListener('click',()=>onSelect(node.id));button.addEventListener('focus',()=>{hovered=node.id;});button.addEventListener('blur',()=>{if(hovered===node.id)hovered=null;});
  labels.append(button);labelButtons.set(node.id,button);
  const sourceCount=node.sourceIds?.length||0,connectionCount=edges.filter(edge=>edge.from===node.id||edge.to===node.id).length;
  nodeObjects.set(node.id,{node,group,body,accent,parts,selectionRing,backing,hit,teeth,amount:0,index,sourceCount,connectionCount,cycleRate:1+connectionCount*.13,amplitude:.055+Math.min(sourceCount,3)*.015,pulse:0});
 }
 nodes.forEach(nodeSculpture);
 const tracerGeometry=resource(new THREE.SphereGeometry(.045,8,6));
 for(const [index,edge] of edges.entries()){
  const from=nodeObjects.get(edge.from),to=nodeObjects.get(edge.to);if(!from||!to)continue;
  const start=from.group.position.clone(),end=to.group.position.clone(),mid=start.clone().add(end).multiplyScalar(.5);
  mid.z+=.45+(index%3)*.25;mid.y+=index%2?.27:-.27;
  const edgeCurve=new THREE.QuadraticBezierCurve3(start,mid,end);
  const group=new THREE.Group();group.name=`${edge.id}: ${edge.relation}`;scene.add(group);
  const inferred=edge.strength==='cross-source inference';
  const mat=resource(new THREE.MeshBasicMaterial({color:0xb2a6c9,transparent:true,opacity:.38,depthWrite:false,toneMapped:false}));
  if(inferred){
   // Segmented physical geometry preserves inference distinction under highlight.
   for(let segment=0;segment<16;segment++){
    const a=segment/16,b=Math.min(1,a+.035),samples=Array.from({length:5},(_,i)=>edgeCurve.getPoint(THREE.MathUtils.lerp(a,b,i/4)));
    path(group,samples,.015,mat);
   }
  }else mesh(group,new THREE.TubeGeometry(edgeCurve,64,.012,5,false),mat);
  const pickMat=resource(new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,colorWrite:false}));
  const hit=mesh(group,new THREE.TubeGeometry(edgeCurve,40,.075,4,false),pickMat);hit.userData.edgeId=edge.id;pickables.push(hit);
  const tracerMaterial=resource(new THREE.MeshBasicMaterial({color:0xdfd8f0,transparent:true,opacity:.85,toneMapped:false,depthWrite:false}));
  const tracers=resource(new THREE.InstancedMesh(tracerGeometry,tracerMaterial,3));tracers.instanceMatrix.setUsage(THREE.DynamicDrawUsage);tracers.frustumCulled=false;group.add(tracers);
  edgeObjects.set(edge.id,{edge,group,material:mat,curve:edgeCurve,inferred,tracers,tracerMaterial,index,baseOpacity:.30,pulse:0,progress:[],flowRate:.065+Math.min(edge.sourceIds?.length||0,3)*.014+(index%3)*.004});
 }

 const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
 function pick(event){if(suspended||!contextAvailable||disposed)return undefined;const r=canvas.getBoundingClientRect();pointer.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);return raycaster.intersectObjects(pickables,false).find(hit=>{for(let object=hit.object;object;object=object.parent)if(!object.visible)return false;return true;});}
 const pointerDown=event=>{if(event.button===0)down={x:event.clientX,y:event.clientY};};
 const pointerMove=event=>{const hit=pick(event);hovered=hit?.object.userData.nodeId??null;canvas.style.cursor=hit?'pointer':'grab';};
 const pointerUp=event=>{if(!down)return;const moved=Math.hypot(event.clientX-down.x,event.clientY-down.y);down=null;if(moved>5)return;const hit=pick(event);if(hit?.object.userData.nodeId)onSelect(hit.object.userData.nodeId);else if(hit?.object.userData.edgeId)onEdge(hit.object.userData.edgeId);};
 const pointerLeave=()=>{hovered=null;down=null;};
 function focusNode(id){const n=nodeObjects.get(id);if(!n)return;const target=n.group.position.clone();focusGoal={target,position:target.clone().add(new THREE.Vector3(.9,.5,7.3))};}
 const doubleClick=event=>{const hit=pick(event);if(hit?.object.userData.nodeId)focusNode(hit.object.userData.nodeId);};
 for(const [type,handler] of [['pointerdown',pointerDown],['pointermove',pointerMove],['pointerup',pointerUp],['pointerleave',pointerLeave],['dblclick',doubleClick]]){canvas.addEventListener(type,handler);cleanup.push(()=>canvas.removeEventListener(type,handler));}
 canvas.style.touchAction='none';
 const onMotion=event=>{reducedMotion=event.matches;controls.enableDamping=!reducedMotion;};media.addEventListener?.('change',onMotion);cleanup.push(()=>media.removeEventListener?.('change',onMotion));
 const resize=()=>{const rect=container.getBoundingClientRect(),w=Math.max(1,rect.width),h=Math.max(1,rect.height);renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=camera.aspect<.8?56:39;camera.updateProjectionMatrix();};
 const observer=new ResizeObserver(resize);cleanup.push(()=>observer.disconnect());observer.observe(container);resize();
 const visibilityObserver=new IntersectionObserver(entries=>{inViewport=entries[0]?.isIntersecting??true;lastVisibleFrame=null;last=performance.now();},{threshold:0});cleanup.push(()=>visibilityObserver.disconnect());visibilityObserver.observe(container);
 const onVisibility=()=>{lastVisibleFrame=null;last=performance.now();};document.addEventListener('visibilitychange',onVisibility);cleanup.push(()=>document.removeEventListener('visibilitychange',onVisibility));
 function setState(next={}){
  if(Object.hasOwn(next,'selected'))selected=typeof next.selected==='object'?next.selected?.id:next.selected;
  if(Object.hasOwn(next,'visibleIds'))visibleIds=new Set(next.visibleIds??nodes.map(n=>n.id));
  if(Object.hasOwn(next,'routeEdgeIds'))routeEdgeIds=new Set(next.routeEdgeIds??[]);
  for(const [id,n] of nodeObjects){n.group.visible=visibleIds.has(id);n.selectionRing.visible=id===selected;n.accent.color.setHex(id===selected?SELECT:PEARL);n.accent.emissive.setHex(id===selected?0x475126:0x221b2c);const b=labelButtons.get(id);b.hidden=!n.group.visible;b.classList.toggle('selected',id===selected);b.setAttribute('aria-pressed',String(id===selected));}
  for(const [id,e] of edgeObjects){e.group.visible=visibleIds.has(e.edge.from)&&visibleIds.has(e.edge.to);const active=routeEdgeIds.has(id),adjacent=e.edge.from===selected||e.edge.to===selected;e.material.color.setHex(active?SELECT:adjacent?0xd4c9e9:0xa497bd);e.tracerMaterial.color.setHex(active?SELECT:0xdfd8f0);e.baseOpacity=active?.92:adjacent?.64:.30;e.material.opacity=e.baseOpacity;}
 }
 function reset(){focusGoal={position:HOME.clone(),target:new THREE.Vector3()};}
 function zoom(factor){if(!Number.isFinite(factor)||factor<=0)return;camera.position.sub(controls.target).multiplyScalar(factor).clampLength(controls.minDistance,controls.maxDistance).add(controls.target);focusGoal=null;controls.update();}
 function setPaused(value){paused=Boolean(value);if(!paused&&reducedMotion){reducedMotion=false;controls.enableDamping=true;}return paused;}
 function setAnimationRate(value){if(Number.isFinite(value))animationRate=THREE.MathUtils.clamp(value,.25,2);return animationRate;}
 function setSuspended(value){suspended=Boolean(value);lastVisibleFrame=null;last=performance.now();return suspended;}
 function setExploded(value){exploded=Boolean(value);if(paused||reducedMotion)for(const [id,n] of nodeObjects)n.amount=exploded||hovered===id?1:0;return exploded;}
 function getStats(){
  const sorted=[...frameIntervals].sort((a,b)=>a-b),medianMs=sorted.length?sorted[Math.floor(sorted.length*.5)]:null,p95Ms=sorted.length?sorted[Math.min(sorted.length-1,Math.floor(sorted.length*.95))]:null;
  return {contextAvailable,suspended,simulationTime:time,animationRate,frameSamples:sorted.length,medianMs,p95Ms,maxMs:sorted.at(-1)??null,visibleStallsOver1s:sorted.filter(value=>value>=1000).length,renderedFrames,visible:inViewport&&!document.hidden&&!suspended,nodeCount:nodes.length,edgeCount:edgeObjects.size,visibleNodeCount:[...nodeObjects.values()].filter(n=>n.group.visible).length,visibleEdgeCount:[...edgeObjects.values()].filter(e=>e.group.visible).length,drawCalls:contextAvailable&&!suspended?renderer.info.render.calls:0,points:contextAvailable&&!suspended?renderer.info.render.points:0,triangles:contextAvailable&&!suspended?renderer.info.render.triangles:0,paused,reducedMotion,
   nodeAnimations:[...nodeObjects.values()].map(n=>({id:n.node.id,type:n.node.type,visible:n.group.visible,sourceCount:n.sourceCount,connectionCount:n.connectionCount,cycleRate:n.cycleRate,amplitude:n.amplitude,pulse:n.pulse,scale:n.body.scale.x,rotation:[n.body.rotation.x,n.body.rotation.y,n.body.rotation.z],partPositions:n.parts.map(part=>part.object.position.toArray())})),
   edgeAnimations:[...edgeObjects.values()].map(e=>({id:e.edge.id,visible:e.group.visible,strength:e.edge.strength,sourceCount:e.edge.sourceIds?.length||0,inferred:e.inferred,flowRate:e.flowRate,pulse:e.pulse,tracerProgress:[...e.progress]})),
   decorative:'Designed motion encodes entity category and source/connection counts. Not live clinical data, biological simulation, confidence, or treatment effect.'};
 }
 function render(now){
  if(disposed)return;raf=requestAnimationFrame(render);const dt=Math.min((now-last)/1000,.05);last=now;
  if(suspended||!contextAvailable||!inViewport||document.hidden){lastVisibleFrame=null;return;}
  try{
  const interval=lastVisibleFrame===null?null:now-lastVisibleFrame;
  if(!paused&&!reducedMotion)time+=dt*animationRate;
  helix.rotation.y=Math.sin(time*.10)*.15;helix.rotation.z=-.12;
  meridians.forEach((ring,i)=>{ring.rotation.z=.21+i*.32+time*.008*(i%2?1:-1);});
  dustMaterial.uniforms.uTime.value=time;
  for(const [id,n] of nodeObjects){
   const target=exploded||hovered===id?1:0;if(reducedMotion)n.amount=target;else if(!paused)n.amount=THREE.MathUtils.lerp(n.amount,target,1-Math.exp(-dt*7));
   const phase=time*n.cycleRate+n.index*.83;n.pulse=.5+.5*Math.sin(phase);
   n.body.rotation.set(.07*Math.sin(phase*.6),.17*Math.sin(phase*.45),.055*Math.cos(phase*.7));
   n.body.scale.setScalar(1+n.amplitude*Math.sin(phase));
   if(n.node.type==='gene')n.body.rotation.y=(time*.30+n.index*.4)%TAU;
   if(n.node.type==='phenotype')n.body.rotation.y=(time*.23+n.index*.3)%TAU;
   if(n.node.type==='community')n.body.rotation.z=.09*Math.sin(phase*.5);
   n.parts.forEach((p,j)=>{
    p.object.position.copy(p.base).addScaledVector(p.offset,n.amount);p.object.rotation.copy(p.rotation);
    if(n.node.type==='disease')p.object.position.addScaledVector(p.offset,.36+.26*Math.sin(phase+j*.8));
    else if(n.node.type==='gene'){p.object.rotation.y+=(time*(j?-.45:.45))%TAU;p.object.position.y+=Math.sin(phase+j*Math.PI)*.055;}
    else if(n.node.type==='phenotype'){p.object.rotation.z+=(time*(.24+j*.08))%TAU;p.object.position.y+=Math.sin(phase+j*1.2)*.055;}
    else if(n.node.type==='study'){p.object.position.y+=Math.sin(phase-j*.75)*.065;p.object.rotation.y+=Math.sin(phase*.7-j*.5)*.24;}
    else{const angle=time*.28,c=Math.cos(angle),s=Math.sin(angle);p.object.position.x=p.base.x*c-p.base.y*s+p.offset.x*n.amount;p.object.position.y=p.base.x*s+p.base.y*c+p.offset.y*n.amount;p.object.position.z+=Math.sin(phase+j)*.065;}
   });
   n.accent.emissiveIntensity=.27+n.pulse*.19;n.selectionRing.rotation.z=time*.12;
  }
  for(const e of edgeObjects.values()){
   e.pulse=.5+.5*Math.sin(time*1.25+e.index*.7);e.material.opacity=e.baseOpacity*(.78+.22*e.pulse);e.tracerMaterial.opacity=.60+.30*e.pulse;
   e.progress=[];
   for(let j=0;j<3;j++){
    const progress=(time*e.flowRate+j/3+e.index*.041)%1;e.progress.push(progress);e.curve.getPoint(progress,dummy.position);dummy.rotation.set(0,0,0);
    // Inference tracers disappear in the same gaps as the dashed source relation.
    dummy.scale.setScalar(e.inferred&&(progress*16)%1>.56?0:.84+.28*Math.sin(time*1.6+j));dummy.updateMatrix();e.tracers.setMatrixAt(j,dummy.matrix);
   }
   e.tracers.instanceMatrix.needsUpdate=true;
  }
  if(focusGoal){const a=reducedMotion?1:1-Math.exp(-dt*5);camera.position.lerp(focusGoal.position,a);controls.target.lerp(focusGoal.target,a);if(camera.position.distanceTo(focusGoal.position)<.015){camera.position.copy(focusGoal.position);controls.target.copy(focusGoal.target);focusGoal=null;}}
  controls.update();scene.updateMatrixWorld();
  const r=container.getBoundingClientRect();
  for(const [id,n] of nodeObjects){const b=labelButtons.get(id),p=n.group.position.clone().add(new THREE.Vector3(0,-.78,0)).project(camera);b.hidden=!n.group.visible||p.z>1||p.z< -1||Math.abs(p.x)>1.1||Math.abs(p.y)>1.1;b.style.left=`${(p.x*.5+.5)*r.width}px`;b.style.top=`${(-p.y*.5+.5)*r.height}px`;b.classList.toggle('hovered',hovered===id);}
  renderer.render(scene,camera);
  if(renderer.getContext().isContextLost()){contextAvailable=false;lastVisibleFrame=null;return;}
  renderedFrames++;
  if(interval!==null&&interval>0){frameIntervals.push(interval);if(frameIntervals.length>180)frameIntervals.shift();}
  lastVisibleFrame=now;
  }catch(error){if(initializing)throw error;dispose();notify('error','The 3D view stopped. Continue with the entity index.',error);}
 }
 setState({selected:nodes[0]?.id});render(performance.now());initializing=false;queueMicrotask(()=>{if(!disposed&&contextAvailable){notify('ready','The spatial atlas is ready.');onReady(getStats());}});
 return {setState,reset,zoom,setPaused,setSuspended,setExploded,setAnimationRate,dispose,getStats};
 }catch(error){dispose();throw error;}
}
