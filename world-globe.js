import * as THREE from './vendor/three/three.module.js';
import {OrbitControls} from './vendor/three/addons/controls/OrbitControls.js';
import {frameSummary} from './hologram-math.js';

// Geographic outlines come only from supplied GeoJSON. Earth/cloud images are
// archival visual layers; atmosphere and stars are decorative raster effects.
const RADIUS=3,MIN_DISTANCE=3.38,DEG=Math.PI/180,TAU=Math.PI*2;
const featureCache=new WeakMap();
const wrapLongitude=longitude=>((longitude+180)%360+360)%360-180;

/** Conventional geographic axes: Greenwich faces +Z; 90°E faces +X; north +Y. */
export function lonLatToVector(lon,lat,radius=RADIUS){const a=lon*DEG,b=lat*DEG,c=Math.cos(b);return new THREE.Vector3(radius*Math.sin(a)*c,radius*Math.sin(b),radius*Math.cos(a)*c);}
export function vectorToLonLat(point){const length=Math.hypot(point.x,point.y,point.z);if(!length)return {lon:0,lat:0};return {lon:wrapLongitude(Math.atan2(point.x,point.z)/DEG),lat:Math.asin(THREE.MathUtils.clamp(point.y/length,-1,1))/DEG};}
function compileRing(coordinates){
 const source=coordinates.filter(p=>Array.isArray(p)&&Number.isFinite(p[0])&&Number.isFinite(p[1]));if(source.length<3)return null;
 // Preserve the explicit full-longitude pole edge used by Antarctic geometry.
 const pole=source.some(p=>Math.abs(p[1])>89.999),xs=source.map(p=>p[0]),spansPole=pole&&Math.max(...xs)-Math.min(...xs)>359;
 const points=[];let previous=source[0][0];
 for(const [longitude,latitude] of source){let x=longitude;if(!spansPole){while(x-previous>180)x-=360;while(x-previous< -180)x+=360;}points.push([x,latitude]);previous=x;}
 let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity,twiceArea=0,cx=0,cy=0;
 for(let i=0;i<points.length;i++){const p=points[i],q=points[(i+1)%points.length],cross=p[0]*q[1]-q[0]*p[1];minX=Math.min(minX,p[0]);maxX=Math.max(maxX,p[0]);minY=Math.min(minY,p[1]);maxY=Math.max(maxY,p[1]);twiceArea+=cross;cx+=(p[0]+q[0])*cross;cy+=(p[1]+q[1])*cross;}
 const center=Math.abs(twiceArea)>1e-8?[cx/(3*twiceArea),cy/(3*twiceArea)]:[(minX+maxX)/2,(minY+maxY)/2];
 return {points,minX,maxX,minY,maxY,area:Math.abs(twiceArea)/2,center};
}
function compileFeature(feature){
 if(featureCache.has(feature))return featureCache.get(feature);
 const geometry=feature?.geometry,polygons=geometry?.type==='Polygon'?[geometry.coordinates]:geometry?.type==='MultiPolygon'?geometry.coordinates:[];
 const compiled=polygons.map(p=>p.map(compileRing).filter(Boolean)).filter(p=>p.length);featureCache.set(feature,compiled);return compiled;
}
function insideRing(ring,lon,lat){
 if(lat<ring.minY-1e-8||lat>ring.maxY+1e-8)return false;
 const x=lon+360*Math.round(((ring.minX+ring.maxX)/2-lon)/360);if(x<ring.minX-1e-8||x>ring.maxX+1e-8)return false;
 let inside=false;const points=ring.points;
 for(let i=0,j=points.length-1;i<points.length;j=i++){
  const a=points[j],b=points[i],cross=(x-a[0])*(b[1]-a[1])-(lat-a[1])*(b[0]-a[0]);
  if(Math.abs(cross)<1e-8&&x>=Math.min(a[0],b[0])-1e-8&&x<=Math.max(a[0],b[0])+1e-8&&lat>=Math.min(a[1],b[1])-1e-8&&lat<=Math.max(a[1],b[1])+1e-8)return true;
  if((a[1]>lat)!==(b[1]>lat)&&x<(b[0]-a[0])*(lat-a[1])/(b[1]-a[1])+a[0])inside=!inside;
 }
 return inside;
}
export function pointInFeature(feature,lon,lat){
 if(!feature||typeof feature!=='object'||!Number.isFinite(lon)||!Number.isFinite(lat)||lat< -90||lat>90)return false;
 return compileFeature(feature).some(p=>insideRing(p[0],wrapLongitude(lon),lat)&&!p.slice(1).some(hole=>insideRing(hole,wrapLongitude(lon),lat)));
}
export function findCountryIndex(features,lon,lat){return features.findIndex(feature=>pointInFeature(feature,lon,lat));}
function boundaryPositions(feature,radius){
 const out=[],a=new THREE.Vector3(),b=new THREE.Vector3(),p=new THREE.Vector3(),q=new THREE.Vector3();
 for(const polygon of compileFeature(feature))for(const ring of polygon)for(let i=1;i<ring.points.length;i++){
  a.copy(lonLatToVector(...ring.points[i-1],1));b.copy(lonLatToVector(...ring.points[i],1));const angle=a.angleTo(b);if(angle<1e-10)continue;
  const steps=Math.max(1,Math.ceil(angle/(2*DEG)));
  for(let step=0;step<steps;step++){p.copy(a).lerp(b,step/steps).normalize().multiplyScalar(radius);q.copy(a).lerp(b,(step+1)/steps).normalize().multiplyScalar(radius);out.push(p.x,p.y,p.z,q.x,q.y,q.z);}
 }
 return out;
}
const ATMOSPHERE_VERTEX=`varying vec3 vNormal;varying vec3 vView;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vNormal=normalize(normalMatrix*normal);vView=-mv.xyz;gl_Position=projectionMatrix*mv;}`;
const ATMOSPHERE_FRAGMENT=`varying vec3 vNormal;varying vec3 vView;void main(){float rim=pow(1.-abs(dot(normalize(vNormal),normalize(vView))),3.4);gl_FragColor=vec4(vec3(.17,.43,.88),rim*.62);}`;

