import React, { useState, useEffect } from 'react';
import api from '../services/api';
import AIResultDisplay from '../components/AIResultDisplay';

export default function AISummaryGenerator() {
  const [claim, setClaim] = useState('');
  const [evidence, setEvidence] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedHistory, setSelectedHistory] = useState(null);

  useEffect(() => { loadHistory(); }, []);
  const loadHistory = async () => {
    const res = await api.get('/ai/analyses');
    setHistory(res.data.filter(a => a.analysis_type === 'fact_check_summary'));
  };

  const handleGenerate = async () => {
    if (!claim.trim()) return;
    setLoading(true); setResult(null);
    try {
      const res = await api.post('/ai/generate-summary', { claim, evidence });
      setResult(res.data.analysis);
      loadHistory();
    } catch (err) {
      setResult({ raw_response: 'Error: ' + (err.response?.data?.error || err.message) });
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete?')) return;
    await api.delete(`/ai/analyses/${id}`); setSelectedHistory(null); loadHistory();
  };

  return (
    <div>
      <div className="page-header">
        <div><h2>AI Summary Generator</h2><p className="subtitle">Generate professional fact-check summaries for public consumption</p></div>
      </div>
      <div className="ai-input-section">
        <h3>Generate Fact-Check Summary</h3>
        <div className="form-group">
          <label>Claim *</label>
          <textarea value={claim} onChange={e => setClaim(e.target.value)}
            placeholder="Enter the claim that was fact-checked..." style={{ minHeight: 80 }} />
        </div>
        <div className="form-group">
          <label>Evidence (optional)</label>
          <textarea value={evidence} onChange={e => setEvidence(e.target.value)}
            placeholder="Enter any evidence or findings from the fact-check..." style={{ minHeight: 80 }} />
        </div>
        <button className="ai-btn" onClick={handleGenerate} disabled={loading || !claim.trim()}>
          {loading ? <><span className="loading-spinner"></span> Generating...</> : <>Generate Summary</>}
        </button>
      </div>
      {result && <AIResultDisplay result={result} type="fact_check_summary" />}
      {history.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 16 }}>Generated Summaries</h3>
          <div className="data-table-container">
            <table className="data-table">
              <thead><tr><th>Claim</th><th>Headline</th><th>Date</th><th>Actions</th></tr></thead>
              <tbody>
                {history.slice(0, 15).map(item => (
                  <tr key={item.id} onClick={() => setSelectedHistory(item)}>
                    <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.input_text}</td>
                    <td style={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.result?.headline || 'N/A'}</td>
                    <td>{new Date(item.created_at).toLocaleDateString()}</td>
                    <td><button className="btn-danger" onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}>Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {selectedHistory && (
        <div className="modal-overlay" onClick={() => setSelectedHistory(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
            <div className="modal-header">
              <h3>Summary Details</h3>
              <button className="modal-close" onClick={() => setSelectedHistory(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="detail-item full-width" style={{ marginBottom: 16 }}>
                <div className="detail-label">Original Claim</div>
                <div className="detail-value">{selectedHistory.input_text}</div>
              </div>
              <AIResultDisplay result={selectedHistory.result} type="fact_check_summary" />
            </div>
            <div className="modal-footer">
              <button className="btn-danger" onClick={() => handleDelete(selectedHistory.id)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
