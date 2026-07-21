const test = require('node:test');
const assert = require('node:assert/strict');
const { validateEvidence, assertTransition } = require('../domain/evidenceWorkflow');

test('evidence has a content hash and custody event', () => {
  const hash = 'a'.repeat(64);
  assert.throws(() => validateEvidence({ sha256: hash }), /sourceUri/);
  assert.equal(validateEvidence({ sha256: hash, sourceUri: 's3://vault/item', capturedAt: '2026-01-01T00:00:00Z', custodyEvent: 'ingested' }).sha256, hash);
});

test('publication is analyst reviewed, evidenced, versioned, and non-definitive', () => {
  assert.throws(() => assertTransition('analyst_review', 'published', { role: 'viewer' }), /analyst/);
  assert.throws(() => assertTransition('analyst_review', 'published', { role: 'analyst', evidenceCount: 1, methodologyVersion: 'v1', verdict: 'definitive' }), /prohibited/);
});