export function createWorldGlobe({canvas,container,features,onSelect=()=>{},onReady=()=>{},onZoom=()=>{},onTextureState=()=>{}}={}){
 if(!canvas||!container||!Array.isArray(features))throw new TypeError('A canvas, container, and GeoJSON feature array are required.');
 const owned=new Set(),listeners=[],observers=[],frames=[];let renderer,scene,camera,controls,raf=0,disposed=false;
 let active=true,inViewport=true,contextLost=false,paused=false,autoRotate=false,animationRate=1,selected=null,goal=null,time=0,last=performance.now(),lastVisible=null,renderedFrames=0,homeDistance=9.1,lastZoom=null,lastPick=null;
 const textureState={day:'loading',clouds:'loading'},textureDimensions={day:null,clouds:null};
 const layers={borders:true,clouds:true,graticule:false,atmosphere:true,stars:true,dayTexture:true};
 const media=window.matchMedia('(prefers-reduced-motion: reduce)');let reduce=media.matches;
 const originalTabIndex=canvas.getAttribute('tabindex'),originalLabel=canvas.getAttribute('aria-label');
 const own=r=>(owned.add(r),r),listen=(target,type,fn,options)=>{target.addEventListener(type,fn,options);listeners.push(()=>target.removeEventListener(type,fn,options));};
 function dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(raf);observers.forEach(o=>o.disconnect());listeners.forEach(fn=>fn());controls?.dispose();owned.forEach(r=>r.dispose());renderer?.dispose();scene?.clear();if(originalTabIndex===null)canvas.removeAttribute('tabindex');else canvas.setAttribute('tabindex',originalTabIndex);if(originalLabel===null)canvas.removeAttribute('aria-label');else canvas.setAttribute('aria-label',originalLabel);}
 try{
  renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});renderer.setClearColor(0x030810,1);renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
  scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(42,1,.1,100);
  const homeDirection=lonLatToVector(12,20,1);camera.position.copy(homeDirection).multiplyScalar(homeDistance);
  controls=new OrbitControls(camera,canvas);controls.target.set(0,0,0);controls.enablePan=false;controls.enableDamping=!reduce;controls.dampingFactor=.07;controls.minDistance=MIN_DISTANCE;controls.maxDistance=homeDistance;controls.minPolarAngle=.018;controls.maxPolarAngle=Math.PI-.018;controls.autoRotate=false;controls.autoRotateSpeed=.35;
  const sunlight=new THREE.DirectionalLight(0xfff5df,3.0);sunlight.position.set(-6,5,9);scene.add(sunlight);
  scene.add(new THREE.AmbientLight(0xb9cde4,.55));const rimLight=new THREE.DirectionalLight(0x8cbbff,.22);rimLight.position.set(4,-2,-5);scene.add(rimLight);
  // Geometry rotation aligns the texture's Greenwich meridian with +Z.
  const earthGeometry=own(new THREE.SphereGeometry(RADIUS,96,64));earthGeometry.rotateY(-Math.PI/2);
  const earthMaterial=own(new THREE.MeshStandardMaterial({color:0x315875,metalness:.06,roughness:.88}));
  const earth=new THREE.Mesh(earthGeometry,earthMaterial);earth.name='Earth surface — archival NASA composite';scene.add(earth);
  const cloudGeometry=own(new THREE.SphereGeometry(RADIUS+.023,72,48));cloudGeometry.rotateY(-Math.PI/2);
  const cloudMaterial=own(new THREE.MeshStandardMaterial({color:0xffffff,transparent:true,opacity:.83,roughness:1,metalness:0,depthWrite:false,alphaTest:.015}));
  const clouds=new THREE.Mesh(cloudGeometry,cloudMaterial);clouds.name='Archival cloud composite — illustrative motion';clouds.visible=false;clouds.renderOrder=1;scene.add(clouds);
  const atmosphere=new THREE.Mesh(own(new THREE.SphereGeometry(RADIUS+.105,64,48)),own(new THREE.ShaderMaterial({vertexShader:ATMOSPHERE_VERTEX,fragmentShader:ATMOSPHERE_FRAGMENT,side:THREE.BackSide,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false})));atmosphere.name='Approximate atmospheric rim';scene.add(atmosphere);
  const borderData=features.map(f=>boundaryPositions(f,RADIUS+.013));const allBorders=[];for(const data of borderData)for(const coordinate of data)allBorders.push(coordinate);
  const borderGeometry=own(new THREE.BufferGeometry());borderGeometry.setAttribute('position',new THREE.Float32BufferAttribute(allBorders,3));
  const borders=new THREE.LineSegments(borderGeometry,own(new THREE.LineBasicMaterial({color:0xc0d5dc,transparent:true,opacity:.36,depthWrite:false,toneMapped:false})));borders.name='Supplied country boundaries';borders.renderOrder=2;scene.add(borders);
  let selectedGeometry=own(new THREE.BufferGeometry());selectedGeometry.setAttribute('position',new THREE.Float32BufferAttribute([],3));
  const selection=new THREE.LineSegments(selectedGeometry,own(new THREE.LineBasicMaterial({color:0xe4fcff,toneMapped:false,transparent:true,opacity:.98,depthWrite:false})));selection.name='Selected country boundary';selection.renderOrder=3;scene.add(selection);
  const selectionGlow=new THREE.Points(selectedGeometry,own(new THREE.PointsMaterial({color:0x87d5ff,size:.035,sizeAttenuation:true,transparent:true,opacity:.18,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false})));selectionGlow.renderOrder=3;scene.add(selectionGlow);
  const gridData=[];
  function gridRing(points){for(let i=1;i<points.length;i++)gridData.push(...points[i-1].toArray(),...points[i].toArray());}
  for(let lat=-60;lat<=60;lat+=30)gridRing(Array.from({length:181},(_,i)=>lonLatToVector(i*2-180,lat,RADIUS+.009)));
  for(let lon=-180;lon<180;lon+=30)gridRing(Array.from({length:91},(_,i)=>lonLatToVector(lon,i*2-90,RADIUS+.009)));
  const graticule=new THREE.LineSegments(own(new THREE.BufferGeometry().setFromPoints(Array.from({length:gridData.length/3},(_,i)=>new THREE.Vector3(...gridData.slice(i*3,i*3+3))))),own(new THREE.LineBasicMaterial({color:0x83a9c5,transparent:true,opacity:.17,depthWrite:false,toneMapped:false})));graticule.visible=false;graticule.renderOrder=2;scene.add(graticule);
  let seed=44291;const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};const starPositions=[];
  for(let i=0;i<500;i++){const a=random()*TAU,y=random()*2-1,r=Math.sqrt(1-y*y),distance=32+random()*12;starPositions.push(Math.cos(a)*r*distance,y*distance,Math.sin(a)*r*distance);}
  const starGeometry=own(new THREE.BufferGeometry());starGeometry.setAttribute('position',new THREE.Float32BufferAttribute(starPositions,3));const stars=new THREE.Points(starGeometry,own(new THREE.PointsMaterial({color:0xd0dce8,size:.048,transparent:true,opacity:.57,depthWrite:false,toneMapped:false})));stars.name='Decorative background stars — not a catalog';scene.add(stars);
  let dayTexture=null,cloudTexture=null;
  function loadTexture(url,kind,onLoaded){
   const loader=new THREE.TextureLoader();const texture=loader.load(url,loaded=>{
    if(disposed){loaded.dispose();return;}
    const maxWidth=Math.min(kind==='day'?4096:2048,renderer.capabilities.maxTextureSize);const source=loaded.image;
    if(source.width>maxWidth){const resized=document.createElement('canvas');resized.width=maxWidth;resized.height=Math.round(source.height*maxWidth/source.width);const context=resized.getContext('2d');if(context){context.drawImage(source,0,0,resized.width,resized.height);loaded.image=resized;}}
    loaded.colorSpace=kind==='day'?THREE.SRGBColorSpace:THREE.NoColorSpace;loaded.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());loaded.needsUpdate=true;textureDimensions[kind]=[loaded.image.width,loaded.image.height];textureState[kind]='loaded';onLoaded(loaded);onTextureState({...textureState});
   },undefined,()=>{if(!disposed){textureState[kind]='unavailable';onTextureState({...textureState});}});own(texture);
  }
  loadTexture('./assets/maps/earth-day.jpg','day',loaded=>{dayTexture=loaded;if(layers.dayTexture){earthMaterial.map=dayTexture;earthMaterial.color.setHex(0xffffff);earthMaterial.needsUpdate=true;}});
  loadTexture('./assets/maps/earth-clouds.jpg','clouds',loaded=>{cloudTexture=loaded;cloudMaterial.alphaMap=cloudTexture;cloudMaterial.needsUpdate=true;clouds.visible=layers.clouds;});
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),spherical=new THREE.Spherical(),offset=new THREE.Vector3(),focusRotation=new THREE.Quaternion(),focusStep=new THREE.Quaternion();
  let down=null,multiTouch=false;const pointers=new Set();
  function pickAt(x,y){pointer.set(x,y);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObject(earth,false)[0];if(!hit)return null;const coordinates=vectorToLonLat(hit.point),index=findCountryIndex(features,coordinates.lon,coordinates.lat);lastPick={...coordinates,countryIndex:index<0?null:index};if(index>=0){selectCountry(index,false);onSelect(index,coordinates);}return lastPick;}
  listen(canvas,'pointerdown',event=>{pointers.add(event.pointerId);if(pointers.size>1){multiTouch=true;return;}multiTouch=false;down={x:event.clientX,y:event.clientY};});
  listen(canvas,'pointerup',event=>{pointers.delete(event.pointerId);if(active&&down&&!multiTouch&&Math.hypot(event.clientX-down.x,event.clientY-down.y)<5){const r=canvas.getBoundingClientRect();pickAt((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);}if(!pointers.size){down=null;multiTouch=false;}});
  listen(canvas,'dblclick',event=>{if(!active)return;event.preventDefault();const r=canvas.getBoundingClientRect();const picked=pickAt((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);if(picked?.countryIndex!==null&&picked?.countryIndex!==undefined)selectCountry(picked.countryIndex,true);});
  listen(canvas,'pointercancel',event=>{pointers.delete(event.pointerId);down=null;});
  function notifyZoom(){const value=homeDistance/camera.position.length();if(lastZoom===null||Math.abs(value-lastZoom)>.002){lastZoom=value;onZoom(value);}}
  listen(controls,'change',()=>notifyZoom());listen(controls,'start',()=>{goal=null;});
  canvas.setAttribute('tabindex','0');canvas.setAttribute('aria-label','Interactive Earth. Arrow keys rotate; plus and minus zoom; Enter selects the centered country; Home resets.');
  listen(canvas,'keydown',event=>{
   if(!active||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','_','Home','Enter',' '].includes(event.key))return;event.preventDefault();goal=null;
   if(event.key==='+'||event.key==='=')zoom(1.25);else if(event.key==='-'||event.key==='_')zoom(.8);else if(event.key==='Home')reset();else if(event.key==='Enter'||event.key===' ')pickAt(0,0);else{
    spherical.setFromVector3(camera.position);if(event.key==='ArrowLeft')spherical.theta-=.12;if(event.key==='ArrowRight')spherical.theta+=.12;if(event.key==='ArrowUp')spherical.phi-=.10;if(event.key==='ArrowDown')spherical.phi+=.10;spherical.phi=THREE.MathUtils.clamp(spherical.phi,.018,Math.PI-.018);camera.position.setFromSpherical(spherical);controls.update();notifyZoom();
   }
  });
  function resize(){const rect=container.getBoundingClientRect(),width=Math.max(1,rect.width),height=Math.max(1,rect.height),ratio=homeDistance/Math.max(MIN_DISTANCE,camera.position.length());camera.aspect=width/height;const halfVertical=THREE.MathUtils.degToRad(camera.fov/2),halfHorizontal=Math.atan(Math.tan(halfVertical)*camera.aspect);homeDistance=RADIUS/Math.sin(Math.min(halfVertical,halfHorizontal))*1.09;controls.maxDistance=homeDistance;camera.position.normalize().multiplyScalar(THREE.MathUtils.clamp(homeDistance/ratio,MIN_DISTANCE,homeDistance));camera.updateProjectionMatrix();renderer.setSize(width,height,false);if(goal)goal.distance=THREE.MathUtils.clamp(goal.distance,MIN_DISTANCE,homeDistance);controls.update();notifyZoom();}
  const ro=new ResizeObserver(resize);observers.push(ro);ro.observe(container);const io=new IntersectionObserver(entries=>{inViewport=entries[0]?.isIntersecting??true;last=performance.now();lastVisible=null;},{threshold:0});observers.push(io);io.observe(container);
  listen(media,'change',event=>{reduce=event.matches;controls.enableDamping=!reduce;});listen(document,'visibilitychange',()=>{last=performance.now();lastVisible=null;});
  listen(canvas,'webglcontextlost',event=>{event.preventDefault();contextLost=true;lastVisible=null;});listen(canvas,'webglcontextrestored',()=>{contextLost=false;last=performance.now();lastVisible=null;if(dayTexture)dayTexture.needsUpdate=true;if(cloudTexture)cloudTexture.needsUpdate=true;});
  function selectCountry(index,focus=true){
   if(index===null||index===undefined){selected=null;selection.visible=selectionGlow.visible=false;canvas.setAttribute('aria-label','Interactive Earth. Arrow keys rotate; plus and minus zoom; Enter selects the centered country; Home resets.');return true;}
   if(!Number.isInteger(index)||index<0||index>=features.length)return false;selected=index;
   const coordinates=borderData[index].map(value=>value*(RADIUS+.027)/(RADIUS+.013));const next=own(new THREE.BufferGeometry());next.setAttribute('position',new THREE.Float32BufferAttribute(coordinates,3));selection.geometry=next;selectionGlow.geometry=next;owned.delete(selectedGeometry);selectedGeometry.dispose();selectedGeometry=next;selection.visible=selectionGlow.visible=layers.borders;
   const name=features[index].properties?.ADMIN||features[index].properties?.name||'Country';canvas.setAttribute('aria-label',`${name} selected. Arrow keys rotate; plus and minus zoom; Enter selects centered country; Home resets.`);
   if(focus){const polygon=compileFeature(features[index]).reduce((largest,p)=>!largest||p[0].area>largest[0].area?p:largest,null);if(polygon){const ring=polygon[0],longitude=wrapLongitude(ring.center[0]),latitude=THREE.MathUtils.clamp(ring.center[1],-80,80);const angularSpan=Math.max((ring.maxX-ring.minX)*Math.max(.22,Math.cos(latitude*DEG)),ring.maxY-ring.minY);const distance=THREE.MathUtils.clamp(3.7+angularSpan*.052,MIN_DISTANCE,homeDistance);goal={direction:lonLatToVector(longitude,latitude,1),distance};}}
   return true;
  }
  function zoom(factor){if(!Number.isFinite(factor)||factor<=0)return;goal=null;const distance=THREE.MathUtils.clamp(camera.position.length()/factor,MIN_DISTANCE,homeDistance);camera.position.normalize().multiplyScalar(distance);controls.update();notifyZoom();}
  function reset(){goal={direction:homeDirection.clone(),distance:homeDistance};if(reduce){camera.position.copy(homeDirection).multiplyScalar(homeDistance);goal=null;controls.update();notifyZoom();}}
  function setActive(value){active=Boolean(value);controls.enabled=active;last=performance.now();lastVisible=null;if(active)resize();return active;}
  function setPaused(value){paused=Boolean(value);if(!paused){reduce=false;controls.enableDamping=true;}last=performance.now();lastVisible=null;return paused;}
  function setAutoRotate(value){autoRotate=Boolean(value);return autoRotate;}
  function setAnimationRate(value){animationRate=THREE.MathUtils.clamp(Number.isFinite(value)?value:1,.5,2);return animationRate;}
  function setLayer(name,value){if(!Object.hasOwn(layers,name))return false;layers[name]=Boolean(value);borders.visible=layers.borders;selection.visible=selectionGlow.visible=layers.borders&&selected!==null;graticule.visible=layers.graticule;atmosphere.visible=layers.atmosphere;stars.visible=layers.stars;clouds.visible=layers.clouds&&textureState.clouds==='loaded';earthMaterial.map=layers.dayTexture?dayTexture:null;earthMaterial.color.setHex(layers.dayTexture&&dayTexture?0xffffff:0x315875);earthMaterial.needsUpdate=true;return layers[name];}
  function render(now){
   if(disposed)return;raf=requestAnimationFrame(render);const dt=Math.min(Math.max(0,(now-last)/1000),.06);last=now;if(!active||!inViewport||document.hidden||contextLost){lastVisible=null;return;}
   if(lastVisible!==null){const interval=now-lastVisible;if(interval>0){frames.push(interval);if(frames.length>180)frames.shift();}}lastVisible=now;
   if(!paused&&!reduce)time+=dt*animationRate;clouds.rotation.y=time*.0035;
   if(goal){const alpha=reduce?1:1-Math.exp(-dt*4.6);offset.copy(camera.position).normalize();focusRotation.setFromUnitVectors(offset,goal.direction);focusStep.identity().slerp(focusRotation,alpha);offset.applyQuaternion(focusStep).normalize();const distance=THREE.MathUtils.lerp(camera.position.length(),goal.distance,alpha);camera.position.copy(offset).multiplyScalar(distance);if(offset.distanceTo(goal.direction)<.001&&Math.abs(distance-goal.distance)<.01){camera.position.copy(goal.direction).multiplyScalar(goal.distance);goal=null;}}
   // Camera-oriented studio light keeps every selected geography readable; this is not a live solar terminator.
   sunlight.position.copy(camera.position).multiplyScalar(1.2);sunlight.position.y+=3;
   controls.autoRotate=autoRotate&&!paused&&!reduce&&!goal;controls.autoRotateSpeed=.35*animationRate;controls.update(dt);renderer.render(scene,camera);renderedFrames++;notifyZoom();
  }
  function getStats(){return {available:!contextLost,featureCount:features.length,selectedCountryIndex:selected,selectedCountry:selected===null?null:features[selected]?.properties?.ADMIN,earthRadius:RADIUS,zoom:homeDistance/camera.position.length(),minZoom:1,maxZoom:homeDistance/MIN_DISTANCE,cameraDistance:camera.position.length(),cameraPosition:camera.position.toArray(),layers:{...layers},textureState:{...textureState},textureDimensions:{...textureDimensions},drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,points:renderer.info.render.points,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,renderedFrames,...frameSummary(frames),active,visible:active&&inViewport&&!document.hidden,paused,reducedMotion:reduce,autoRotate,animationRate,contextLost,lastPick,cloudRotation:clouds.rotation.y,rendering:'Textured raster Earth with approximate atmosphere and decorative stars',imagery:'Archival NASA composites; not live weather or population data'};}
  resize();controls.update();render(performance.now());queueMicrotask(()=>{if(!disposed)onReady(getStats());});
  return {selectCountry,zoom,reset,setActive,setPaused,setAutoRotate,setAnimationRate,setLayer,getStats,dispose};
 }catch(error){dispose();throw error;}
}
