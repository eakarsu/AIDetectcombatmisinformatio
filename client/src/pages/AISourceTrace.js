import NativeAIControls from "../components/NativeAIControls.jsx";
import FormattedAIReport from "../components/FormattedAIReport";
import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function AISourceTrace() {
  const [sources, setSources] = useState([]);
  const [sourceId, setSourceId] = useState('');
  const [depth, setDepth] = useState(1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/sources?page=1&limit=100').then((response) => setSources(response.data.data || [])).catch(() => {});
  }, []);

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
    <NativeAIControls busy={loading} context="Detectcombatmisinformatio"><div>
      <div className="page-header"><h2>AI Source Tracing</h2></div>
      <p className="subtitle">Explore the source-relationship graph (depth 1 or 2).</p>
      <div className="ai-input-section">
        <div className="form-group">
          <label htmlFor="source-trace-source">Source *</label>
          <select id="source-trace-source" data-ai-field="sourceId" value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
            <option value="">{sources.length ? 'Select a source' : 'No sources available'}</option>
            {sources.map((source) => <option key={source.id} value={source.id}>{source.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="source-trace-depth">Relationship depth</label>
          <input id="source-trace-depth" data-ai-field="depth" type="number" min="1" max="2" value={depth} onChange={(e) => setDepth(e.target.value)} style={{ width: 80 }} />
        </div>
        <button className="ai-btn" onClick={submit} disabled={loading || !sourceId}>{loading ? 'Tracing…' : 'Trace'}</button>
      </div>
      {error && <div className="ai-result" style={{ borderColor: '#ef4444' }}><div className="ai-field"><div className="ai-field-value">{error}</div></div></div>}
      {result && (
        <div className="ai-result">
          <div className="ai-field"><div className="ai-field-label">Direct relationships ({result.direct.length})</div><FormattedAIReport response={result.direct} /></div>
          {result.depth > 1 && <div className="ai-field"><div className="ai-field-label">Extended ({result.extended.length})</div><FormattedAIReport response={result.extended} /></div>}
        </div>
      )}
    </div></NativeAIControls>
  );
}
