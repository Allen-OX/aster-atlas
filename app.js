import { checkedAt, nodes, edges, sources, journeys } from './data.js';
import { byId, sourceById, searchNodes, connections, shortestPath, parseRouteQuery, validateGraph } from './logic.js';

const errors = validateGraph();
if (errors.length) throw new Error(`Atlas data invalid: ${errors.join('; ')}`);

const $ = selector => document.querySelector(selector);
const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const state = { selected: 'frda', filter: 'all', query: '', journey: 'family', edge: null };

function sourceMarkup(sourceIds) {
  return [...new Set(sourceIds)].map(id => {
    const source = sourceById.get(id);
    return `<a class="source-link" href="${source.url}" target="_blank" rel="noopener noreferrer"><span>${escapeHtml(source.publisher)}<br>${escapeHtml(source.title)}</span><span aria-hidden="true">↗</span></a>`;
  }).join('');
}

function selectNode(id, edgeId = null, shouldScroll = false) {
  if (!byId.has(id)) return;
  state.selected = id;
  state.edge = edgeId ? edges.find(edge => edge.id === edgeId) : null;
  renderAll();
  if (shouldScroll) $('#explore').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
}

function renderInspector() {
  const node = byId.get(state.selected);
  const linked = connections(node.id);
  const evidence = state.edge ? `<div class="evidence-note"><strong>${escapeHtml(state.edge.relation.toUpperCase())} · ${escapeHtml(state.edge.strength.toUpperCase())}</strong><br>${escapeHtml(state.edge.note)}</div>` : '';
  const edgeSources = state.edge?.sourceIds || [];
  $('#inspector').innerHTML = `<div class="inspector-kicker"><span>ENTITY / ${escapeHtml(node.id.toUpperCase())}</span><span class="inspector-type">${escapeHtml(node.type.toUpperCase())}</span></div><h3>${escapeHtml(node.label)}</h3><p class="inspector-summary">${escapeHtml(node.summary)}</p><p class="inspector-detail">${escapeHtml(node.detail)}</p>${evidence}<h4>CONNECTED EVIDENCE · ${linked.length.toString().padStart(2,'0')}</h4>${linked.map(({edge,other}) => `<button class="connection-btn" data-node="${other.id}" data-edge="${edge.id}">${escapeHtml(other.label)} <span aria-hidden="true">↗</span><small>${escapeHtml(edge.relation)} · ${escapeHtml(edge.strength)}</small></button>`).join('')}<h4>ORIGINAL SOURCES</h4>${sourceMarkup([...node.sourceIds, ...edgeSources])}<p class="inspector-detail">Snapshot checked ${checkedAt}. Open live sources for current study details.</p>`;
  $('#inspector').querySelectorAll('.connection-btn').forEach(button => button.addEventListener('click', () => selectNode(button.dataset.node, button.dataset.edge)));
}

function filteredNodes() {
  return searchNodes(state.query).filter(node => state.filter === 'all' || node.type === state.filter);
}

function renderList() {
  const found = filteredNodes();
  $('#result-count').textContent = `${String(found.length).padStart(2, '0')} RESULTS`;
  $('#entity-list').innerHTML = found.length ? found.map(node => `<button class="entity-row ${node.id === state.selected ? 'active' : ''}" data-node="${node.id}"><span>${escapeHtml(node.label)}</span><small>${escapeHtml(node.type.toUpperCase())} ↗</small></button>`).join('') : '<p style="padding:14px;color:#9fb9bd;font-size:12px">No matching entity in this eight-node prototype.</p>';
  $('#entity-list').querySelectorAll('[data-node]').forEach(button => button.addEventListener('click', () => selectNode(button.dataset.node)));
}

