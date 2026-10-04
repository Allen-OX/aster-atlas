const NS='http://www.w3.org/2000/svg';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const project=([lon,lat])=>[(lon+180)/360*1000,(90-lat)/180*500];
const el=(tag,attrs={})=>{const node=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>node.setAttribute(k,v));return node;};

export async function createWorldMap(root) {
 const svg=root.querySelector('svg'),status=root.querySelector('[data-map-status]'),select=root.querySelector('select');
 let x=0,y=0,scale=1,selected=null,pointers=new Map(),gesture=null,dragged=false;
 let globe=null,mode='flat',tour=false,globeZoom=1,globeFailed=false,modeChosen=false;const shell=root.querySelector('.world-map-shell'),canvas=root.querySelector('#world-globe');
 let paused=matchMedia('(prefers-reduced-motion: reduce)').matches;
 function globeZoomUI(value){globeZoom=value;if(mode!=='globe')return;root.querySelector('[data-map-zoom]').textContent=`${value.toFixed(1)}×`;root.querySelector('[data-map-action="out"]').disabled=value<=1.001;root.querySelector('[data-map-action="in"]').disabled=value>=(globe?.getStats().maxZoom??6)-.001;}
 function setMode(next){if(next==='globe'&&!globe)return;mode=next;shell.dataset.mapMode=mode;canvas.hidden=mode!=='globe';svg.hidden=mode==='globe';svg.style.display=mode==='globe'?'none':'';globe?.setActive(mode==='globe');root.querySelectorAll('[data-map-mode-button]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mapModeButton===mode)));root.querySelector('[data-map-help]').textContent=mode==='globe'?'Drag to orbit · scroll or pinch to zoom · double-click a country · arrows rotate':'Drag to pan · pinch or double-click to zoom · Ctrl/⌘ + scroll';if(mode==='globe'){globeZoomUI(globeZoom);status.textContent=selected===null?'Orbital Earth ready · choose a country.':`Selected ${features[selected].properties.ADMIN}.`;}else{render();status.textContent='Flat map ready · geographic overview.';}}
 root.querySelectorAll('[data-map-mode-button]').forEach(b=>b.onclick=()=>{modeChosen=true;setMode(b.dataset.mapModeButton);});
 root.querySelectorAll('[data-globe-layer]').forEach(b=>b.onclick=()=>{const value=b.getAttribute('aria-pressed')!=='true';globe?.setLayer(b.dataset.globeLayer,value);b.setAttribute('aria-pressed',String(value));});
 root.querySelector('#globe-tour').onclick=()=>{tour=!tour;globe?.setAutoRotate(tour);root.querySelector('#globe-tour').setAttribute('aria-pressed',String(tour));root.querySelector('#globe-tour').textContent=tour?'Stop rotation':'Rotate Earth';};
 const world=el('g'),grid=el('g',{'aria-hidden':'true'}),countries=el('g');
 for(let lon=-150;lon<=150;lon+=30){const a=project([lon,-90]),b=project([lon,90]);grid.append(el('path',{d:`M${a}L${b}`}));}
 for(let lat=-60;lat<=60;lat+=30){const a=project([-180,lat]),b=project([180,lat]);grid.append(el('path',{d:`M${a}L${b}`}));}
 world.append(grid,countries);svg.append(world);grid.classList.add('map-graticule');
 const render=()=>{x=clamp(x,1000-1000*scale,0);y=clamp(y,500-500*scale,0);world.setAttribute('transform',`translate(${x} ${y}) scale(${scale})`);root.querySelector('[data-map-zoom]').textContent=`${scale.toFixed(1)}×`;root.querySelector('[data-map-action="out"]').disabled=scale<=1;root.querySelector('[data-map-action="in"]').disabled=scale>=12;svg.dataset.zoom=scale.toFixed(3);};
 function zoom(factor,point={x:500,y:250}){const next=clamp(scale*factor,1,12),ratio=next/scale;x=point.x-(point.x-x)*ratio;y=point.y-(point.y-y)*ratio;scale=next;render();}
 function reset(){x=y=0;scale=1;render();}
 function point(event){const matrix=svg.getScreenCTM();return new DOMPoint(event.clientX,event.clientY).matrixTransform(matrix.inverse());}
 let features=[];const paths=new Map();
 function choose(index,focus=true){
  const feature=features[index];if(!feature)return;
  if(selected!==null)paths.get(selected)?.classList.remove('selected');selected=index;paths.get(index).classList.add('selected');select.value=String(index);
  root.querySelector('[data-map-name]').textContent=feature.properties.ADMIN;
  root.querySelector('[data-map-continent]').textContent=feature.properties.CONTINENT;
  root.querySelector('[data-globe-name]').textContent=feature.properties.ADMIN;root.querySelector('[data-globe-continent]').textContent=feature.properties.CONTINENT;root.querySelector('[data-globe-position]').textContent=`${feature.properties.ISO_A3||feature.properties.ADM0_A3||'Map unit'} · Natural Earth overview`;globe?.selectCountry(index,focus);
  root.querySelector('[data-map-detail]').textContent='Geographic context. The current evidence snapshot has no country-level patient counts or verified care-site locations.';
  status.textContent=`Selected ${feature.properties.ADMIN}.`;
  if(focus){
   const polygons=feature.geometry.type==='Polygon'?[feature.geometry.coordinates]:feature.geometry.coordinates;
   // Focus the largest polygon; overseas components remain drawn on the map.
   const main=[...polygons].sort((a,b)=>area(b[0])-area(a[0]))[0][0].map(project);
   const xs=main.map(p=>p[0]),ys=main.map(p=>p[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
   scale=clamp(Math.min(750/Math.max(maxX-minX,5),350/Math.max(maxY-minY,5)),1,12);x=500-(minX+maxX)*.5*scale;y=250-(minY+maxY)*.5*scale;render();if(mode==='globe')globeZoomUI(globeZoom);
  }
 }
 function area(ring){return Math.abs(ring.reduce((sum,p,i)=>{const q=ring[(i+1)%ring.length];return sum+p[0]*q[1]-q[0]*p[1];},0));}
 root.querySelector('[data-map-action="in"]').onclick=()=>mode==='globe'?globe.zoom(1.3):zoom(1.5);
 root.querySelector('[data-map-action="out"]').onclick=()=>mode==='globe'?globe.zoom(1/1.3):zoom(1/1.5);
 root.querySelector('[data-map-action="reset"]').onclick=()=>{if(mode==='globe')globe.reset();else reset();};
 select.addEventListener('change',()=>{if(select.value===''){if(selected!==null)paths.get(selected)?.classList.remove('selected');selected=null;root.querySelector('[data-map-name]').textContent='A world of connections';root.querySelector('[data-map-continent]').textContent='GLOBAL VIEW';root.querySelector('[data-map-detail]').textContent='This map shows geography. No patient distribution or care-site locations are inferred from the current evidence graph.';status.textContent='Whole world view.';root.querySelector('[data-globe-name]').textContent='Select a country';root.querySelector('[data-globe-continent]').textContent='EARTH / OVERVIEW';root.querySelector('[data-globe-position]').textContent='Drag to rotate. Zoom to explore.';globe?.selectCountry(null,false);globe?.reset();reset();if(mode==='globe')globeZoomUI(globeZoom);return;}choose(Number(select.value));});
 svg.addEventListener('wheel',event=>{if(!event.ctrlKey&&!event.metaKey)return;event.preventDefault();zoom(Math.exp(-clamp(event.deltaY,-150,150)*.005),point(event));},{passive:false});
 svg.addEventListener('dblclick',event=>{event.preventDefault();zoom(1.8,point(event));});
 svg.addEventListener('keydown',event=>{
  if(['+','=','-','_','Home','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))event.preventDefault();else return;
  if(event.key==='+'||event.key==='=')zoom(1.5);else if(event.key==='-'||event.key==='_')zoom(1/1.5);else if(event.key==='Home')reset();else{x+=event.key==='ArrowLeft'?65:event.key==='ArrowRight'?-65:0;y+=event.key==='ArrowUp'?50:event.key==='ArrowDown'?-50:0;render();}
 });
 function rebase(){const p=[...pointers.values()];gesture=p.length>=2?{mid:{x:(p[0].x+p[1].x)/2,y:(p[0].y+p[1].y)/2},distance:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)}:p.length?{point:p[0]}:null;}
 svg.addEventListener('pointerdown',event=>{if(event.button!==0)return;svg.focus({preventScroll:true});svg.setPointerCapture(event.pointerId);pointers.set(event.pointerId,point(event));if(pointers.size===1){dragged=false;svg.dataset.clickCountry=event.target.closest('[data-country]')?.dataset.country??'';}else dragged=true;rebase();svg.classList.add('dragging');});
 svg.addEventListener('pointermove',event=>{
  if(!pointers.has(event.pointerId))return;const current=point(event),previous=pointers.get(event.pointerId);pointers.set(event.pointerId,current);
  if(pointers.size>=2){const p=[...pointers.values()],mid={x:(p[0].x+p[1].x)/2,y:(p[0].y+p[1].y)/2},distance=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);if(gesture.distance>0){zoom(distance/gesture.distance,gesture.mid);x+=mid.x-gesture.mid.x;y+=mid.y-gesture.mid.y;render();}dragged=true;rebase();}
  else{const dx=current.x-previous.x,dy=current.y-previous.y;if(Math.hypot(current.x-gesture.point.x,current.y-gesture.point.y)>3)dragged=true;x+=dx;y+=dy;render();}
 });
 function release(event){if(!pointers.has(event.pointerId))return;const index=svg.dataset.clickCountry;pointers.delete(event.pointerId);if(event.type==='pointerup'&&!dragged&&index!=='')choose(Number(index),false);if(pointers.size===0)svg.classList.remove('dragging');rebase();}
 svg.addEventListener('pointerup',release);svg.addEventListener('pointercancel',release);svg.addEventListener('lostpointercapture',release);
 render();
 try{
  const response=await fetch('./assets/maps/world-countries.geojson');if(!response.ok)throw new Error(`Map download ${response.status}`);
  const data=await response.json();features=data.features.sort((a,b)=>a.properties.ADMIN.localeCompare(b.properties.ADMIN));
  features.forEach((feature,index)=>{
   const polygons=feature.geometry.type==='Polygon'?[feature.geometry.coordinates]:feature.geometry.coordinates;
   const d=polygons.map(polygon=>polygon.map(ring=>ring.map((coordinate,i)=>`${i?'L':'M'}${project(coordinate).map(v=>v.toFixed(2)).join(',')}`).join('')+'Z').join('')).join('');
   const path=el('path',{d,'data-country':index,'fill-rule':'evenodd','vector-effect':'non-scaling-stroke'});const title=el('title');title.textContent=feature.properties.ADMIN;path.append(title);countries.append(path);paths.set(index,path);
   const option=document.createElement('option');option.value=String(index);option.textContent=feature.properties.ADMIN;select.append(option);
  });
  select.disabled=false;status.textContent=`${features.length} countries and map units ready.`;
  root.querySelector('[data-globe-count]').textContent=features.length;
  const suggestions=root.querySelector('#globe-country-list');features.forEach(f=>{const o=document.createElement('option');o.value=f.properties.ADMIN;suggestions.append(o);});
  const search=root.querySelector('#globe-search');function searchCountry(){const q=search.value.trim().toLocaleLowerCase();if(!q){status.textContent='Enter a country name.';return;}let index=features.findIndex(f=>f.properties.ADMIN.toLocaleLowerCase()===q);if(index<0){const candidates=features.map((f,i)=>f.properties.ADMIN.toLocaleLowerCase().includes(q)?i:-1).filter(i=>i>=0);if(candidates.length===1)index=candidates[0];}if(index<0){status.textContent='Choose a country from the suggestions.';return;}choose(index,true);}
  root.querySelector('#globe-search-form').onsubmit=e=>{e.preventDefault();searchCountry();};search.addEventListener('change',searchCountry);
  try{const {createWorldGlobe}=await import('./world-globe.js');globe=await createWorldGlobe({canvas,container:root.querySelector('.world-map-stage'),features,onSelect:index=>choose(index,false),onZoom:globeZoomUI,onTextureState:value=>{const note=root.querySelector('[data-texture-status]');note.hidden=!Object.values(value).includes('unavailable');note.textContent='Some Earth imagery could not load. Country outlines and the flat map remain available.';},onReady:()=>{status.textContent='Earth geometry ready.';}});globe.setPaused(paused);if(selected!==null)globe.selectCountry(selected,true);root.querySelector('[data-map-mode-button="globe"]').disabled=false;setMode(modeChosen?mode:'globe');}catch(error){globeFailed=true;canvas.hidden=true;status.textContent='3D Earth unavailable · flat map remains available.';console.warn('Globe unavailable',error);}

 }catch(error){status.textContent='Country outlines could not load. Reload to try again.';console.warn('World map unavailable',error);}
 const api={setPaused(value){paused=Boolean(value);globe?.setPaused(paused);},setAnimationRate(value){globe?.setAnimationRate?.(value);},dispose(){globe?.dispose();},getStats(){return {mode,globeFailed,...(globe?.getStats()||{})};}};root.querySelector('#globe-refresh').onclick=()=>{root.querySelector('#globe-stats').textContent=JSON.stringify(api.getStats(),null,2);};window.addEventListener('pagehide',()=>api.dispose(),{once:true});return api;
}
