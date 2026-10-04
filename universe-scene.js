import * as THREE from './vendor/three/three.module.js';
import {buildDetailedObject} from './universe-object-models.js';
import {OrbitControls} from './vendor/three/addons/controls/OrbitControls.js';
import {stepSpring,frameSummary,pointerSpeed,dampingForSpeed} from './hologram-math.js';

// Generic supplied graph only. Sculptures and tracer animation are illustrative
// raster graphics, not physical simulations, live records, or traced illumination.
const TAU=Math.PI*2,PARTS=['shell','structure','core','detail'],MAX_NODES=64,MAX_EDGES=192,MAX_LAYERS=4,TRACERS_PER_LAYER=2,SAMPLES=40,DASHES=14;
const LIME=0xd5e8a3,IVORY=0xe6e2d8;
const hash=id=>{let h=2166136261;for(const c of String(id)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
const validVector=a=>Array.isArray(a)&&a.length===3&&a.every(Number.isFinite);
const boundedPosition=a=>[THREE.MathUtils.clamp(a[0],-18,18),THREE.MathUtils.clamp(a[1],-5,12),THREE.MathUtils.clamp(a[2],-18,18)];

/** Independent renderer and supplied graph; all callbacks use the supplied IDs.
 * setLayers controls 1–4 parallel pipeline strata. layerIds filters sculpture
 * parts: shell, structure, core, detail. getView/setView are plain local state.
 */
export function createUniverseScene({canvas,container,nodes,edges,onSelect=()=>{},onEdge=()=>{},onReady=()=>{},onMove=()=>{},labels,reducedMotion,fixedRotation=false}={}){
 if(!canvas||!container||!Array.isArray(nodes)||!Array.isArray(edges))throw new TypeError('A canvas, container, node array and edge array are required.');
 if(nodes.length>MAX_NODES||edges.length>MAX_EDGES)throw new RangeError(`This bounded scene supports at most ${MAX_NODES} nodes and ${MAX_EDGES} edges.`);
 const ids=new Set();for(const n of nodes){if(typeof n.id!=='string'||!n.id||ids.has(n.id))throw new TypeError('Nodes require unique string IDs.');ids.add(n.id);}
 const edgeIds=new Set();for(const e of edges){if(!ids.has(e.from)||!ids.has(e.to)||typeof e.id!=='string'||edgeIds.has(e.id))throw new TypeError('Edges require unique IDs and existing endpoints.');edgeIds.add(e.id);}
 const owned=new Set(),instances=[],listeners=[],observers=[],objects=new Map(),connections=new Map(),adjacency=new Map(nodes.map(n=>[n.id,new Set()])),buttons=new Map(),pickables=[],tracerLookup=[],frameIntervals=[];
 let renderer,scene,camera,controls,labelRoot,status,envTarget,raf=0,disposed=false,contextLost=false,inViewport=true,visibilityOverride=null;
 let time=0,flowTime=0,last=performance.now(),lastVisible=null,renderedFrames=0,paused=false,flowPaused=false,direction=1,layerCount=3,dragMode=false,drag=null,down=null,hovered=null,focusedId=null,inside=false,cameraGoal=null;
 let visibleTracers=0,priorPointer=null,pointerVelocity=0;
 let isolatedNodeId=null,objectExplosions={};
 let selected=null,visibleIds=new Set(ids),visibleEdgeIds=new Set(edgeIds),partIds=new Set(PARTS),traceDirty=true,layoutDirty=true;
 const media=window.matchMedia('(prefers-reduced-motion: reduce)');let reduce=typeof reducedMotion==='boolean'?reducedMotion:media.matches;
 const own=r=>(owned.add(r),r);
 const listen=(target,type,fn)=>{target.addEventListener(type,fn);listeners.push(()=>target.removeEventListener(type,fn));};
 const sceneCenter=new THREE.Vector3(),homePosition=new THREE.Vector3(8.8,7.4,12),homeTarget=new THREE.Vector3(0,1,0);
 function dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(raf);observers.forEach(o=>o.disconnect());listeners.forEach(fn=>fn());controls?.dispose();instances.forEach(o=>o.dispose());owned.forEach(r=>r.dispose());envTarget?.dispose();renderer?.dispose();labelRoot?.remove();status?.remove();scene?.clear();}
 try{
  renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});renderer.setClearColor(0x090b0d,0);renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.4));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x0b0d10,.019);camera=new THREE.PerspectiveCamera(43,1,.1,100);camera.position.copy(homePosition);
  controls=new OrbitControls(camera,canvas);controls.target.copy(homeTarget);controls.enableDamping=!reduce;controls.dampingFactor=.07;controls.minDistance=2.4;controls.maxDistance=44;controls.maxPolarAngle=Math.PI*.86;controls.minPolarAngle=.12;
  scene.add(new THREE.HemisphereLight(0xf4f0e8,0x191d21,1.7));const key=new THREE.DirectionalLight(0xfff6e8,3.2);key.position.set(-7,12,8);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-15,right:15,top:15,bottom:-15,near:.5,far:42});key.shadow.bias=-.0002;key.shadow.normalBias=.025;scene.add(key);const rim=new THREE.DirectionalLight(0xd6dfe8,2.5);rim.position.set(8,4,-9);scene.add(rim);
  function rebuildEnvironment(){const studio=new THREE.Scene();studio.background=new THREE.Color(0x424446);const cards=[];let pmrem,next;
   for(const [p,s,c] of [[[0,5,0],[12,.1,10],0xe8e8e8],[[-5,0,0],[.1,9,9],0x9d9d9d],[[5,2,-3],[.1,7,8],0xbdbdbd]]){const g=new THREE.BoxGeometry(...s),m=new THREE.MeshBasicMaterial({color:c}),o=new THREE.Mesh(g,m);o.position.set(...p);studio.add(o);cards.push(o);}
   try{pmrem=new THREE.PMREMGenerator(renderer);next=pmrem.fromScene(studio,.06);}finally{pmrem?.dispose();cards.forEach(o=>{o.geometry.dispose();o.material.dispose();});}
   envTarget?.dispose();envTarget=next;scene.environment=next.texture;scene.environmentIntensity=.6;
  }
  rebuildEnvironment();
  // Procedural microfinish is local and deterministic; no external image/model service.
  const finishBytes=new Uint8Array(128*128*4);for(let y=0;y<128;y++)for(let x=0;x<128;x++){const i=(y*128+x)*4,v=Math.round(184+30*Math.sin(y*2.9)+12*Math.sin(x*37.3+y*19.7));finishBytes.set([v,v,v,255],i);}
  const finish=own(new THREE.DataTexture(finishBytes,128,128,THREE.RGBAFormat));finish.wrapS=finish.wrapT=THREE.RepeatWrapping;finish.repeat.set(4,4);finish.needsUpdate=true;
  const metal=own(new THREE.MeshPhysicalMaterial({color:0x9ba5ad,metalness:1,roughness:.32,roughnessMap:finish,bumpMap:finish,bumpScale:.007,clearcoat:.3,clearcoatRoughness:.22}));
  const dark=own(new THREE.MeshPhysicalMaterial({color:0x121c26,metalness:.62,roughness:.36,roughnessMap:finish,clearcoat:.65,clearcoatRoughness:.23}));
  const pearl=own(new THREE.MeshPhysicalMaterial({color:IVORY,metalness:.08,roughness:.24,clearcoat:.85,clearcoatRoughness:.14}));
  const glow=own(new THREE.MeshBasicMaterial({color:0xe2e6d8,toneMapped:false}));
  const floor=new THREE.Mesh(own(new THREE.CircleGeometry(22,96)),own(new THREE.MeshStandardMaterial({color:0x0d1115,metalness:.6,roughness:.53})));floor.rotation.x=-Math.PI/2;floor.position.y=-1.15;floor.receiveShadow=true;scene.add(floor);
  const grid=new THREE.GridHelper(40,40,0x283039,0x1b2127);grid.position.y=-1.13;grid.material.transparent=true;grid.material.opacity=.27;own(grid.geometry);own(grid.material);scene.add(grid);
  function mesh(parent,geometry,material,p=[0,0,0],r){const o=new THREE.Mesh(own(geometry),material);o.position.set(...p);if(r)o.rotation.set(...r);parent.add(o);return o;}
  const boxCache=new Map();
  function boxes(parent,size,positions,material){const k=size.join(',');if(!boxCache.has(k))boxCache.set(k,own(new THREE.BoxGeometry(...size)));const o=new THREE.InstancedMesh(boxCache.get(k),material,positions.length),matrix=new THREE.Matrix4();positions.forEach((p,i)=>{matrix.makeTranslation(...p);o.setMatrixAt(i,matrix);});parent.add(o);instances.push(o);return o;}
  labelRoot=document.createElement('div');labelRoot.className='universe-scene-labels';Object.assign(labelRoot.style,{position:'absolute',inset:'0',pointerEvents:'none'});(labels||container).append(labelRoot);
  status=document.createElement('p');status.className='universe-scene-status';status.setAttribute('role','status');status.hidden=true;container.append(status);
  function layer(owner,id,offset){const group=new THREE.Group();group.name=id;owner.group.add(group);const part={id,group,base:Object.freeze([0,0,0]),explode:new THREE.Vector3(...offset)};owner.layers.push(part);return group;}
  function createNode(node,index){
   const seed=hash(node.id),variant=seed%6,group=new THREE.Group();group.name=String(node.label||node.id);
   const a=index/Math.max(1,nodes.length)*TAU-Math.PI/2,radius=nodes.length===1?0:Math.max(4.1,Math.min(9,3.4+Math.sqrt(nodes.length)*.72));
   const position=validVector(node.position)?boundedPosition(node.position):[Math.cos(a)*radius,((seed>>>8)%3)*.35,Math.sin(a)*radius];group.position.fromArray(position);scene.add(group);
   const owner={node,group,seed,variant,initial:group.position.clone(),motionPhase:(seed%628)/100,motionFrequency:.65+(hash(node.type||'generic')%5)*.12,rotationBase:0,layers:[],spring:{value:0,velocity:0},amount:0,lastTarget:0,lastActive:null,labelX:null,labelY:null,labelHidden:null};objects.set(node.id,owner);
   const shell=layer(owner,'shell',[.48,.42,.12]),structure=layer(owner,'structure',[-.38,0,-.10]),core=layer(owner,'core',[0,.60,0]),detail=layer(owner,'detail',[.12,-.35,.45]);
   const accent=own(new THREE.MeshStandardMaterial({color:IVORY,metalness:.7,roughness:.2,emissive:0x282c21,emissiveIntensity:.2}));owner.accent=accent;
   owner.model=buildDetailedObject({THREE,node,seed,parts:{shell,structure,core,detail},materials:{metal,dark,pearl,accent,glow},own,mesh,boxes});
   owner.layers.forEach(part=>part.group.traverse(child=>{if(child.isMesh){child.userData.nodeId=node.id;child.userData.partId=part.id;child.castShadow=true;child.receiveShadow=true;pickables.push(child);}}));
   const stand=mesh(group,new THREE.CylinderGeometry(.77,.87,.10,40),dark,[0,-.32,0]);owner.stand=stand;
   const halo=mesh(group,new THREE.TorusGeometry(.82,.012,5,64),own(new THREE.MeshBasicMaterial({color:0xaaa99e,transparent:true,opacity:.4,toneMapped:false})),[0,-.25,0],[Math.PI/2,0,0]);owner.halo=halo;
   // Exact component raycasts remain aligned while layers separate. No invisible proxy intercepts links.
   const proportions=[.92+(seed%17)*.012,.94+((seed>>>8)%13)*.015,.94+((seed>>>16)%11)*.013];owner.proportions=proportions;owner.layers.forEach(p=>p.group.scale.fromArray(proportions));
   if(!fixedRotation){const orientation=((seed>>>12)%9-4)*.075;owner.rotationBase=orientation;for(const p of owner.layers)p.group.rotation.y=orientation;}
   const button=document.createElement('button');button.type='button';button.className='universe-node-label';button.dataset.nodeId=node.id;button.textContent=String(node.label||node.id);button.setAttribute('aria-label',`Inspect ${node.label||node.id}${node.type?`, ${node.type}`:''}`);button.setAttribute('aria-pressed','false');Object.assign(button.style,{position:'absolute',transform:'translate(-50%,0)',pointerEvents:'auto'});labelRoot.append(button);buttons.set(node.id,button);
   listen(button,'click',()=>onSelect(node.id));listen(button,'focus',()=>{focusedId=node.id;inside=true;});listen(button,'blur',()=>{if(focusedId===node.id)focusedId=null;});
  }
  nodes.forEach(createNode);
  // Allocated once. Changes mutate typed arrays; dragging never builds TubeGeometry.
  const edgePickables=[];
  edges.forEach(edge=>{
   const group=new THREE.Group();group.name=String(edge.label||edge.relation||edge.id);scene.add(group);
   const inferred=edge.strength==='cross-source inference'||edge.inferred===true;
   const connection={edge,group,inferred,layers:[],start:new THREE.Vector3(),end:new THREE.Vector3(),normal:new THREE.Vector3(),arch:1,dirty:true,selected:false,flowTime:0,flowPaused:false,flowDirection:1};connections.set(edge.id,connection);adjacency.get(edge.from).add(edge.id);adjacency.get(edge.to).add(edge.id);
   for(let layerIndex=0;layerIndex<MAX_LAYERS;layerIndex++){
    const geometry=own(new THREE.BufferGeometry());geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array((inferred?DASHES*2:SAMPLES+1)*3),3));
    const material=own(new THREE.LineBasicMaterial({color:layerIndex%2?0xa9b5ae:0x8f9aa2,transparent:true,opacity:.48,depthWrite:false,toneMapped:false}));
    const line=inferred?new THREE.LineSegments(geometry,material):new THREE.Line(geometry,material);line.userData.edgeId=edge.id;line.userData.edgeLayer=layerIndex;group.add(line);connection.layers.push(line);edgePickables.push(line);
    for(let tracer=0;tracer<TRACERS_PER_LAYER;tracer++)tracerLookup.push({edgeId:edge.id,layer:layerIndex,tracer,phase:(hash(edge.id)%1000)/1000});
   }
  });
  const tracerGeometry=own(new THREE.SphereGeometry(.060,7,5));const tracerMaterial=own(new THREE.MeshBasicMaterial({color:0xe6ecdc,toneMapped:false}));
  const tracers=new THREE.InstancedMesh(tracerGeometry,tracerMaterial,tracerLookup.length);tracers.instanceMatrix.setUsage(THREE.DynamicDrawUsage);tracers.userData.isTracer=true;scene.add(tracers);instances.push(tracers);const pose=new THREE.Object3D();
  const point=new THREE.Vector3(),from=new THREE.Vector3(),to=new THREE.Vector3();
  function edgePoint(edge,t,stratum,out){out.copy(edge.start).lerp(edge.end,t);const wave=Math.sin(Math.PI*t);out.y+=edge.arch*wave;out.addScaledVector(edge.normal,(stratum-(layerCount-1)/2)*.22*wave);return out;}
  function updateConnection(connection){
   connection.start.copy(objects.get(connection.edge.from).group.position).add(new THREE.Vector3(0,.42,0));connection.end.copy(objects.get(connection.edge.to).group.position).add(new THREE.Vector3(0,.42,0));
   connection.normal.subVectors(connection.end,connection.start).cross(new THREE.Vector3(0,1,0));if(connection.normal.lengthSq()<1e-6)connection.normal.set(1,0,0);connection.normal.normalize();connection.arch=.50+Math.min(1.8,connection.start.distanceTo(connection.end)*.09);
   for(let stratum=0;stratum<MAX_LAYERS;stratum++){const line=connection.layers[stratum],attribute=line.geometry.attributes.position;if(connection.inferred){for(let dash=0;dash<DASHES;dash++){edgePoint(connection,dash/DASHES,stratum,point);attribute.setXYZ(dash*2,point.x,point.y,point.z);edgePoint(connection,(dash+.55)/DASHES,stratum,point);attribute.setXYZ(dash*2+1,point.x,point.y,point.z);}}else{for(let sample=0;sample<=SAMPLES;sample++){edgePoint(connection,sample/SAMPLES,stratum,point);attribute.setXYZ(sample,point.x,point.y,point.z);}}attribute.needsUpdate=true;line.geometry.computeBoundingSphere();}
   connection.dirty=false;traceDirty=true;
  }
  function updateTracers(){
   visibleTracers=0;
   tracerLookup.forEach((entry,index)=>{const connection=connections.get(entry.edgeId),layerVisible=connection.group.visible&&entry.layer<layerCount;const progress=((connection.flowTime*.10+entry.phase+entry.tracer/TRACERS_PER_LAYER+entry.layer*.09)%1+1)%1;
    const visible=layerVisible&&(!connection.inferred||(progress*DASHES)%1<.55);entry.visible=visible;if(visible)visibleTracers++;
    pose.position.copy(edgePoint(connection,progress,entry.layer,point));
    // Bound apparent radius so nearby packets never obscure an inspected object.
    const depth=Math.max(.01,-from.copy(pose.position).applyMatrix4(camera.matrixWorldInverse).z);
    const pixelBound=3.5*2*depth*Math.tan(THREE.MathUtils.degToRad(camera.fov*.5))/Math.max(1,height)/.060;
    pose.scale.setScalar(visible?Math.min(pixelBound,(connection.selected?1.45:1)*(connection.inferred?.65:1)):0);pose.updateMatrix();tracers.setMatrixAt(index,pose.matrix);
   });tracers.instanceMatrix.needsUpdate=true;tracers.computeBoundingSphere();traceDirty=false;
  }
  const raycaster=new THREE.Raycaster();raycaster.params.Line.threshold=.12;const pointer=new THREE.Vector2(),dragPlane=new THREE.Plane(),intersectionPoint=new THREE.Vector3();
  function pointerRay(event){const r=canvas.getBoundingClientRect();pointer.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);}
  function hit(event){pointerRay(event);const nodeHit=raycaster.intersectObjects(pickables,false).find(h=>{for(let part=h.object;part;part=part.parent)if(!part.visible)return false;return true;});if(nodeHit)return {kind:'node',id:nodeHit.object.userData.nodeId};
   const hits=raycaster.intersectObjects([tracers,...edgePickables],false);for(const h of hits){if(h.object===tracers){const entry=tracerLookup[h.instanceId],connection=connections.get(entry?.edgeId);if(connection?.group.visible&&entry.layer<layerCount&&entry.visible)return {kind:'tracer',id:entry.edgeId,layer:entry.layer};}else if(h.object.visible&&h.object.parent.visible)return {kind:'pipeline',id:h.object.userData.edgeId,layer:h.object.userData.edgeLayer};}return null;
  }
  function markMoved(id){for(const edgeId of adjacency.get(id))connections.get(edgeId).dirty=true;layoutDirty=true;traceDirty=true;}
  function finishDrag(event,cancel=false){if(!drag)return;const completed=drag;drag=null;controls.enabled=true;if(cancel){objects.get(completed.id).group.position.copy(completed.start);markMoved(completed.id);}else onMove(completed.id,objects.get(completed.id).group.position.toArray());const pointerId=event?.pointerId??completed.pointerId;if(pointerId!==undefined&&canvas.hasPointerCapture?.(pointerId))canvas.releasePointerCapture(pointerId);}
  listen(canvas,'pointerdown',event=>{if(event.button!==0)return;const h=hit(event);down={x:event.clientX,y:event.clientY,id:h?.id};if(dragMode&&h?.kind==='node'){
   const object=objects.get(h.id),normal=camera.getWorldDirection(new THREE.Vector3());dragPlane.setFromNormalAndCoplanarPoint(normal,object.group.position);const p=raycaster.ray.intersectPlane(dragPlane,intersectionPoint);if(p){drag={id:h.id,pointerId:event.pointerId,start:object.group.position.clone(),offset:object.group.position.clone().sub(p)};controls.enabled=false;canvas.setPointerCapture?.(event.pointerId);onSelect(h.id);}
  }});
  listen(canvas,'pointermove',event=>{const sample={x:event.clientX,y:event.clientY,t:event.timeStamp};pointerVelocity=pointerSpeed(priorPointer,sample,priorPointer?sample.t-priorPointer.t:0);priorPointer=sample;inside=true;if(drag){pointerRay(event);const p=raycaster.ray.intersectPlane(dragPlane,intersectionPoint);if(p){p.add(drag.offset);objects.get(drag.id).group.position.fromArray(boundedPosition(p.toArray()));markMoved(drag.id);}return;}const h=hit(event);hovered=h?.kind==='node'?h.id:null;canvas.style.cursor=h?(dragMode&&h.kind==='node'?'grab':'pointer'):'default';});
  listen(canvas,'pointerup',event=>{if(drag){finishDrag(event);down=null;return;}if(!down)return;const moved=Math.hypot(event.clientX-down.x,event.clientY-down.y);down=null;if(moved>5)return;const h=hit(event);if(h?.kind==='node')onSelect(h.id);else if(h)onEdge(h.id,{layer:h.layer,kind:h.kind});});
  listen(canvas,'pointercancel',event=>{finishDrag(event,true);down=null;hovered=null;});listen(canvas,'pointerleave',()=>{if(!drag){inside=false;hovered=null;focusedId=null;priorPointer=null;}});
  listen(canvas,'dblclick',event=>{const h=hit(event);if(h?.kind==='node'){focusedId=h.id;focusNode(h.id);onSelect(h.id);}else if(h)onEdge(h.id,{layer:h.layer,kind:h.kind});});
  listen(window,'keydown',event=>{if(event.key==='Escape'&&drag)finishDrag(null,true);});listen(window,'blur',()=>{if(drag)finishDrag(null,true);inside=false;hovered=null;});
  listen(media,'change',event=>{reduce=event.matches;controls.enableDamping=!reduce;});listen(document,'visibilitychange',()=>{last=performance.now();lastVisible=null;});
  listen(canvas,'webglcontextlost',event=>{event.preventDefault();contextLost=true;lastVisible=null;status.hidden=false;status.textContent='The 3D view is temporarily unavailable. Item controls remain accessible.';});
  listen(canvas,'webglcontextrestored',()=>{try{rebuildEnvironment();contextLost=false;last=performance.now();lastVisible=null;traceDirty=true;connections.forEach(c=>c.dirty=true);status.hidden=true;}catch{status.textContent='The 3D view could not recover. Reload to restore graphics.';}});
  let width=1,height=1;
  function resize(){const r=container.getBoundingClientRect();width=Math.max(1,r.width);height=Math.max(1,r.height);renderer.setSize(width,height,false);camera.aspect=width/height;camera.fov=camera.aspect<.8?60:43;camera.updateProjectionMatrix();layoutDirty=true;}
  const sizeObserver=new ResizeObserver(resize);observers.push(sizeObserver);sizeObserver.observe(container);
  const visibilityObserver=new IntersectionObserver(entries=>{inViewport=entries[0]?.isIntersecting??true;last=performance.now();lastVisible=null;},{threshold:0});observers.push(visibilityObserver);visibilityObserver.observe(container);
  listen(controls,'change',()=>{layoutDirty=true;traceDirty=true;});
  function setState(next={}){
   if(Object.hasOwn(next,'selected'))selected=objects.has(next.selected)?next.selected:null;
   if(Object.hasOwn(next,'visibleIds'))visibleIds=new Set(next.visibleIds??ids);
   if(Object.hasOwn(next,'visibleEdgeIds'))visibleEdgeIds=new Set(next.visibleEdgeIds??edgeIds);
   if(Object.hasOwn(next,'layerIds'))partIds=new Set(next.layerIds??PARTS);
   if(Object.hasOwn(next,'isolatedNodeId'))isolatedNodeId=objects.has(next.isolatedNodeId)?next.isolatedNodeId:null;
   for(const [id,o] of objects){o.group.visible=visibleIds.has(id)&&(!isolatedNodeId||isolatedNodeId===id);o.layers.forEach(p=>{p.group.visible=partIds.has(p.id);});o.accent.color.setHex(id===selected?LIME:IVORY);o.halo.material.color.setHex(id===selected?LIME:0xaaa99e);const b=buttons.get(id);b.setAttribute('aria-pressed',String(id===selected));b.classList.toggle('selected',id===selected);}
   for(const c of connections.values()){c.group.visible=!isolatedNodeId&&visibleEdgeIds.has(c.edge.id)&&visibleIds.has(c.edge.from)&&visibleIds.has(c.edge.to);c.selected=c.edge.from===selected||c.edge.to===selected;c.layers.forEach((line,i)=>{line.visible=i<layerCount;line.material.color.setHex(c.selected?LIME:i%2?0xa9b5ae:0x8f9aa2);line.material.opacity=c.selected?.83:.43;});}
   if(hovered&&!visibleIds.has(hovered))hovered=null;if(focusedId&&!visibleIds.has(focusedId))focusedId=null;layoutDirty=true;traceDirty=true;
  }
  function setObjectExplosion(id,amount){if(!objects.has(id))return false;if(amount===null){delete objectExplosions[id];if(focusedId===id)focusedId=null;return true;}if(!Number.isFinite(amount))return false;objectExplosions[id]=THREE.MathUtils.clamp(amount,0,1);return true;}
  function setIsolation(id){setState({isolatedNodeId:id});if(isolatedNodeId)focusNode(isolatedNodeId);return isolatedNodeId;}
  function setQuality(high){renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,high?2:1.25));renderer.shadowMap.enabled=Boolean(high);resize();return Boolean(high);}
  function setDragMode(value){dragMode=Boolean(value);if(!dragMode&&drag)finishDrag(null,true);return dragMode;}
  function setLayers(n){layerCount=THREE.MathUtils.clamp(Math.round(Number.isFinite(n)?n:3),1,MAX_LAYERS);connections.forEach(c=>c.dirty=true);setState();return layerCount;}
  function setPaused(value){paused=Boolean(value);if(!paused){reduce=false;controls.enableDamping=true;}last=performance.now();lastVisible=null;return paused;}
  function setFlowDirection(value){direction=value<0?-1:1;connections.forEach(c=>{c.flowDirection=direction;});return direction;}
  function setEdgeFlow(id,change={}){const connection=connections.get(id);if(!connection)return false;if(typeof change.paused==='boolean')connection.flowPaused=change.paused;if(Number.isFinite(change.direction))connection.flowDirection=change.direction<0?-1:1;return {paused:connection.flowPaused,direction:connection.flowDirection};}
  function getEdgeFlows(){return Object.fromEntries([...connections].map(([id,c])=>[id,{paused:c.flowPaused,direction:c.flowDirection}]));}
  function setFlowPaused(value){flowPaused=Boolean(value);return flowPaused;}
  function setVisibilityOverride(value){visibilityOverride=value===true?true:null;last=performance.now();lastVisible=null;}
  function focusNode(id){const o=objects.get(id);if(!o)return false;focusedId=id;const target=o.group.position.clone().add(new THREE.Vector3(0,.38,0));const away=camera.position.clone().sub(controls.target).normalize();cameraGoal={target,position:target.clone().addScaledVector(away,4.6)};return true;}
  function reset(){if(drag)finishDrag(null,true);objects.forEach(o=>{o.group.position.copy(o.initial);markMoved(o.node.id);});cameraGoal={position:homePosition.clone(),target:homeTarget.clone()};hovered=focusedId=null;inside=false;}
  function getView(){return {camera:{position:camera.position.toArray(),target:controls.target.toArray(),zoom:camera.zoom},positions:Object.fromEntries([...objects].map(([id,o])=>[id,o.group.position.toArray()])),selected,layers:layerCount,layerIds:[...partIds],dragMode,paused,flowPaused,flowDirection:direction,edgeFlows:getEdgeFlows(),objectExplosions:{...objectExplosions},isolatedNodeId};}
  function setView(view={}){
   if(drag)finishDrag(null,true);cameraGoal=null;hovered=focusedId=null;inside=false;objectExplosions={};for(const [id,amount] of Object.entries(view.objectExplosions||{}))setObjectExplosion(id,amount);setState({isolatedNodeId:view.isolatedNodeId??null});connections.forEach(c=>{c.flowPaused=false;c.flowDirection=1;});
   if(validVector(view.camera?.position))camera.position.fromArray(view.camera.position);if(validVector(view.camera?.target))controls.target.fromArray(view.camera.target);if(Number.isFinite(view.camera?.zoom)){camera.zoom=THREE.MathUtils.clamp(view.camera.zoom,.5,3);camera.updateProjectionMatrix();}
   for(const [id,p] of Object.entries(view.positions||{}))if(objects.has(id)&&validVector(p)){objects.get(id).group.position.fromArray(boundedPosition(p));markMoved(id);}
   if(Number.isFinite(view.layers))setLayers(view.layers);if(Array.isArray(view.layerIds))setState({layerIds:view.layerIds});if(typeof view.dragMode==='boolean')setDragMode(view.dragMode);if(typeof view.paused==='boolean')setPaused(view.paused);if(typeof view.flowPaused==='boolean')flowPaused=view.flowPaused;if(Number.isFinite(view.flowDirection))setFlowDirection(view.flowDirection);for(const [id,flow] of Object.entries(view.edgeFlows||{}))if(flow&&typeof flow==='object')setEdgeFlow(id,flow);if(Object.hasOwn(view,'selected'))setState({selected:view.selected});controls.update();layoutDirty=true;
  }
  const projected=new THREE.Vector3(),previousCamera=new THREE.Vector3(),previousTarget=new THREE.Vector3();
  function render(now){
   if(disposed)return;raf=requestAnimationFrame(render);const dt=Math.min(Math.max(0,(now-last)/1000),.06);last=now;if(!(visibilityOverride??inViewport)||document.hidden||contextLost){lastVisible=null;return;}
   if(lastVisible!==null){const interval=now-lastVisible;if(interval>0){frameIntervals.push(interval);if(frameIntervals.length>180)frameIntervals.shift();}}lastVisible=now;
   if(!paused&&!reduce){time+=dt;if(!flowPaused){flowTime+=dt*direction;connections.forEach(c=>{if(!c.flowPaused){c.flowTime+=dt*c.flowDirection;traceDirty=true;}});}}
   if(cameraGoal){const alpha=reduce?1:1-Math.exp(-dt*5);camera.position.lerp(cameraGoal.position,alpha);controls.target.lerp(cameraGoal.target,alpha);layoutDirty=true;if(camera.position.distanceTo(cameraGoal.position)<.015){camera.position.copy(cameraGoal.position);controls.target.copy(cameraGoal.target);cameraGoal=null;}}
   controls.update();
   for(const [id,o] of objects){const distance=camera.position.distanceTo(o.group.position),proximity=inside?THREE.MathUtils.clamp((6.1-distance)/2.6,0,1):0;const automatic=id===hovered?.68+proximity*.32:id===focusedId?1:proximity;const target=Object.hasOwn(objectExplosions,id)?objectExplosions[id]:automatic;
    if(reduce||(paused&&target!==o.lastTarget))o.spring={value:target,velocity:0};else if(!paused)o.spring=stepSpring(o.spring,target,dt,{frequency:2.4,dampingRatio:dampingForSpeed(pointerVelocity)});o.lastTarget=target;const amount=THREE.MathUtils.clamp(o.spring.value,0,1.05);
    // Bounded illustrative micro-motion. Always derive from base + spring +
    // clock phase; owner centers and connection anchors are never modified.
    const degree=adjacency.get(id).size,amplitude=reduce?0:(.010+Math.min(degree,8)*.0012)*(1-.6*amount),phase=time*o.motionFrequency+o.motionPhase;
    o.layers.forEach((part,index)=>{
     const importance=part.id==='core'?1.65:part.id==='detail'?1.1:.35;
     part.group.position.set(part.base[0]+part.explode.x*amount+Math.cos(phase*.73+index)*amplitude*.35,part.base[1]+part.explode.y*amount+Math.sin(phase+index*.8)*amplitude*importance,part.base[2]+part.explode.z*amount+Math.sin(phase*.61+index)*amplitude*.30);
     if(!fixedRotation)part.group.rotation.y=o.rotationBase+(reduce?0:Math.sin(phase*.60+index)*.035*(part.id==='core'?1:.25));
    });o.amount=amount;
    const active=id===hovered||id===focusedId;if(active!==o.lastActive){buttons.get(id).classList.toggle('active',active);o.lastActive=active;}
   }
   connections.forEach(c=>{if(c.dirty)updateConnection(c);});if(traceDirty)updateTracers();
   if(layoutDirty){camera.updateMatrixWorld();for(const [id,o] of objects){projected.copy(o.group.position).add(new THREE.Vector3(0,-.50,0)).project(camera);const x=Math.round((projected.x*.5+.5)*width),y=Math.round((-projected.y*.5+.5)*height),hidden=!o.group.visible||projected.z>1||projected.z< -1||Math.abs(projected.x)>1.1||Math.abs(projected.y)>1.1,b=buttons.get(id);if(x!==o.labelX){b.style.left=x+'px';o.labelX=x;}if(y!==o.labelY){b.style.top=y+'px';o.labelY=y;}if(hidden!==o.labelHidden){b.hidden=hidden;o.labelHidden=hidden;}}layoutDirty=false;}
   renderer.render(scene,camera);renderedFrames++;
  }
  function getStats(){return {available:!contextLost,rendering:'Raster PBR; illustrative sculptures and tracers',nodeCount:nodes.length,edgeCount:edges.length,isolatedNodeId,objectExplosions:{...objectExplosions},shadows:renderer.shadowMap.enabled,componentPicking:true,visibleNodeCount:[...objects.values()].filter(o=>o.group.visible).length,visibleEdgeCount:[...connections.values()].filter(c=>c.group.visible).length,layerCount,tracerInstanceCount:tracerLookup.length,visibleTracerCount:visibleTracers,inferredEdgeCount:[...connections.values()].filter(c=>c.inferred).length,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,renderedFrames,...frameSummary(frameIntervals),paused,reducedMotion:reduce,flowPaused,flowDirection:direction,edgeFlows:getEdgeFlows(),dragMode,dragging:drag?.id??null,selected,visible:(visibilityOverride??inViewport)&&!document.hidden,contextLost,pipelineGeometryAllocations:edges.length*MAX_LAYERS,pipelineGeometryUpdates:'In-place typed arrays; no geometry allocation during movement',nodePositions:Object.fromEntries([...objects].map(([id,o])=>[id,o.group.position.toArray()])),structuralMotion:{clock:time,active:!paused&&!reduce,scope:'Illustrative ID/type/connectivity-based mechanical motion; not biological behavior'},geometryVariants:Object.fromEntries([...objects].map(([id,o])=>[id,{family:o.model?.family||o.variant,model:o.model,proportions:o.proportions}])),decomposition:Object.fromEntries([...objects].map(([id,o])=>[id,o.amount]))};}
  setState();resize();controls.update();render(performance.now());queueMicrotask(()=>{if(!disposed)onReady(getStats());});
  return {setObjectExplosion,setIsolation,setQuality,setDragMode,setLayers,setPaused,setFlowDirection,setFlowPaused,setEdgeFlow,getEdgeFlows,setState,focusNode,reset,getView,setView,getStats,setVisibilityOverride,dispose};
 }catch(error){dispose();throw error;}
}
