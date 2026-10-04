import { nodes, edges, sources } from './data.js';

export const byId = new Map(nodes.map(node => [node.id, node]));
export const sourceById = new Map(sources.map(source => [source.id, source]));

export function validateGraph() {
  const errors = [];
  const ids = new Set();
  for (const node of nodes) {
    if (ids.has(node.id)) errors.push(`Duplicate node: ${node.id}`);
    ids.add(node.id);
    if (!node.sourceIds?.length) errors.push(`Uncited node: ${node.id}`);
    for (const id of node.sourceIds || []) if (!sourceById.has(id)) errors.push(`Missing source ${id}`);
  }
  for (const edge of edges) {
    if (!byId.has(edge.from) || !byId.has(edge.to)) errors.push(`Broken edge: ${edge.id}`);
    if (!edge.sourceIds?.length) errors.push(`Uncited edge: ${edge.id}`);
    for (const id of edge.sourceIds || []) if (!sourceById.has(id)) errors.push(`Missing source ${id}`);
  }
  return errors;
}

const aliases = {
  frda: ['friedreich', 'frda', 'friedreich ataxia'],
  at: ['ataxia telangiectasia', 'a-t', 'atm disease'],
  fxn: ['fxn', 'frataxin'],
  atm: ['atm'],
  ataxia: ['ataxia', 'coordination', 'movement'],
  cardio: ['cardiomyopathy', 'heart', 'cardiac'],
  unified: ['unified', 'study', 'trial', 'natural history', 'registry'],
  fara: ['fara', 'community', 'patient organization', 'research alliance'],
  'fxn-gaa': ['gaa repeat', 'repeat expansion', 'fxn expansion', 'variant'],
  'fes-mechanism': ['iron sulfur', 'iron-sulfur', 'frataxin deficiency', 'mitochondrial mechanism', 'mechanism'],
  'fara-assets': ['research tools', 'research resources', 'models', 'repositories', 'datasets', 'assets'],
  lynch: ['david lynch', 'principal investigator', 'researcher', 'investigator']
};

export function searchNodes(query) {
  const q = query.trim().toLowerCase();
  if (!q) return nodes;
  const words = q.split(/\s+/).filter(Boolean);
  return nodes.map(node => {
    const phrases = [node.label.toLowerCase(), node.short.toLowerCase(), ...(aliases[node.id] || [])];
    const exact = phrases.some(phrase => phrase === q) ? 10 : 0;
    const starts = phrases.some(phrase => phrase.startsWith(q)) ? 4 : 0;
    const matches = words.reduce((score, word) => score + (phrases.some(phrase => phrase.includes(word)) ? 2 : 0), 0);
    return { node, score: exact + starts + matches };
  }).filter(result => result.score > 0).sort((a, b) => b.score - a.score || a.node.label.localeCompare(b.node.label)).map(result => result.node);
}

export function connections(nodeId) {
  return edges.filter(edge => edge.from === nodeId || edge.to === nodeId).map(edge => ({
    edge,
    other: byId.get(edge.from === nodeId ? edge.to : edge.from)
  }));
}

export function parseRouteQuery(question) {
  const normalized = question.toLowerCase().replace(/[^a-z0-9-]+/g, ' ').trim();
  const haystack = ` ${normalized} `;
  const matches = nodes.flatMap(node => [node.label.toLowerCase(), node.short.toLowerCase(), ...(aliases[node.id] || [])]
    .map(phrase => phrase.replace(/[^a-z0-9-]+/g, ' ').trim())
    .filter(phrase => phrase.length > 1)
    .map(phrase => ({ id: node.id, phrase, start: haystack.indexOf(` ${phrase} `) }))
    .filter(item => item.start >= 0));
  matches.sort((a,b) => b.phrase.length - a.phrase.length || a.start - b.start);
  const selected = [];
  for (const item of matches) {
    const end = item.start + item.phrase.length + 2;
    if (selected.some(other => other.id === item.id || (item.start < other.end && end > other.start))) continue;
    selected.push({ ...item, end });
    if (selected.length === 2) break;
  }
  return selected.length === 2 ? selected.sort((a,b) => a.start - b.start).map(item => item.id) : null;
}

export function shortestPath(start, end) {
  if (!byId.has(start) || !byId.has(end)) return null;
  if (start === end) return { nodes: [start], edges: [] };
  // A documented link costs 1; a cross-source inference costs 4.
  const frontier = [{ id: start, cost: 0, nodes: [start], edges: [] }];
  const best = new Map([[start, 0]]);
  while (frontier.length) {
    frontier.sort((a,b) => a.cost - b.cost || a.nodes.length - b.nodes.length);
    const current = frontier.shift();
    if (current.id === end) return { nodes: current.nodes, edges: current.edges };
    if (current.cost > best.get(current.id)) continue;
    for (const { edge, other } of connections(current.id)) {
      const cost = current.cost + (edge.strength === 'cross-source inference' ? 4 : 1);
      if (cost >= (best.get(other.id) ?? Infinity)) continue;
      best.set(other.id, cost);
      frontier.push({ id: other.id, cost, nodes: [...current.nodes, other.id], edges: [...current.edges, edge] });
    }
  }
  return null;
}
