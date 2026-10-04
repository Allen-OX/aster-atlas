const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const clone = value => structuredClone(value);
const freeze = value => {
  if (record(value) || Array.isArray(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
};

export const GATE_STATES = freeze(['pass', 'fail', 'pending-external', 'not-run']);

const proofErrors = (evidence, prefix = 'Evidence') => {
  const errors = [];
  for (const field of ['kind', 'path', 'recordedAt', 'buildFingerprint']) {
    if (!nonempty(evidence?.[field])) errors.push(`${prefix} is missing ${field}.`);
  }
  return errors;
};

export function evaluateReleaseGate(gate) {
  const source = record(gate) ? clone(gate) : {};
  const reasons = [];
  const evidence = Array.isArray(source.evidence) ? source.evidence.map(clone) : [];
  let state = GATE_STATES.includes(source.state) ? source.state : 'fail';

  if (!nonempty(source.id)) reasons.push('Gate id is required.');
  if (!nonempty(source.dimension)) reasons.push('Gate dimension is required.');
  if (!GATE_STATES.includes(source.state)) reasons.push(`Unsupported state: ${String(source.state)}.`);

  if (state === 'pass') {
    if (evidence.length === 0) reasons.push('Pass requires evidence.');
    evidence.forEach((item, index) => reasons.push(...proofErrors(item, `Evidence ${index + 1}`)));
    if (source.external === true && !evidence.some(item => item?.completion === true)) {
      reasons.push('External pass requires completion evidence.');
    }
  }

  if (state === 'pending-external' && evidence.some(item => item?.completion === true)) {
    reasons.push('Pending external gate cannot contain a completion claim.');
  }

  if (reasons.length) state = 'fail';
  return { id: nonempty(source.id) ? source.id : '', state, reasons, evidence };
}

export function validateReleaseManifest(manifest) {
  const errors = [];
  if (!record(manifest)) return { valid: false, errors: ['Manifest must be an object.'] };
  if (manifest.schemaVersion !== 1) errors.push('schemaVersion must be 1.');
  if (!record(manifest.build) || !nonempty(manifest.build.fingerprint)) errors.push('Build fingerprint is required.');
  if (!record(manifest.build) || !nonempty(manifest.build.generatedAt)) errors.push('Build generatedAt is required.');
  if (!Array.isArray(manifest.gates)) return { valid: false, errors: [...errors, 'Manifest gates must be an array.'] };

  const ids = new Set();
  for (const [index, gate] of manifest.gates.entries()) {
    if (!record(gate)) {
      errors.push(`Gate ${index + 1} must be an object.`);
      continue;
    }
    if (!nonempty(gate.id)) errors.push(`Gate ${index + 1} id is required.`);
    else if (ids.has(gate.id)) errors.push(`Duplicate gate id: ${gate.id}.`);
    else ids.add(gate.id);
    if (!nonempty(gate.dimension)) errors.push(`Gate ${gate.id || index + 1} dimension is required.`);
    if (!GATE_STATES.includes(gate.state)) errors.push(`Gate ${gate.id || index + 1} has unsupported state: ${String(gate.state)}.`);

    const evaluated = evaluateReleaseGate(gate);
    errors.push(...evaluated.reasons.map(reason => `Gate ${gate.id || index + 1}: ${reason}`));

    if (gate.state === 'pass' && nonempty(manifest.build?.fingerprint)) {
      for (const [proofIndex, evidence] of (gate.evidence || []).entries()) {
        if (evidence?.buildFingerprint !== manifest.build.fingerprint) {
          errors.push(`Gate ${gate.id || index + 1} evidence ${proofIndex + 1} fingerprint does not match the manifest build.`);
        }
      }
    }
  }
  return { valid: errors.length === 0, errors };
}

export function summarizeRelease(manifest) {
  const totals = Object.fromEntries(GATE_STATES.map(state => [state, 0]));
  const dimensions = {};
  const priority = { pass: 0, 'not-run': 1, 'pending-external': 2, fail: 3 };
  const buildFingerprint = manifest?.build?.fingerprint;

  for (const gate of Array.isArray(manifest?.gates) ? manifest.gates : []) {
    const evaluated = evaluateReleaseGate(gate);
    if (evaluated.state === 'pass' && evaluated.evidence.some(item => item.buildFingerprint !== buildFingerprint)) {
      evaluated.state = 'fail';
      evaluated.reasons.push('Evidence fingerprint does not match the manifest build.');
    }
    totals[evaluated.state] += 1;
    const dimension = nonempty(gate?.dimension) ? gate.dimension : 'invalid';
    const current = dimensions[dimension];
    if (!current || priority[evaluated.state] > priority[current]) dimensions[dimension] = evaluated.state;
  }

  const required = (manifest?.gates || []).filter(gate => gate?.required !== false);
  const ready = required.length > 0 && required.every(gate => {
    const evaluated = evaluateReleaseGate(gate);
    return evaluated.state === 'pass'
      && evaluated.evidence.every(item => item.buildFingerprint === buildFingerprint);
  });
  return { ready, dimensions, totals };
}

export function buildReleaseManifest(input) {
  const value = clone(input);
  return freeze(value);
}
