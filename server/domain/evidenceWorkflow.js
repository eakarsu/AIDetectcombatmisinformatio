const TRANSITIONS = Object.freeze({
  intake: ['analyzing', 'withdrawn'],
  analyzing: ['analyst_review', 'inconclusive'],
  analyst_review: ['published', 'inconclusive', 'redress'],
  published: ['redress', 'superseded'],
  redress: ['analyst_review', 'superseded'],
  inconclusive: ['analyzing', 'closed'],
  withdrawn: [], superseded: [], closed: []
});

function validateEvidence(input) {
  if (!input || !input.sha256 || !/^[a-f0-9]{64}$/i.test(input.sha256)) throw new Error('valid sha256 is required');
  if (!input.sourceUri || !input.capturedAt || !input.custodyEvent) throw new Error('sourceUri, capturedAt, and custodyEvent are required');
  if (Number.isNaN(Date.parse(input.capturedAt))) throw new Error('capturedAt must be an ISO date');
  return { sha256: input.sha256.toLowerCase(), sourceUri: String(input.sourceUri) };
}

function assertTransition(from, to, context = {}) {
  if (!(TRANSITIONS[from] || []).includes(to)) throw new Error(`transition ${from} -> ${to} is not allowed`);
  if (to === 'published') {
    if (!['analyst', 'editor'].includes(context.role)) throw new Error('analyst review is required');
    if (!context.evidenceCount || !context.methodologyVersion) throw new Error('evidence and versioned methodology are required');
    if (context.verdict === 'definitive') throw new Error('definitive accusations are prohibited');
  }
  return true;
}

module.exports = { TRANSITIONS, validateEvidence, assertTransition };
