import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { OPENAI_DISCLOSURE } from './openai-disclosure.js';

const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const app = readFileSync(new URL('./app.js', import.meta.url), 'utf8');
const winJourney = readFileSync(new URL('./win-journey.js', import.meta.url), 'utf8');
const winCss = readFileSync(new URL('./win-journey.css', import.meta.url), 'utf8');

test('the patient action journey precedes the visual atlas', () => {
  const journey = html.indexOf('id="patient-journey"');
  const atlas = html.indexOf('id="explore"');
  assert.ok(journey >= 0, 'patient journey is missing');
  assert.ok(atlas >= 0, 'atlas is missing');
  assert.ok(journey < atlas, 'patient journey must come before the atlas');
  assert.match(html, /MARIA \/ PATIENT-ORGANIZATION LEADER \/ ILLUSTRATIVE PERSONA/);
});

test('the judge journey exposes action, evidence, uncertainty, and impact landmarks', () => {
  for (const id of ['journey-action', 'journey-evidence', 'journey-uncertainty', 'journey-impact']) {
    assert.match(html, new RegExp(`id="${id}"`), `missing ${id}`);
  }
  assert.match(html, /aria-labelledby="patient-journey-title"/);
  assert.match(html, /id="journey-status"[^>]*aria-live="polite"/);
});

test('the primary journey controls are explicit and keyboard-native', () => {
  assert.match(html, /<button[^>]+id="show-opportunity"[^>]*>/);
  assert.match(html, /<button[^>]+id="inspect-journey-evidence"[^>]*>/);
  assert.match(html, /<a[^>]+href="#explore"[^>]*>Explore the evidence atlas/);
});

test('navigation numbering is unique and starts with the patient journey', () => {
  const nav = html.match(/<nav aria-label="Primary">([\s\S]*?)<\/nav>/)?.[1] || '';
  assert.match(nav, /href="#patient-journey"[^>]*>Journey<span>01<\/span>/);
  const numbers = [...nav.matchAll(/<span>(\d{2})<\/span>/g)].map(match => match[1]);
  assert.equal(new Set(numbers).size, numbers.length);
});

test('edge inspection renders the reviewed claim and its limitation', () => {
  assert.match(app, /state\.edge\.claim/);
  assert.match(app, /state\.edge\.limitations/);
  assert.match(app, /state\.edge\.reviewStatus/);
});

test('the winning journey renders validated branches and can inspect every graph claim', () => {
  assert.match(winJourney, /graph\.journey\.routes\.map/);
  assert.doesNotMatch(winJourney, /pathNodeIds/);
  assert.match(winJourney, /showEvidence\(graph\.edges\.map/);
  assert.match(html, /<dialog id="win-inspector"/);
});

test('OpenAI attribution is precise and primary mobile controls meet the 44px target', () => {
  assert.match(winJourney, /import \{ OPENAI_DISCLOSURE \} from '.\/openai-disclosure\.js'/);
  assert.match(winJourney, /esc\(OPENAI_DISCLOSURE\)/);
  assert.match(OPENAI_DISCLOSURE, /exact session model identifier is unknown/i);
  assert.match(winCss, /min-height:44px!important/);
});

test('the no-3D fallback disables the unavailable hologram expansion control', () => {
  assert.match(app, /expand\.disabled = unavailable/);
  assert.match(app, /Living Hologram unavailable; use the evidence index/);
});

test('Judge Mode presents one primary action and an honest review state', () => {
  assert.match(html, /Research proposal · expert review pending/);
  assert.equal((html.match(/class="win-primary"/g) || []).length, 1);
  assert.match(html, /id="judge-scope"/);
  assert.match(html, /aria-describedby="judge-scope"/);
  assert.match(html, /Iron–sulfur clusters are small cellular components/i);
  assert.equal((html.match(/<main(?:\s|>)/g) || []).length, 1);
});

test('the first-screen summary makes connection, limit, and action explicit', () => {
  assert.match(html, /id="journey-summary"/);
  for (const label of ['Connection', 'Important limit', 'Next action']) {
    assert.match(html, new RegExp(`>${label}<`));
  }
  assert.match(html, /data-summary="connection"/);
  assert.match(html, /data-summary="limit"/);
  assert.match(html, /data-summary="action"/);
});

test('journey steps and evidence dialog expose complete accessible names and state', () => {
  for (const [step, label] of [[1, 'Connection'], [2, 'Existing work'], [3, 'This week'], [4, 'Uncertainty'], [5, 'Milestone']]) {
    assert.match(html, new RegExp(`aria-label="Step ${step}: ${label}"`));
  }
  assert.match(html, /<dialog id="win-inspector"[^>]+aria-modal="true"/);
  assert.match(winJourney, /addEventListener\('cancel'/);
  assert.match(winJourney, /event\.target===inspector/);
  assert.match(winJourney, /Journey step/);
});

test('unknown queries clear the result, summary, action, path, and live status together', () => {
  const clearBlock = winJourney.match(/function clear\(query\)([\s\S]*?)function start/)?.[1] || '';
  assert.match(clearBlock, /\$\('win-result'\)\.hidden=true/);
  assert.match(clearBlock, /\$\('journey-summary'\)\.hidden=true/);
  assert.match(clearBlock, /\$\('journey-action'\)\.replaceChildren\(\)/);
  assert.match(clearBlock, /\$\('journey-path'\)\.replaceChildren\(\)/);
  assert.match(clearBlock, /Previous recommendations cleared/);
});

test('mobile and reduced-motion rules preserve a single-column core journey', () => {
  assert.match(winCss, /@media\(max-width:800px\)/);
  assert.match(winCss, /\.win-intro,\.win-grid\{grid-template-columns:1fr/);
  assert.match(winCss, /\.judge-summary\{grid-template-columns:1fr/);
  assert.match(winCss, /overflow-wrap:anywhere/);
  assert.match(winCss, /@media\(prefers-reduced-motion:reduce\)/);
});

test('the search action label cannot wrap at supported viewports', () => {
  assert.match(winCss, /\.win-start form button\{[^}]*white-space:nowrap/);
});

test('core disclosure summaries meet the 44px touch-target minimum', () => {
  assert.match(winCss, /\.win-journey summary\{[^}]*min-height:44px/);
});

test('evidence dialogs wrap long registry fields at 320 CSS pixels', () => {
  assert.match(winCss, /#win-inspector\{[^}]*overflow-wrap:anywhere/);
});
