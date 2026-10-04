import { initWinJourney } from './win-journey.js';
let worldMapController=null;
import { checkedAt, nodes, edges, sources, journeys, caseStudy, openAiExtractionRecords } from './data.js';
import { byId, sourceById, searchNodes, connections, shortestPath, parseRouteQuery, validateGraph } from './logic.js';
import { calculateAcceleration, validateCaseStudy } from './judge-journey.js';

const errors = validateGraph();
if (errors.length) throw new Error(`Atlas data invalid: ${errors.join('; ')}`);
const caseStudyErrors = validateCaseStudy(caseStudy, { nodes, edges, sources });
if (caseStudyErrors.length) throw new Error(`Judge journey invalid: ${caseStudyErrors.join('; ')}`);

const $ = selector => document.querySelector(selector);
const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const filterButtons = [...document.querySelectorAll('button[data-type]')];
const state = { selected: 'frda', filter: 'all', query: '', journey: 'family', edge: null, route: null, paused: reducedMotion.matches, exploded: false };
let atlasScene = null;
let sceneFailed = false;
let sceneRuntimeStatus = "loading";
let livingHologram = null;
let hologramExploded = false;
let hologramQuality = "high";
let hologramPaused = reducedMotion.matches;
let hologramRuntimeStatus = "loading";
let sceneStats = null;

function sourceMarkup(sourceIds) {
  return [...new Set(sourceIds)].map(id => {
    const source = sourceById.get(id);
    return `<a class="source-link" href="${source.url}" target="_blank" rel="noopener noreferrer"><span>${escapeHtml(source.publisher)}<br>${escapeHtml(source.title)}</span><span aria-hidden="true">↗</span></a>`;
  }).join('');
}

// DOM selections survive rebuilding the selected panel. When a connection moves
// to a new entity, its heading becomes the next keyboard reading position.
function replaceWithFocus(container, markup) {
  const focused = document.activeElement;
  const ownedFocus = container.contains(focused);
  const key = ownedFocus ? { node: focused.dataset.node, edge: focused.dataset.edge, href: focused.getAttribute('href'), index: focused.dataset.index } : null;
  container.innerHTML = markup;
  if (!ownedFocus) return;
  const replacement = [...container.querySelectorAll('button,a')].find(element => {
    if (key.node) return element.dataset.node === key.node && (element.dataset.edge || '') === (key.edge || '');
    if (key.href) return element.getAttribute('href') === key.href;
    if (key.index !== undefined) return element.dataset.index === key.index;
    return false;
  });
  const fallback = replacement || container.querySelector('h3') || container;
  if (!replacement) fallback.tabIndex = -1;
  fallback.focus({ preventScroll: true });
}

function filteredNodes() {
  return searchNodes(state.query).filter(node => state.filter === 'all' || node.type === state.filter);
}

