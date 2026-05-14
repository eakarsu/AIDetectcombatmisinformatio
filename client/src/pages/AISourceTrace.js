import React, { useState } from 'react';
import api from '../services/api';

export default function AISourceTrace() {
  const [sourceId, setSourceId] = useState('');
  const [depth, setDepth] = useState(1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await api.post('/ai/source-trace', { source_id: Number(sourceId), depth: Number(depth) });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header"><h2>AI Source Tracing</h2></div>
      <p className="subtitle">Explore the source-relationship graph (depth 1 or 2).</p>
      <div className="ai-input-section">
        <input type="number" placeholder="source id" value={sourceId} onChange={(e) => setSourceId(e.target.value)} style={{ marginRight: 8 }} />
        <input type="number" min="1" max="2" value={depth} onChange={(e) => setDepth(e.target.value)} style={{ width: 80 }} />
        <button className="ai-btn" onClick={submit} disabled={loading || !sourceId}>{loading ? 'Tracing…' : 'Trace'}</button>
      </div>
      {error && <div className="ai-result" style={{ borderColor: '#ef4444' }}><div className="ai-field"><div className="ai-field-value">{error}</div></div></div>}
      {result && (
        <div className="ai-result">
          <div className="ai-field"><div className="ai-field-label">Direct relationships ({result.direct.length})</div><pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{JSON.stringify(result.direct, null, 2)}</pre></div>
          {result.depth > 1 && <div className="ai-field"><div className="ai-field-label">Extended ({result.extended.length})</div><pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{JSON.stringify(result.extended, null, 2)}</pre></div>}
        </div>
      )}
    </div>
  );
}
