import test from 'node:test';
import assert from 'node:assert/strict';
import { validateGraph, searchNodes, shortestPath, connections, parseRouteQuery } from './logic.js';

test('every entity and connection has an existing public source', () => assert.deepEqual(validateGraph(), []));
test('search resolves disease, gene, symptom and registry language', () => {
  assert.equal(searchNodes('friedreich')[0].id, 'frda');
  assert.equal(searchNodes('frataxin')[0].id, 'fxn');
  assert.equal(searchNodes('heart')[0].id, 'cardio');
  assert.equal(searchNodes('natural history')[0].id, 'unified');
});
test('a cross-condition route preserves the intermediate phenotype', () => {
  const route = shortestPath('fxn','atm');
  assert.equal(route.nodes[0], 'fxn');
  assert.equal(route.nodes.at(-1), 'atm');
  assert.ok(route.nodes.includes('ataxia'));
  assert.ok(route.edges.every(edge => edge.sourceIds.length));
  assert.ok(connections('frda').some(({edge}) => edge.strength === 'cross-source inference'));
});
test('unknown entities never yield a path', () => assert.equal(shortestPath('unknown','frda'), null));
test('a plain-language route question resolves two distinct entities', () => {
  assert.deepEqual(parseRouteQuery('How is FXN connected to ATM?'), ['fxn', 'atm']);
  assert.deepEqual(parseRouteQuery('Friedreich ataxia and ATM'), ['frda', 'atm']);
  assert.equal(parseRouteQuery('What is FXN?'), null);
});