function renderGraph() {
  const graph = $('#graph');
  const width = graph.clientWidth;
  const height = graph.clientHeight;
  const point = node => ({ x: width * (0.5 + node.x * .42), y: height * (.49 - node.y * .39) });
  const found = new Set(filteredNodes().map(node => node.id));
  $('#edge-layer').setAttribute('viewBox', `0 0 ${width} ${height}`);
  $('#edge-layer').innerHTML = edges.map(edge => {
    const a = point(byId.get(edge.from)); const b = point(byId.get(edge.to));
    const active = edge.from === state.selected || edge.to === state.selected;
    const faded = !found.has(edge.from) || !found.has(edge.to);
    return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${active ? '#8dffe2' : '#658e97'}" stroke-opacity="${faded ? '.09' : active ? '.75' : '.31'}" stroke-width="${active ? '1.6' : '1'}" ${edge.strength === 'cross-source inference' ? 'stroke-dasharray="4 5"' : ''}/>`;
  }).join('');
  $('#graph-nodes').innerHTML = nodes.map(node => {
    const p = point(node);
    return `<button class="graph-node ${node.id === state.selected ? 'active' : ''} ${found.has(node.id) ? '' : 'dim'}" style="left:${p.x}px;top:${p.y}px" data-type="${node.type}" data-node="${node.id}" aria-label="Inspect ${escapeHtml(node.label)}">${escapeHtml(node.short)}</button>`;
  }).join('');
  $('#graph-nodes').querySelectorAll('[data-node]').forEach(button => button.addEventListener('click', () => selectNode(button.dataset.node)));
}

function renderJourney() {
  document.querySelectorAll('.path-tab').forEach(button => {const active = button.dataset.journey === state.journey; button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active));});
  $('#journey-steps').innerHTML = journeys[state.journey].map((step, index) => `<button class="journey-card" data-index="${index}"><span>STEP ${String(index + 1).padStart(2, '0')} / 03 <span aria-hidden="true">↗</span></span><h3>${escapeHtml(step.title)}</h3><p>${escapeHtml(step.body)}</p></button>`).join('');
  $('#journey-steps').querySelectorAll('button').forEach(button => button.addEventListener('click', () => {
    const step = journeys[state.journey][Number(button.dataset.index)];
    const edge = step.edgeId ? edges.find(item => item.id === step.edgeId) : null;
    selectNode(step.nodeId || edge.from, step.edgeId || null, true);
  }));
}

function renderSources() {
  $('#source-list').innerHTML = sources.map((source, index) => `<article class="source-card"><div class="source-meta">SOURCE ${String(index + 1).padStart(2,'0')} / ${escapeHtml(source.kind.toUpperCase())}</div><h3>${escapeHtml(source.title)}</h3><p>${escapeHtml(source.publisher)} · ${escapeHtml(source.updated)}</p><a href="${source.url}" target="_blank" rel="noopener noreferrer">OPEN ORIGINAL SOURCE ↗</a></article>`).join('');
}