function renderFilters() {
  filterButtons.forEach(button => {
    const active = button.dataset.type === state.filter;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

function revealNodes(ids) {
  const visible = new Set(filteredNodes().map(node => node.id));
  if (ids.every(id => visible.has(id))) return;
  state.filter = 'all'; state.query = '';
  $('#search').value = '';
  renderFilters();
}

function selectNode(id, edgeId = null, shouldScroll = false) {
  if (!byId.has(id)) return;
  const evidenceChanged = state.selected !== id || (state.edge?.id || null) !== edgeId;
  state.selected = id;
  state.edge = edgeId ? edges.find(edge => edge.id === edgeId) || null : null;
  revealNodes([id]);
  renderAll();
  if (evidenceChanged) $('#inspector').scrollTop = 0;
  if (shouldScroll) {
    const heading = $('#inspector h3');
    if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
    (innerWidth <= 700 ? $('#inspector') : ($('#explore') || $('#graph'))).scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start' });
  }
}

function renderInspector() {
  const node = byId.get(state.selected);
  const linked = connections(node.id);
  const evidence = state.edge ? `<div class="evidence-note"><strong>${escapeHtml(state.edge.relation.toUpperCase())} · ${escapeHtml(state.edge.strength.toUpperCase())}</strong><span>${escapeHtml(state.edge.evidenceType)} · ${escapeHtml(state.edge.evidenceStatus)} · ${escapeHtml(state.edge.reviewStatus)}</span><p>${escapeHtml(state.edge.claim)}</p><small>LIMITATION · ${escapeHtml(state.edge.limitations)}</small></div>` : '';
  const edgeSources = state.edge?.sourceIds || [];
  replaceWithFocus($('#inspector'), `<div class="inspector-kicker"><span>ENTITY / ${escapeHtml(node.id.toUpperCase())}</span><span class="inspector-type">${escapeHtml(node.type.toUpperCase())}</span></div><h3>${escapeHtml(node.label)}</h3><p class="attribute-readout">${escapeHtml(readableType(node.type))} · ${node.sourceIds.length} original source${node.sourceIds.length === 1 ? "" : "s"} · ${linked.length} connection${linked.length === 1 ? "" : "s"}</p><p class="inspector-summary">${escapeHtml(node.summary)}</p><p class="inspector-detail">${escapeHtml(node.detail)}</p>${evidence}<h4>CONNECTED EVIDENCE · ${String(linked.length).padStart(2, '0')}</h4>${linked.map(({ edge, other }) => `<button class="connection-btn" data-node="${other.id}" data-edge="${edge.id}">${escapeHtml(other.label)} <span aria-hidden="true">↗</span><small>${escapeHtml(edge.relation)} · ${escapeHtml(edge.strength)}</small></button>`).join('')}<h4>ORIGINAL SOURCES</h4>${sourceMarkup([...node.sourceIds, ...edgeSources])}<p class="inspector-detail">Snapshot checked ${checkedAt}. Open live sources for current study details.</p>`);
  $('#inspector').querySelectorAll('.connection-btn').forEach(button => button.addEventListener('click', () => selectNode(button.dataset.node, button.dataset.edge)));
}

function renderList() {
  const found = filteredNodes();
  $('#result-count').textContent = `${String(found.length).padStart(2, '0')} RESULTS`;
  replaceWithFocus($('#entity-list'), found.length ? found.map(node => `<button class="entity-row ${node.id === state.selected ? 'active' : ''}" data-node="${node.id}" aria-pressed="${node.id === state.selected}"><span>${escapeHtml(node.label)}</span><small>${escapeHtml(node.type.toUpperCase())} ↗</small></button>`).join('') : '<p class="empty-state">No matching entity in this reviewed prototype.</p>');
  $('#entity-list').querySelectorAll('[data-node]').forEach(button => button.addEventListener('click', () => selectNode(button.dataset.node, null, true)));
}

function renderSceneStatus() {
  const visibleIds = new Set(filteredNodes().map(node => node.id));
  const partiallyFiltered = state.route?.nodes.some(id => !visibleIds.has(id));
  const status = $('#scene-status');
  if (status) {
    status.textContent = sceneRuntimeStatus === 'error' ? '3D recovery failed. Use the evidence index below.' : sceneRuntimeStatus === 'context-lost' ? 'Graphics interrupted. Waiting for recovery; the evidence index remains available.' : sceneRuntimeStatus === 'restoring' ? 'Restoring the spatial atlas…' : sceneFailed ? '3D is unavailable. Explore every entity and source in the index.' : !atlasScene ? 'Preparing the spatial atlas…' : `${visibleIds.size} / ${nodes.length} entities · ${state.paused ? 'motion paused' : 'spatial atlas'}${partiallyFiltered ? ' · route partly filtered' : state.route?.edges.length ? ` · ${state.route.edges.length}-link route highlighted` : ''}`;
    status.dataset.state = sceneFailed ? 'fallback' : ['context-lost', 'restoring', 'error'].includes(sceneRuntimeStatus) ? sceneRuntimeStatus : atlasScene ? 'ready' : 'loading';
    if (sceneStats) status.title = Object.entries(sceneStats).map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`).join(' · ');
  }
  const caption = $('#selected-caption');
  if (caption) caption.textContent = `${byId.get(state.selected).label} · ${state.edge ? `${state.edge.relation} · ${state.edge.strength}` : readableType(byId.get(state.selected).type)}`;
}

function readableType(type) {
  return ({ disease: 'condition', gene: 'gene', variant: 'variant class', mechanism: 'disease mechanism', phenotype: 'phenotype', study: 'study', organization: 'patient and research organization', investigator: 'investigator', asset: 'research asset collection' })[type] || type;
}

function syncScene() {
  livingHologram?.setState({ selected: state.selected, visibleIds: new Set(filteredNodes().map(node => node.id)) });
  atlasScene?.setState({ selected: state.selected, visibleIds: new Set(filteredNodes().map(node => node.id)), routeEdgeIds: new Set(state.route?.edges.map(edge => edge.id) || []) });
  renderSceneStatus();
}

function renderJourney() {
  document.querySelectorAll('button[data-journey]').forEach(button => {
    const active = button.dataset.journey === state.journey;
    button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active));
  });
  replaceWithFocus($('#journey-steps'), journeys[state.journey].map((step, index, steps) => `<button class="journey-card" data-index="${index}"><span>STEP ${String(index + 1).padStart(2, '0')} / ${String(steps.length).padStart(2, '0')} <span aria-hidden="true">↗</span></span><h3>${escapeHtml(step.title)}</h3><p>${escapeHtml(step.body)}</p></button>`).join(''));
  $('#journey-steps').querySelectorAll('button').forEach(button => button.addEventListener('click', () => {
    const step = journeys[state.journey][Number(button.dataset.index)];
    const edge = step.edgeId ? edges.find(item => item.id === step.edgeId) : null;
    selectNode(step.nodeId || edge.from, step.edgeId || null, true);
  }));
}

function renderSources() {
  $('#source-list').innerHTML = sources.map((source, index) => `<article class="source-card"><div class="source-meta">SOURCE ${String(index + 1).padStart(2, '0')} / ${escapeHtml(source.kind.toUpperCase())}</div><h3>${escapeHtml(source.title)}</h3><p>${escapeHtml(source.publisher)} · ${escapeHtml(source.updated)}</p><a href="${source.url}" target="_blank" rel="noopener noreferrer">OPEN ORIGINAL SOURCE ↗</a></article>`).join('');
}

function renderPatientJourney() { initWinJourney(); }

function renderAll() { renderInspector(); renderList(); syncScene(); }
$('#search').addEventListener('input', event => { state.query = event.target.value; renderList(); syncScene(); });
filterButtons.forEach(button => button.addEventListener('click', () => { state.filter = button.dataset.type; renderFilters(); renderList(); syncScene(); }));
document.querySelectorAll('button[data-journey]').forEach(button => button.addEventListener('click', () => { state.journey = button.dataset.journey; renderJourney(); }));
document.addEventListener('keydown', event => {
  if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName) && !document.activeElement.isContentEditable) {
    event.preventDefault(); $('#search').focus();
  }
});

const routeOptions = nodes.map(node => `<option value="${node.id}">${escapeHtml(node.label)}</option>`).join('');
$('#route-start').innerHTML = routeOptions; $('#route-end').innerHTML = routeOptions;
$('#route-start').value = 'frda'; $('#route-end').value = 'lynch';
function renderRoute({ reveal = false } = {}) {
  state.route = shortestPath($('#route-start').value, $('#route-end').value);
  const route = state.route, container = $('#route-result');
  if (!route) { replaceWithFocus(container, '<p>No source-backed route exists in this prototype.</p>'); syncScene(); return; }
  if (reveal) { revealNodes(route.nodes); renderList(); }
  const inferred = route.edges.filter(edge => edge.strength === 'cross-source inference').length;
  const sourceCount = new Set(route.edges.flatMap(edge => edge.sourceIds)).size;
  const evidenceLabel = !route.edges.length ? 'SAME ENTITY · NO CONNECTIONS TRAVERSED' : `${route.edges.length} CONNECTIONS · ${sourceCount} ORIGINAL SOURCES · ${inferred ? `${inferred} INFERRED LINK${inferred === 1 ? '' : 'S'}` : 'CITED ROUTE'}`;
  replaceWithFocus(container, `<p>${evidenceLabel}</p><div class="route-chain">${route.nodes.map((id, index) => `<button data-node="${id}" data-edge="${index ? route.edges[index - 1].id : ''}" title="${index ? escapeHtml(route.edges[index - 1].relation) : 'Start'}">${escapeHtml(byId.get(id).short)}</button>${index < route.edges.length ? `<span title="${escapeHtml(route.edges[index].relation)}" aria-label="${escapeHtml(route.edges[index].relation)}">— ${escapeHtml(route.edges[index].relation)} →</span>` : ''}`).join('')}</div>`);
  const sceneLink = document.createElement('a');
  sceneLink.className = 'route-view-link'; sceneLink.href = '#explore';
  sceneLink.textContent = 'View this route in the constellation ↑';
  container.append(sceneLink);
  container.querySelectorAll('button').forEach(button => button.addEventListener('click', () => selectNode(button.dataset.node, button.dataset.edge || null, true)));
  syncScene();
}
function renderManualRoute() { $('#question-status').textContent = ''; renderRoute({ reveal: true }); }
$('#route-button').addEventListener('click', renderManualRoute);
$('#route-start').addEventListener('change', renderManualRoute);
$('#route-end').addEventListener('change', renderManualRoute);
function askAtlas() {
  const pair = parseRouteQuery($('#route-question').value);
  if (!pair) {
    state.route = null;
    $('#question-status').textContent = 'Name two entities in this prototype, such as FRDA and UNIFIED.';
    replaceWithFocus($('#route-result'), '<p>No route was resolved for this question.</p>');
    syncScene();
    return;
  }
  $('#route-start').value = pair[0]; $('#route-end').value = pair[1];
  $('#question-status').textContent = `Resolved ${byId.get(pair[0]).label} → ${byId.get(pair[1]).label}. The route below uses cited graph connections.`;
  renderRoute({ reveal: true });
}
$('#ask-button').addEventListener('click', askAtlas);
$('#route-question').addEventListener('keydown', event => { if (event.key === 'Enter') askAtlas(); });


function renderSceneControls() {
  const paused = $('#scene-pause'), layers = $('#scene-layers');
  if (paused) { paused.textContent = state.paused ? 'Resume motion' : 'Pause motion'; paused.setAttribute('aria-pressed', String(state.paused)); }
  if (layers) { layers.textContent = state.exploded ? 'Condense layers' : 'Unfold layers'; layers.setAttribute('aria-pressed', String(state.exploded)); }
  ['#scene-reset', '#scene-in', '#scene-out', '#scene-pause', '#scene-layers'].forEach(id => { const button = $(id); if (button) button.disabled = !atlasScene || ['context-lost','restoring','error'].includes(sceneRuntimeStatus); });
  renderSceneStatus();
}
$('#scene-reset')?.addEventListener('click', () => { atlasScene?.reset(); sceneStats=atlasScene?.getStats()||sceneStats; renderSceneStatus(); });
$('#scene-in')?.addEventListener('click', () => atlasScene?.zoom(0.8));
$('#scene-out')?.addEventListener('click', () => atlasScene?.zoom(1.25));
$('#scene-pause')?.addEventListener('click', () => { state.paused = !state.paused; atlasScene?.setPaused(state.paused); sceneStats = atlasScene?.getStats() || sceneStats; renderSceneControls(); });
$('#scene-layers')?.addEventListener('click', () => { state.exploded = !state.exploded; atlasScene?.setExploded(state.exploded); renderSceneControls(); });
reducedMotion.addEventListener('change', event => { if (event.matches) { state.paused = true; atlasScene?.setPaused(true); } renderSceneControls(); });

renderPatientJourney(); renderFilters(); renderSources(); renderJourney(); renderAll(); renderRoute(); renderSceneControls();

async function initializeScene() {
  try {
    if (new URLSearchParams(location.search).get('no3d') === '1') throw new Error('3D disabled for local fallback verification.');
    const { createAtlasScene } = await import('./atlas-scene.js');
    const canvas = $('#atlas-scene'), container = $('#graph'), labels = $('#spatial-labels');
    if (!canvas || !container || !labels) throw new Error('Spatial atlas elements are unavailable.');
    atlasScene = createAtlasScene({
      canvas, container, labels, nodes, edges,
      onSelect: id => selectNode(id, null, innerWidth <= 700),
      onEdge: id => { const edge = edges.find(item => item.id === id); if (edge) selectNode(edge.to, edge.id, innerWidth <= 700); },
      onReady: stats => { sceneStats = stats; renderSceneStatus(); },
      onStatus: update => { sceneRuntimeStatus = update.status; renderSceneControls(); },
    });
    atlasScene.setAnimationRate?.(Number($("#motion-speed").value)); atlasScene.setPaused(state.paused); atlasScene.setExploded(state.exploded); atlasScene.setSuspended?.(Boolean($('#hologram-dialog')?.open));
    syncScene(); renderSceneControls();
  } catch (error) {
    atlasScene?.dispose?.(); atlasScene = null; sceneFailed = true;
    $('#graph')?.classList.add('scene-unavailable');
    const fallback = document.createElement('div');
    fallback.className = 'graph-fallback';
    const explanation = document.createElement('p');
    explanation.textContent = 'The 3D constellation is unavailable. Every entity, connection, and original source remains available below.';
    const indexLink = document.createElement('a'); indexLink.href = '#entity-index'; indexLink.textContent = 'Explore the entity index ↓';
    fallback.append(explanation, indexLink); $('#graph')?.append(fallback);
    renderSceneControls();
    console.warn('Spatial atlas unavailable; entity index and evidence inspector remain available.', error);
  }
}
initializeScene();

function updateHologramControls() {
  $('#hologram-unfold').textContent = hologramExploded ? 'Reassemble' : 'Unfold all';
  $('#hologram-unfold').setAttribute('aria-pressed', String(hologramExploded));
  $('#hologram-quality').textContent = hologramQuality === 'high' ? 'High detail' : 'Light detail';
  $('#hologram-quality').setAttribute('aria-pressed', String(hologramQuality === 'low'));
  $('#hologram-pause').textContent = hologramPaused ? 'Resume' : 'Pause';
  $('#hologram-pause').setAttribute('aria-pressed', String(hologramPaused));
  const unavailable = !livingHologram || ['context-lost','restoring','error','fallback'].includes(hologramRuntimeStatus);
  document.querySelectorAll('.hologram-toolbar button').forEach(button => button.disabled = unavailable);
  const expand = $('#hologram-expand');
  expand.disabled = unavailable;
  if (unavailable) {
    expand.textContent = '3D unavailable';
    expand.setAttribute('aria-label', 'Living Hologram unavailable; use the evidence index');
  } else if (expand.textContent === '3D unavailable') {
    expand.textContent = 'Expand ↗';
    expand.setAttribute('aria-label', 'Expand Living Hologram');
  }
  if (livingHologram && hologramRuntimeStatus === 'ready') $('#hologram-status').textContent = hologramPaused ? 'Motion paused · select a cube to inspect' : 'Animating attributes · hover to unfold';
}
function updateHologramMetrics() {
  if (!livingHologram) return;
  $('#hologram-metrics').textContent = JSON.stringify(livingHologram.getStats(), null, 2);
}
$('#hologram-unfold').addEventListener('click', () => { hologramExploded = !hologramExploded; livingHologram?.setExploded(hologramExploded); updateHologramControls(); updateHologramMetrics(); });
$('#hologram-quality').addEventListener('click', () => { hologramQuality = hologramQuality === 'high' ? 'low' : 'high'; livingHologram?.setQuality(hologramQuality); updateHologramControls(); updateHologramMetrics(); });
$('#hologram-pause').addEventListener('click', () => { hologramPaused = !hologramPaused; livingHologram?.setPaused(hologramPaused); updateHologramControls(); updateHologramMetrics(); });
$('.hologram-metrics').addEventListener('toggle', updateHologramMetrics);
reducedMotion.addEventListener('change', event => { if (event.matches) { hologramPaused = true; livingHologram?.setPaused(true); updateHologramControls(); } });
async function initializeHologram() {
  updateHologramControls();
  try {
    if (new URLSearchParams(location.search).get('no3d') === '1') throw new Error('Fallback verification');
    const { createLivingHologram } = await import('./living-hologram.js');
    livingHologram = createLivingHologram({
      canvas: $('#living-canvas'), container: $('#living-hologram'), labels: $('#living-labels'),
      items: nodes.map(node => ({ id: node.id, label: node.short || node.label, sourceCount: node.sourceIds.length, type: node.type, connectionCount: connections(node.id).length })),
      onSelect: id => { const wasExpanded = hologramDialog.open; if (wasExpanded) closeHologramDialog(); selectNode(id, null, wasExpanded || innerWidth <= 700); },
      onReady: () => updateHologramMetrics(),
      onExplodedChange: value => { hologramExploded = value; updateHologramControls(); },
      onStatus: update => { hologramRuntimeStatus = update.status || (update.available === false ? "fallback" : update.contextLost ? "context-lost" : "ready"); $('#hologram-status').textContent = update.message || update.status; updateHologramControls(); },
    });
    hologramRuntimeStatus = livingHologram.getStats().available === false ? "fallback" : "ready";
    if (hologramRuntimeStatus === "fallback") $("#hologram-status").textContent = "3D unavailable · select an evidence label or use the index";
    livingHologram.setAnimationRate?.(Number($("#motion-speed").value)); livingHologram.setPaused(hologramPaused);
    syncScene(); updateHologramControls(); updateHologramMetrics();
  } catch (error) {
    livingHologram?.dispose(); livingHologram = null;
    $('#hologram-status').textContent = '3D unavailable · use the evidence index below';
    $('#living-hologram').classList.add('hologram-unavailable');
    const link = document.createElement('a'); link.href = '#entity-index'; link.textContent = `Open all ${nodes.length} evidence objects ↗`; $('#living-hologram').append(link);
    updateHologramControls();
    console.warn('Hologram unavailable; evidence index available.', error);
  }
}
initializeHologram();

const hologramModule = $('.hologram-module');
const hologramHome = document.createComment('Living Hologram home');
hologramModule.before(hologramHome);
const hologramDialog = $('#hologram-dialog');
function closeHologramDialog() {
  if (hologramDialog.open) hologramDialog.close();
  atlasScene?.setSuspended?.(false);
  livingHologram?.setVisibilityOverride?.(null);
  hologramHome.after(hologramModule);
  $('#hologram-expand').textContent = 'Expand ↗';
  $('#hologram-expand').setAttribute('aria-label', 'Expand Living Hologram');
  $('#hologram-expand').focus({preventScroll:true});
}
$('#hologram-expand').addEventListener('click', () => {
  if (hologramDialog.open) { closeHologramDialog(); return; }
  hologramDialog.append(hologramModule);
  $('#hologram-expand').textContent = 'Return ↙';
  $('#hologram-expand').setAttribute('aria-label', 'Close expanded Living Hologram');
  hologramDialog.showModal();
  atlasScene?.setSuspended?.(true);
  livingHologram?.setVisibilityOverride?.(true);
});
hologramDialog.addEventListener('cancel', event => { event.preventDefault(); closeHologramDialog(); });

$('#living-hologram').addEventListener('click', event => { if (event.target.closest('a[href="#entity-index"]') && hologramDialog.open) closeHologramDialog(); });

let animationRate = 1;
function syncGlobalMotion() {
  const stopped=state.paused && hologramPaused;
  $('#motion-all').textContent=stopped?'Animate all':'Pause all';
  $('#motion-all').setAttribute('aria-pressed',String(stopped));
}
$('#motion-all').addEventListener('click',()=>{
  const stop=!(state.paused&&hologramPaused);
  state.paused=stop;hologramPaused=stop;worldMapController?.setPaused(stop);
  atlasScene?.setPaused(stop);livingHologram?.setPaused(stop);
  sceneStats=atlasScene?.getStats()||sceneStats;renderSceneControls();updateHologramControls();updateHologramMetrics();syncGlobalMotion();
});
$('#motion-speed').addEventListener('change',event=>{worldMapController?.setAnimationRate(Number(event.target.value));
  animationRate=Number(event.target.value);
  atlasScene?.setAnimationRate?.(animationRate);livingHologram?.setAnimationRate?.(animationRate);
});
$('#scene-pause').addEventListener('click',syncGlobalMotion);
$('#hologram-pause').addEventListener('click',syncGlobalMotion);
reducedMotion.addEventListener('change',syncGlobalMotion);
syncGlobalMotion();

import { createWorldMap } from './world-map.js';
createWorldMap(document.querySelector('#world-map')).then(controller=>{worldMapController=controller;controller.setPaused(state.paused&&hologramPaused);controller.setAnimationRate(Number($('#motion-speed').value));});
