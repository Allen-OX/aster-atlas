import * as THREE from './vendor/three/three.module.js';
import {HOLOGRAM_LIMITS,CARTESIAN_LAYOUT,clamp,stepSpring,pointerSpeed,dampingForSpeed,frameSummary} from './hologram-math.js';

// Generic raster artwork and exact Cartesian interface mechanics. Decorative
// points are not records or traced photons. There are no data, storage, or network imports.
import { motionAttributes, sampleObjectMotion } from './object-motion.js';
const RED=0xff0000;
const PARTICLE_VERTEX=`
attribute vec3 aNoise;attribute vec3 aAxis;attribute float aSeed;
uniform float uTime;uniform float uAmount;uniform float uSize;
varying float vAlpha;
void main(){
 vec3 corner=position+aAxis*uAmount;
 float condense=smoothstep(0.,1.,uAmount);
 float breath=.5+.5*sin(uTime*.6+aSeed*6.2831853);
 vec3 p=corner+aNoise*(1.-condense)*(.22+.045*breath);
 p+=aNoise*.025*sin(uTime*.35+aSeed*12.)*condense;
 vec4 mv=modelViewMatrix*vec4(p,1.);
 gl_Position=projectionMatrix*mv;
 gl_PointSize=clamp((1.1+aSeed*1.8)*uSize*12./max(3.,-mv.z),1.,4.5);
 vAlpha=(.055+.23*condense)*(.45+.55*aSeed);
}`;
const PARTICLE_FRAGMENT=`varying float vAlpha;void main(){float d=length(gl_PointCoord-.5)*2.;if(d>1.)discard;gl_FragColor=vec4(vec3(.86),exp(-d*d*5.)*vAlpha);}`;
const EMBLEM_VERTEX=`varying vec2 vUv;void main(){vUv=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const EMBLEM_FRAGMENT=`
varying vec2 vUv;uniform float uActive;
float rectangle(vec2 p,vec2 b){vec2 q=abs(p)-b;return length(max(q,0.))+min(max(q.x,q.y),0.);}
void main(){float d=10.;for(int i=0;i<4;i++){float a=float(i)*.785398163;vec2 p=mat2(cos(a),-sin(a),sin(a),cos(a))*vUv;d=min(d,rectangle(p,vec2(.84,.102)));}float aa=max(fwidth(d),.001);float alpha=(1.-smoothstep(-aa,aa,d))*smoothstep(.105-aa,.105+aa,length(vUv));if(alpha<.001)discard;gl_FragColor=vec4(mix(vec3(1.),vec3(1.,0.,0.),uActive),alpha);}`;

function validateItems(items){
 if(!Array.isArray(items)||items.length>HOLOGRAM_LIMITS.maxItems)throw new RangeError(`Living Hologram accepts at most ${HOLOGRAM_LIMITS.maxItems} generic items.`);
 const ids=new Set();for(const item of items){if(typeof item.id!=='string'||!item.id||typeof item.label!=='string'||ids.has(item.id))throw new TypeError('Each item requires a unique string id and a label.');ids.add(item.id);}
}
function fallback({canvas,container,items,onSelect,onReady,onExplodedChange,onStatus,error}){
 const canvasVisibility=canvas.style.visibility;canvas.style.visibility='hidden';
 const root=document.createElement('div');root.className='living-hologram-fallback';Object.assign(root.style,{position:'absolute',inset:'0',zIndex:'3',display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:'8px',padding:'20px',overflow:'auto',alignContent:'center',background:'#0b0b0b',pointerEvents:'auto'});const message=document.createElement('p');message.setAttribute('role','status');message.style.gridColumn='1 / -1';message.textContent='The 3D view is unavailable. The same items remain available below.';root.append(message);
 const buttons=new Map();for(const item of items){const b=document.createElement('button');b.type='button';b.textContent=item.label;b.setAttribute('aria-pressed','false');b.onclick=()=>onSelect(item.id);root.append(b);buttons.set(item.id,b);}container.append(root);
 let disposed=false,selected=null,paused=true,quality='low',exploded=false;
 const getStats=()=>({available:false,rendering:'text fallback',itemCount:items.length,selected,paused,quality,drawCalls:0,points:0,triangles:0,error:error?.message||'Renderer initialization failed'});
 const api={setState({selected:value=selected,visibleIds}={}){selected=value;const visible=visibleIds==null?new Set(items.map(i=>i.id)):new Set(visibleIds);buttons.forEach((b,id)=>{b.hidden=!visible.has(id);b.setAttribute('aria-pressed',String(id===selected));});},setPaused(v){paused=!!v;},setExploded(v){exploded=Boolean(v);onExplodedChange(exploded);},setVisibilityOverride(){},setAnimationRate(){},setQuality(v){quality=v==='high'?'high':'low';},getStats,dispose(){if(!disposed){disposed=true;root.remove();canvas.style.visibility=canvasVisibility;}}};
 queueMicrotask(()=>{if(!disposed){onStatus({status:'fallback',available:false,contextLost:false,message:message.textContent});onReady(getStats());}});return api;
}

/** Generic component; supplied labels are optional. Item callbacks contain IDs only.
 * No orbit controls. Camera and all cube/layer transforms retain identity rotation.
 */
export function createLivingHologram({canvas,container,items,labels,onSelect=()=>{},onReady=()=>{},onExplodedChange=()=>{},onStatus=()=>{},quality='high',reducedMotion}={}){
 validateItems(items);if(!canvas||!container)throw new TypeError('A canvas and its container are required.');
 const owned=new Set(),removers=[],observers=[],instances=[],cubes=new Map(),buttons=new Map(),samples=[];
 let renderer,environmentTarget,labelRoot,status,raf=0,disposed=false,scene,camera,emblem;
 let inViewport=true,visibilityOverride=null,contextLost=false,contextLossCount=0,renderedFrames=0,lastVisibleFrame=null,last=performance.now(),time=0,animationRate=1;
 let selected=null,hovered=null,focused=null,centerHovered=false,centerFocused=false,exploded=false,paused=false,localSpeed=0,previousPointer=null;
 let visibleIds=new Set(items.map(i=>i.id)),tier=quality==='low'?'low':'high',emblemSpring={value:0,velocity:0},previousEmblemActive=false;
 const media=window.matchMedia('(prefers-reduced-motion: reduce)');let reduce=typeof reducedMotion==='boolean'?reducedMotion:media.matches;
 const own=r=>{owned.add(r);return r;};
 const listen=(target,type,handler,options)=>{target.addEventListener(type,handler,options);removers.push(()=>target.removeEventListener(type,handler,options));};
 function dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(raf);observers.forEach(o=>o.disconnect());removers.forEach(fn=>fn());instances.forEach(o=>o.dispose());owned.forEach(r=>r.dispose());environmentTarget?.dispose();renderer?.dispose();labelRoot?.remove();status?.remove();scene?.clear();previousPointer=null;localSpeed=0;}
 try{
  renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});
  renderer.setClearColor(0x080808,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
  scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(34,1,.1,80);camera.position.set(0,0,16);camera.up.set(0,1,0);
  // The camera's default quaternion is identity: forward -Z, up +Y. Never lookAt/rotate.
  const key=new THREE.DirectionalLight(0xffffff,3.8);key.position.set(-4,7,10);scene.add(key);
  const fill=new THREE.DirectionalLight(0xffffff,1.6);fill.position.set(5,-3,7);scene.add(fill);scene.add(new THREE.HemisphereLight(0xe9e9e9,0x202020,1.2));
  function rebuildEnvironment(){
   const studio=new THREE.Scene();studio.background=new THREE.Color(0x454545);const cards=[];let pmrem,next;
   for(const [position,size,color] of [[[0,4,2],[7,.1,5],0xffffff],[[-4,0,1],[.1,7,5],0xb0b0b0],[[4,1,-2],[.1,6,5],0x999999]]){
    const g=new THREE.BoxGeometry(...size),m=new THREE.MeshBasicMaterial({color}),o=new THREE.Mesh(g,m);o.position.set(...position);studio.add(o);cards.push(o);
   }
   try{pmrem=new THREE.PMREMGenerator(renderer);next=pmrem.fromScene(studio,.07);}finally{pmrem?.dispose();cards.forEach(o=>{o.geometry.dispose();o.material.dispose();});}
   const previous=environmentTarget;environmentTarget=next;scene.environment=environmentTarget.texture;scene.environmentIntensity=.7;previous?.dispose();
  }
  rebuildEnvironment();
  const steel=own(new THREE.MeshStandardMaterial({color:0x969696,metalness:.95,roughness:.22}));
  const dark=own(new THREE.MeshStandardMaterial({color:0x181818,metalness:.90,roughness:.28}));
  const face=own(new THREE.MeshStandardMaterial({color:0x555555,metalness:.87,roughness:.30}));
  const recess=own(new THREE.MeshStandardMaterial({color:0x080808,metalness:.30,roughness:.7}));
  const trace=own(new THREE.MeshStandardMaterial({color:0xb8b8b8,metalness:.75,roughness:.36}));
  const red=own(new THREE.MeshBasicMaterial({color:RED,toneMapped:false,fog:false,transparent:false,opacity:1,blending:THREE.NoBlending}));
  const white=own(new THREE.MeshBasicMaterial({color:0xffffff,toneMapped:false,transparent:true,opacity:.34,depthWrite:false}));
  const pickMaterial=own(new THREE.MeshBasicMaterial({visible:false}));
  const geometryCache=new Map();
  function boxGeometry(size){const key=size.join(',');if(!geometryCache.has(key))geometryCache.set(key,own(new THREE.BoxGeometry(...size)));return geometryCache.get(key);}
  function box(parent,size,position,material){const o=new THREE.Mesh(boxGeometry(size),material);o.position.set(...position);parent.add(o);return o;}
  function batch(parent,size,positions,material){const o=new THREE.InstancedMesh(boxGeometry(size),material,positions.length),matrix=new THREE.Matrix4();positions.forEach((p,i)=>{matrix.makeTranslation(...p);o.setMatrixAt(i,matrix);});o.instanceMatrix.needsUpdate=true;parent.add(o);instances.push(o);return o;}
  function plateGeometry(w,h,d){
   const shape=new THREE.Shape(),r=.07;shape.moveTo(-w/2+r,-h/2);shape.lineTo(w/2-r,-h/2);shape.lineTo(w/2,-h/2+r);shape.lineTo(w/2,h/2-r);shape.lineTo(w/2-r,h/2);shape.lineTo(-w/2+r,h/2);shape.lineTo(-w/2,h/2-r);shape.lineTo(-w/2,-h/2+r);shape.closePath();
   const geometry=own(new THREE.ExtrudeGeometry(shape,{depth:d,steps:1,bevelEnabled:true,bevelThickness:.018,bevelSize:.018,bevelSegments:1}));geometry.translate(0,0,-d/2);return geometry;
  }
  const faceGeometry=plateGeometry(1.31,.61,.065);
  const coreGeometry=plateGeometry(1.16,1.16,.065);
  labelRoot=document.createElement('div');labelRoot.className='living-hologram-labels';Object.assign(labelRoot.style,{position:'absolute',inset:'0',pointerEvents:'none'});(labels||container).append(labelRoot);
  status=document.createElement('p');status.className='living-hologram-status';status.setAttribute('role','status');status.hidden=true;container.append(status);
  const pickables=[];
  function createLayer(owner,id,base,axis){const group=new THREE.Group();group.name=id;group.position.set(...base);owner.group.add(group);const layer={id,group,base:Object.freeze([...base]),axis:Object.freeze([...axis])};owner.layers.push(layer);return group;}
  function frontDetail(parent,top){
   parent.add(new THREE.Mesh(faceGeometry,face));
   batch(parent,[1.11,.012,.011],[[0,-.245,.051],[0,.245,.051]],steel);
   batch(parent,[.012,.38,.011],[[-.57,0,.051],[.57,0,.051]],steel);
   const slots=[],pins=[];for(let i=0;i<11;i++){slots.push([-.48+i*.096,top?.03:-.055,.052]);pins.push([-.48+i*.096,top?-.125:.125,.058]);}
   batch(parent,[.031,.16,.012],slots,recess);batch(parent,[.037,.021,.016],pins,trace);
   batch(parent,[.045,.045,.02],[[-.57,-.24,.057],[.57,-.24,.057],[-.57,.24,.057],[.57,.24,.057]],dark);
  }
  function makeParticles(owner,index){
   const positions=[],axes=[],noise=[],seeds=[];let seed=(index+1)*7451;const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
   for(let i=0;i<HOLOGRAM_LIMITS.highParticlesPerItem;i++){
    const layer=owner.layers[i%owner.layers.length],corner=Math.floor(i/owner.layers.length)%4;
    const x=(corner%2?1:-1)*.60,y=(corner>1?1:-1)*.26;
    positions.push(layer.base[0]+x,layer.base[1]+y,layer.base[2]+.07);axes.push(...layer.axis);noise.push(rand()*2-1,rand()*2-1,rand()*2-1);seeds.push(rand());
   }
   const geometry=own(new THREE.BufferGeometry());geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('aAxis',new THREE.Float32BufferAttribute(axes,3));geometry.setAttribute('aNoise',new THREE.Float32BufferAttribute(noise,3));geometry.setAttribute('aSeed',new THREE.Float32BufferAttribute(seeds,1));geometry.boundingSphere=new THREE.Sphere(new THREE.Vector3(),2.7);
   const material=own(new THREE.ShaderMaterial({vertexShader:PARTICLE_VERTEX,fragmentShader:PARTICLE_FRAGMENT,uniforms:{uTime:{value:0},uAmount:{value:0},uSize:{value:1}},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));
   const points=new THREE.Points(geometry,material);points.name='Decorative corner condensates';owner.group.add(points);owner.particles=points;
  }
  items.forEach((item,index)=>{
   const group=new THREE.Group();group.name=item.label;group.position.set(...CARTESIAN_LAYOUT[index]);scene.add(group);
   const owner={item,group,layers:[],base:Object.freeze([...CARTESIAN_LAYOUT[index]]),lift:{value:0,velocity:0},fission:{value:0,velocity:0},redMarks:[],particleCount:0,appliedDepth:null,appliedAmount:null,appliedActive:null,labelOutside:false};cubes.set(item.id,owner);
   box(group,[1.26,1.26,1.26],[0,0,0],dark);
   batch(group,[.095,.095,1.42],[[-.64,-.64,0],[.64,-.64,0],[-.64,.64,0],[.64,.64,0]],steel);
   const frontTop=createLayer(owner,'Front upper panel',[0,.33,.73],[0,.16,.47]);frontDetail(frontTop,true);
   const frontBottom=createLayer(owner,'Front lower panel',[0,-.33,.73],[0,-.16,.47]);frontDetail(frontBottom,false);
   for(const [name,base,axis,size] of [
    ['Left shield',[-.71,0,0],[-.40,0,0],[.07,1.38,1.38]],['Right shield',[.71,0,0],[.40,0,0],[.07,1.38,1.38]],
    ['Upper shield',[0,.71,0],[0,.40,0],[1.38,.07,1.38]],['Lower shield',[0,-.71,0],[0,-.40,0],[1.38,.07,1.38]],
    ['Rear shield',[0,0,-.71],[0,0,-.30],[1.38,1.38,.07]],
   ]){const layer=createLayer(owner,name,base,axis);box(layer,size,[0,0,0],face);}
   const board=createLayer(owner,'Internal circuit layer',[0,0,.54],[0,0,.18]);board.add(new THREE.Mesh(coreGeometry,recess));
   batch(board,[.22,.20,.065],[[-.30,.28,.06],[.30,.28,.06],[-.30,-.28,.06],[.30,-.28,.06]],steel);
   const circuit=[];for(let i=0;i<12;i++)circuit.push([-.5+i*.091,0,.04]);batch(board,[.009,.95,.008],circuit,trace);
   batch(board,[.83,.009,.009],[[0,-.44,.045],[0,0,.045],[0,.44,.045]],trace);
   const redTop=batch(frontTop,[.12,.050,.012],[[-.43,.244,.065],[.43,.244,.065]],red);
   const redBottom=batch(frontBottom,[.12,.050,.012],[[-.43,-.244,.065],[.43,-.244,.065]],red);redTop.visible=redBottom.visible=false;owner.redMarks.push(redTop,redBottom);
   batch(frontTop,[.55,.008,.008],[[0,.20,.065]],white);batch(frontBottom,[.55,.008,.008],[[0,-.20,.065]],white);
   // Stationary Cartesian pick prism covers the complete approach/fission envelope.
   const proxy=box(scene,[2.4,2.4,4.2],[owner.base[0],owner.base[1],.65],pickMaterial);proxy.userData.itemId=item.id;pickables.push(proxy);owner.proxy=proxy;
   owner.motion=motionAttributes(item,index);owner.motionSample=sampleObjectMotion(owner.motion,0);
   owner.scan=box(group,[1.12,.016,.014],[0,0,.82],white);
   owner.sourceLights=[];
   for(let j=0;j<owner.motion.sourceCount;j++){
    const light=box(frontBottom,[.035,.055,.016],[-.5+j*.085,-.16,.085],white);owner.sourceLights.push(light);
   }
   makeParticles(owner,index);
   const button=document.createElement('button');button.type='button';button.className='living-hologram-label';button.dataset.itemId=item.id;button.setAttribute('aria-label',`Select ${item.label}`);button.setAttribute('aria-pressed','false');
   const title=document.createElement('span');title.textContent=item.label;button.append(title);
   if(Number.isFinite(item.sourceCount)){const small=document.createElement('small');small.textContent=`${owner.motion.sourceCount} source${owner.motion.sourceCount===1?"":"s"} · ${owner.motion.connectionCount} link${owner.motion.connectionCount===1?"":"s"}`;button.append(small);button.title=`${item.label}: ${owner.motion.label}, ${owner.motion.sourceCount} sources, ${owner.motion.connectionCount} connections. Motion is illustrative.`;}
   Object.assign(button.style,{position:'absolute',transform:'translate(-50%,0)',pointerEvents:'auto',zIndex:'3'});labelRoot.append(button);buttons.set(item.id,button);
   listen(button,'focus',()=>{focused=item.id;});listen(button,'blur',()=>{if(focused===item.id)focused=null;});listen(button,'pointerenter',()=>{hovered=item.id;});listen(button,'pointerleave',()=>{if(hovered===item.id)hovered=null;});listen(button,'click',()=>onSelect(item.id));
  });
  const emblemMaterial=own(new THREE.ShaderMaterial({vertexShader:EMBLEM_VERTEX,fragmentShader:EMBLEM_FRAGMENT,uniforms:{uActive:{value:0}},transparent:true,depthWrite:false,toneMapped:false}));
  emblem=new THREE.Mesh(own(new THREE.PlaneGeometry(1.95,1.95)),emblemMaterial);emblem.name='Procedural central eight-ray emblem';emblem.position.z=.65;scene.add(emblem);
  const centerButton=document.createElement('button');centerButton.type='button';centerButton.className='living-hologram-center-control';centerButton.setAttribute('aria-label','Expand all cube layers');centerButton.setAttribute('aria-pressed','false');
  Object.assign(centerButton.style,{position:'absolute',left:'50%',top:'50%',width:'92px',height:'92px',transform:'translate(-50%,-50%)',pointerEvents:'auto',background:'transparent',border:'0',color:'transparent',zIndex:'2'});labelRoot.append(centerButton);
  listen(centerButton,'pointerenter',()=>{centerHovered=true;});listen(centerButton,'pointerleave',()=>{centerHovered=false;});listen(centerButton,'focus',()=>{centerFocused=true;});listen(centerButton,'blur',()=>{centerFocused=false;});listen(centerButton,'click',()=>setExploded(!exploded));
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let down=null;
  function pick(event){const r=canvas.getBoundingClientRect();pointer.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);return raycaster.intersectObjects(pickables,false).find(h=>h.object.visible);}
  listen(canvas,'pointermove',event=>{
   const now=performance.now();if(event.pointerType!=='touch'){const current={x:event.clientX,y:event.clientY};const speed=pointerSpeed(previousPointer,current,previousPointer?now-previousPointer.time:0);localSpeed=localSpeed*.55+speed*.45;previousPointer={...current,time:now};}
   hovered=pick(event)?.object.userData.itemId??null;canvas.style.cursor=hovered?'pointer':'default';
  });
  listen(canvas,'pointerdown',event=>{if(event.button===0)down={x:event.clientX,y:event.clientY};});
  listen(canvas,'pointerup',event=>{if(!down)return;const distance=Math.hypot(event.clientX-down.x,event.clientY-down.y);down=null;if(distance<6){const id=pick(event)?.object.userData.itemId;if(id)onSelect(id);}});
  const clearPointer=()=>{hovered=null;previousPointer=null;localSpeed=0;down=null;};listen(canvas,'pointerleave',clearPointer);listen(canvas,'pointercancel',clearPointer);
  listen(media,'change',event=>{reduce=event.matches;});
  listen(document,'visibilitychange',()=>{last=performance.now();lastVisibleFrame=null;previousPointer=null;localSpeed=0;});
  listen(canvas,'webglcontextlost',event=>{event.preventDefault();contextLost=true;contextLossCount++;lastVisibleFrame=null;status.hidden=false;status.textContent='The 3D view is temporarily unavailable. Item controls remain active.';onStatus({status:'context-lost',available:true,contextLost:true,message:status.textContent});});
  listen(canvas,'webglcontextrestored',()=>{
   onStatus({status:'restoring',available:true,contextLost:true,message:'Rebuilding the 3D lighting environment.'});
   try{rebuildEnvironment();contextLost=false;last=performance.now();lastVisibleFrame=null;status.hidden=true;onStatus({status:'ready',available:true,contextLost:false,message:'The 3D view has been restored.'});}
   catch(error){contextLost=true;status.hidden=false;status.textContent='The 3D view could not recover. Item controls remain available.';onStatus({status:'error',available:true,contextLost:true,message:status.textContent,error:error.message});}
  });
  const labelProjection=new THREE.Vector3();
  function resize(){
   const r=container.getBoundingClientRect(),width=Math.max(1,r.width),height=Math.max(1,r.height);camera.aspect=width/height;
   const fit=Math.max(8.7,9.1/camera.aspect);camera.position.z=fit/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2)))+1.2;camera.updateProjectionMatrix();camera.updateMatrixWorld();renderer.setSize(width,height,false);
   // Fixed camera and immutable label anchors require DOM layout only on resize.
   for(const [id,o] of cubes){const p=labelProjection.set(o.base[0],o.base[1]-.99,.75).project(camera),button=buttons.get(id);o.labelOutside=Math.abs(p.x)>1.05||Math.abs(p.y)>1.05;button.style.left=`${(p.x*.5+.5)*width}px`;button.style.top=`${(-p.y*.5+.5)*height}px`;button.hidden=!o.group.visible||o.labelOutside;}
   const corner=labelProjection.set(.975,.975,1.03).project(camera);centerButton.style.width=`${Math.max(34,Math.min(110,Math.abs(corner.x)*width))}px`;centerButton.style.height=`${Math.max(34,Math.min(110,Math.abs(corner.y)*height))}px`;
  }
  const resizeObserver=new ResizeObserver(resize);observers.push(resizeObserver);resizeObserver.observe(container);
  const intersection=new IntersectionObserver(entries=>{inViewport=entries[0]?.isIntersecting??true;last=performance.now();lastVisibleFrame=null;previousPointer=null;localSpeed=0;},{threshold:0});observers.push(intersection);intersection.observe(container);
  function setState(next={}){
   if(Object.hasOwn(next,'selected'))selected=cubes.has(next.selected)?next.selected:null;
   if(Object.hasOwn(next,'visibleIds'))visibleIds=new Set(next.visibleIds??items.map(i=>i.id));
   for(const [id,o] of cubes){o.group.visible=visibleIds.has(id);o.proxy.visible=o.group.visible;const b=buttons.get(id);b.hidden=!o.group.visible||o.labelOutside;b.classList.toggle('selected',id===selected);b.setAttribute('aria-pressed',String(id===selected));}
   if(hovered&&!visibleIds.has(hovered))hovered=null;if(focused&&!visibleIds.has(focused))focused=null;
  }
  function setVisibilityOverride(value){visibilityOverride=value===true?true:null;last=performance.now();lastVisibleFrame=null;return visibilityOverride;}
  function setAnimationRate(value){animationRate=Math.max(.25,Math.min(2,Number(value)||1));return animationRate;}
  function setPaused(value){paused=Boolean(value);if(!paused)reduce=false;last=performance.now();lastVisibleFrame=null;return paused;}
  function setExploded(value){const changed=exploded!==Boolean(value);exploded=Boolean(value);centerButton.setAttribute('aria-pressed',String(exploded));centerButton.setAttribute('aria-label',exploded?'Restore all cube layers':'Expand all cube layers');if(changed)onExplodedChange(exploded);return exploded;}
  function setQuality(name){tier=name==='low'?'low':'high';const count=tier==='high'?HOLOGRAM_LIMITS.highParticlesPerItem:HOLOGRAM_LIMITS.lowParticlesPerItem;for(const o of cubes.values()){o.particles.geometry.setDrawRange(0,count);o.particleCount=count;o.particles.material.uniforms.uSize.value=tier==='high'?1.2:1;}renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,tier==='high'?1.5:1));resize();samples.length=0;lastVisibleFrame=null;return tier;}
  function render(now){
   if(disposed)return;raf=requestAnimationFrame(render);const elapsed=Math.max(0,(now-last)/1000),dt=Math.min(elapsed,HOLOGRAM_LIMITS.maxFrameSeconds);last=now;
   if(!(visibilityOverride??inViewport)||document.hidden||contextLost){lastVisibleFrame=null;return;}
   if(lastVisibleFrame!==null){const measured=now-lastVisibleFrame;if(measured>0){samples.push(measured);if(samples.length>180)samples.shift();}}lastVisibleFrame=now;
   if(!paused&&!reduce)time+=dt*animationRate;localSpeed*=Math.exp(-dt*5);
   const damping=dampingForSpeed(localSpeed);
   for(const [id,o] of cubes){
    const active=visibleIds.has(id)&&(id===hovered||id===focused||id===selected),targetLift=active?1.08:0,targetFission=exploded||active?1:0;
    if(reduce||(paused&&(o.lastTargetLift!==targetLift||o.lastTargetFission!==targetFission))){o.lift={value:targetLift,velocity:0};o.fission={value:targetFission,velocity:0};}
    else if(!paused){if(o.lift.value!==targetLift||o.lift.velocity!==0)o.lift=stepSpring(o.lift,targetLift,dt,{frequency:2.6,dampingRatio:damping});if(o.fission.value!==targetFission||o.fission.velocity!==0)o.fission=stepSpring(o.fission,targetFission,dt,{frequency:2.9,dampingRatio:damping});}
    o.lastTargetLift=targetLift;o.lastTargetFission=targetFission;
    const motion=sampleObjectMotion(o.motion,time);o.motionSample=motion;
    const amount=clamp(o.fission.value+(1-o.fission.value)*motion.spread,0,1.05),depth=clamp(o.lift.value+motion.depth,0,1.30);
    if(depth!==o.appliedDepth){o.group.position.set(o.base[0],o.base[1],o.base[2]+depth);o.group.updateMatrix();o.appliedDepth=depth;}
    if(amount!==o.appliedAmount){for(const layer of o.layers){layer.group.position.set(layer.base[0]+layer.axis[0]*amount,layer.base[1]+layer.axis[1]*amount,layer.base[2]+layer.axis[2]*amount);layer.group.updateMatrix();}o.particles.material.uniforms.uAmount.value=amount;o.appliedAmount=amount;}
    if(active!==o.appliedActive){o.redMarks.forEach(mark=>{mark.visible=active;});buttons.get(id).classList.toggle('active',active);o.appliedActive=active;}
    o.particles.material.uniforms.uTime.value=time;
    o.scan.position.y=motion.scanY;o.scan.position.z=.82+amount*.47;o.scan.updateMatrix();
    o.sourceLights.forEach((light,index)=>{light.scale.y=.65+.55*(.5+.5*Math.sin(motion.phase+index*1.2));light.updateMatrix();});
   }
   const centralActive=centerHovered||centerFocused;emblemMaterial.uniforms.uActive.value=centralActive?1:0;
   if(reduce||(paused&&centralActive!==previousEmblemActive))emblemSpring={value:centralActive?.38:0,velocity:0};
   else if(!paused)emblemSpring=stepSpring(emblemSpring,centralActive?.38:0,dt,{frequency:2.7,dampingRatio:damping});
   previousEmblemActive=centralActive;emblem.position.z=.65+emblemSpring.value;
   emblem.updateMatrix();
   renderer.render(scene,camera);renderedFrames++;
  }
  function getStats(){
   scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);const q=new THREE.Quaternion(),world=new THREE.Vector3();let panelIdentityError=0,objectCount=0,instanceCount=0;
   scene.traverse(o=>{if(o.isMesh||o.isPoints)objectCount++;if(o.isInstancedMesh)instanceCount+=o.count;});
   const cubeTransforms=[...cubes.values()].map(o=>{o.group.getWorldQuaternion(q);o.group.getWorldPosition(world);const layers=o.layers.map(layer=>{const lq=layer.group.getWorldQuaternion(new THREE.Quaternion());panelIdentityError=Math.max(panelIdentityError,Math.abs(lq.x),Math.abs(lq.y),Math.abs(lq.z),Math.abs(lq.w-1));return {id:layer.id,worldQuaternion:lq.toArray(),position:layer.group.position.toArray()};});return {id:o.item.id,visible:o.group.visible,worldPosition:world.toArray(),localRotation:o.group.rotation.toArray().slice(0,3),worldQuaternion:q.toArray(),frontNormal:new THREE.Vector3(0,0,1).applyQuaternion(q).toArray(),depth:o.group.position.z-o.base[2],fission:o.fission.value,attributes:o.motion,animation:o.motionSample,layers};});
   const timing=frameSummary(samples);return {available:true,rendering:'Raster PBR and decorative point sprites',simulationTime:time,animationRate,threeRevision:THREE.REVISION,quality:tier,itemCount:items.length,visibleItemCount:[...cubes.values()].filter(o=>o.group.visible).length,particleBudget:items.length*(tier==='high'?HOLOGRAM_LIMITS.highParticlesPerItem:HOLOGRAM_LIMITS.lowParticlesPerItem),drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,points:renderer.info.render.points,objectCount,instanceCount,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,pixelRatio:renderer.getPixelRatio(),renderedFrames,...timing,visible:(visibilityOverride??inViewport)&&!document.hidden,visibilityOverride,contextLost,contextLossCount,paused,reducedMotion:reduce,selected,hovered,focused,selectedDepth:cubes.get(selected)?.group.position.z??null,hoveredDepth:cubes.get(hovered)?.group.position.z??null,cameraPosition:camera.position.toArray(),cameraWorldQuaternion:camera.getWorldQuaternion(new THREE.Quaternion()).toArray(),cameraUp:camera.up.toArray(),cameraForward:camera.getWorldDirection(new THREE.Vector3()).toArray(),cubeTransforms,maxPanelIdentityError:panelIdentityError,redMaterial:{type:red.type,srgbHex:'#'+red.color.getHexString(THREE.SRGBColorSpace),toneMapped:red.toneMapped,transparent:red.transparent,opacity:red.opacity,blending:red.blending,fog:red.fog},emblem:{worldQuaternion:emblem.getWorldQuaternion(new THREE.Quaternion()).toArray(),depth:emblem.position.z,active:emblemMaterial.uniforms.uActive.value===1,activeShaderRGB:[1,0,0],toneMapped:emblemMaterial.toneMapped},localPointerSpeed:localSpeed,pointerDamping:dampingForSpeed(localSpeed),pointerPersistence:false};
  }
  // Static descendants do not rebuild local matrices every frame. Only translated
  // cube/layer matrices and the central emblem are explicitly refreshed above.
  scene.traverse(o=>{if(o.isMesh||o.isPoints||o.isGroup){o.updateMatrix();o.matrixAutoUpdate=false;}});
  setState();setQuality(tier);render(performance.now());queueMicrotask(()=>{if(!disposed)onReady(getStats());});
  return {setState,setPaused,setExploded,setQuality,setVisibilityOverride,setAnimationRate,getStats,dispose};
 }catch(error){dispose();return fallback({canvas,container,items,onSelect,onReady,onExplodedChange,onStatus,error});}
}