function renderAll() { renderInspector(); renderList(); renderGraph(); }
$('#search').addEventListener('input', event => { state.query = event.target.value; renderList(); renderGraph(); });
document.querySelectorAll('.filter').forEach(button => button.addEventListener('click', () => { state.filter = button.dataset.type; document.querySelectorAll('.filter').forEach(item => item.classList.toggle('active', item === button)); renderList(); renderGraph(); }));
document.querySelectorAll('.path-tab').forEach(button => button.addEventListener('click', () => { state.journey = button.dataset.journey; renderJourney(); }));
document.addEventListener('keydown', event => { if (event.key === '/' && !['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) { event.preventDefault(); $('#search').focus(); } });
window.addEventListener('resize', renderGraph);
renderSources(); renderJourney(); renderAll();

const routeOptions = nodes.map(node => `<option value="${node.id}">${escapeHtml(node.label)}</option>`).join('');
$('#route-start').innerHTML = routeOptions;
$('#route-end').innerHTML = routeOptions;
$('#route-start').value = 'fxn';
$('#route-end').value = 'atm';
function renderRoute() {
  const route = shortestPath($('#route-start').value, $('#route-end').value);
  const container = $('#route-result');
  if (!route) { container.textContent = 'No source-backed route exists in this prototype.'; return; }
  const inferred = route.edges.filter(edge => edge.strength === 'cross-source inference').length;
  const sourceCount = new Set(route.edges.flatMap(edge => edge.sourceIds)).size;
  container.innerHTML = `<p>${route.edges.length} CONNECTIONS · ${sourceCount} ORIGINAL SOURCES · ${inferred ? `${inferred} INFERRED LINK${inferred === 1 ? '' : 'S'}` : 'DOCUMENTED ROUTE'}</p><div class="route-chain">${route.nodes.map((id, index) => `<button data-node="${id}" data-edge="${index ? route.edges[index-1].id : ''}" title="${index ? escapeHtml(route.edges[index-1].relation) : 'Start'}">${escapeHtml(byId.get(id).short)}</button>${index < route.edges.length ? `<span title="${escapeHtml(route.edges[index].relation)}" aria-label="${escapeHtml(route.edges[index].relation)}">— ${escapeHtml(route.edges[index].relation)} →</span>` : ''}`).join('')}</div>`;
  container.querySelectorAll('button').forEach(button => button.addEventListener('click', () => selectNode(button.dataset.node, button.dataset.edge || null)));
}
$('#route-button').addEventListener('click', renderRoute);
function askAtlas() {
  const pair = parseRouteQuery($('#route-question').value);
  if (!pair) { $('#question-status').textContent = 'Name two entities in this prototype, such as FXN and ATM.'; return; }
  $('#route-start').value = pair[0];
  $('#route-end').value = pair[1];
  $('#question-status').textContent = `Resolved ${byId.get(pair[0]).label} → ${byId.get(pair[1]).label}. The route below uses cited graph connections.`;
  renderRoute();
}
$('#ask-button').addEventListener('click', askAtlas);
$('#route-question').addEventListener('keydown', event => { if (event.key === 'Enter') askAtlas(); });
renderRoute();

// Living Hologram: a fixed Cartesian camera projects real z displacement without
// rotating the interface. Pointer speed changes spring damping only, locally.
const canvas = $('#scene');
const ctx = canvas.getContext('2d');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const holo = $('#hologram');
const bodies = nodes.map((node, index) => ({ node, z: node.z, vz: 0, size: node.type === 'disease' ? 9 : 5.5, phase: index * 1.73 }));
let hover = null, pointer = { x: -999, y: -999, lastX: -999, lastY: -999, lastT: 0, speed: 0 };
let time = 0;
function sizeCanvas() { const dpr = Math.min(devicePixelRatio || 1, 2); const box = canvas.getBoundingClientRect(); canvas.width = Math.round(box.width * dpr); canvas.height = Math.round(box.height * dpr); ctx.setTransform(dpr,0,0,dpr,0,0); }
function project(x,y,z,w,h) { const perspective = 1 + z * .15; return { x:w/2 + x * w*.36*perspective + z*12, y:h/2 - y*h*.34*perspective - z*9 }; }
function cube(x,y,size,alpha,accent='#8dffe2') {
  ctx.save(); ctx.strokeStyle=accent; ctx.globalAlpha=alpha; ctx.lineWidth=.8;
  const s=size; const points=[[x,y-s],[x+s,y-s*.45],[x+s,y+s*.45],[x,y+s],[x-s,y+s*.45],[x-s,y-s*.45]];
  ctx.beginPath(); points.forEach(([px,py],i)=>i?ctx.lineTo(px,py):ctx.moveTo(px,py)); ctx.closePath(); ctx.moveTo(x,y); ctx.lineTo(x,y+s); ctx.moveTo(x,y); ctx.lineTo(x+s,y-s*.45); ctx.moveTo(x,y); ctx.lineTo(x-s,y-s*.45); ctx.stroke(); ctx.restore();
}
function draw() {
  if (!ctx) return;
  const w=canvas.clientWidth,h=canvas.clientHeight;
  ctx.clearRect(0,0,w,h);
  ctx.strokeStyle='#85e8d228';ctx.lineWidth=.7;
  for(let i=-3;i<=3;i++){ctx.beginPath();ctx.moveTo(w/2+i*37,15);ctx.lineTo(w/2+i*37,h-10);ctx.stroke();ctx.beginPath();ctx.moveTo(12,h/2+i*31);ctx.lineTo(w-12,h/2+i*31);ctx.stroke();}
  const center=project(0,0,0,w,h);
  ctx.beginPath();ctx.arc(center.x,center.y,72,0,Math.PI*2);ctx.strokeStyle='#8dffe23b';ctx.stroke();
  const points=new Map();
  for(const body of bodies){
    const target=body.node.z+(hover===body.node.id?0.82:state.selected===body.node.id?0.28:0);
    if(reduceMotion.matches){body.z=target;body.vz=0;}else{const damping=Math.min(.86,.68+pointer.speed*.004);body.vz=(body.vz+(target-body.z)*.055)*damping;body.z+=body.vz;}
    points.set(body.node.id,project(body.node.x,body.node.y,body.z,w,h));
  }
  for(const edge of edges){const a=points.get(edge.from),b=points.get(edge.to);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=edge.from===hover||edge.to===hover?'#8dffe2a8':'#8dffe23b';ctx.lineWidth=edge.from===hover||edge.to===hover?1.3:.7;ctx.stroke();}
  for(const body of bodies){
    const p=points.get(body.node.id),selected=body.node.id===state.selected,hot=body.node.id===hover;
    const color=body.node.type==='disease'?'#8dffe2':body.node.type==='gene'?'#89bffc':body.node.type==='phenotype'?'#ffba9e':'#e8dc9a';
    if(selected||hot){ctx.beginPath();ctx.arc(p.x,p.y,body.size*2.3,0,Math.PI*2);ctx.strokeStyle=color+'8c';ctx.lineWidth=.7;ctx.stroke();}
    cube(p.x,p.y,body.size*(hot?1.24:1),hot?1:.83,color);
    // The selected cube separates into eight small volumes, then condenses back.
    if(selected&&!reduceMotion.matches){for(let i=0;i<8;i++){const angle=i*Math.PI/4;const wave=.5+.5*Math.sin(time*.033+i*.63);const radius=body.size*(1.8+wave*1.7);cube(p.x+Math.cos(angle)*radius,p.y+Math.sin(angle)*radius*.65,1.7,.25+.45*wave,color);}}
  }
  // Source particles move from the selected entity toward the evidence inspector.
  if(!reduceMotion.matches){const origin=points.get(state.selected);for(let i=0;i<18;i++){const progress=(time*.004+i/18)%1;const curve=Math.sin(progress*Math.PI);ctx.fillStyle=`rgba(141,255,226,${(1-progress)*.47})`;ctx.fillRect(origin.x+progress*(w-origin.x)-curve*14,origin.y-progress*origin.y+Math.sin(i*2.1)*curve*17,1.5,1.5);}}
  if(!reduceMotion.matches){time++;requestAnimationFrame(draw);}
}
function hitTest(x,y){const w=canvas.clientWidth,h=canvas.clientHeight;let winner=null,best=21;for(const body of bodies){const p=project(body.node.x,body.node.y,body.z,w,h);const distance=Math.hypot(x-p.x,y-p.y);if(distance<best){best=distance;winner=body.node.id;}}return winner;}
holo.addEventListener('pointermove',event=>{const rect=canvas.getBoundingClientRect();const x=event.clientX-rect.left,y=event.clientY-rect.top;const now=performance.now();if(pointer.lastT){const dt=Math.max(1,now-pointer.lastT);const velocity=Math.hypot(x-pointer.lastX,y-pointer.lastY)/dt;pointer.speed=pointer.speed*.75+velocity*.25;}pointer={...pointer,x,y,lastX:x,lastY:y,lastT:now};hover=hitTest(x,y);canvas.style.cursor=hover?'pointer':'default';});
holo.addEventListener('pointerleave',()=>{hover=null;pointer.speed=0;});
holo.addEventListener('click',()=>{if(hover)selectNode(hover,null,true);});
reduceMotion.addEventListener('change',()=>{if(reduceMotion.matches)draw();else requestAnimationFrame(draw);});
sizeCanvas();window.addEventListener('resize',()=>{sizeCanvas();if(reduceMotion.matches)draw();});draw();
