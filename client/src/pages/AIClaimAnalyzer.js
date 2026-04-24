import React, { useState, useEffect } from 'react';
import api from '../services/api';
import AIResultDisplay from '../components/AIResultDisplay';

export default function AIClaimAnalyzer() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedHistory, setSelectedHistory] = useState(null);

  useEffect(() => { loadHistory(); }, []);

  const loadHistory = async () => {
    const res = await api.get('/ai/analyses');
    setHistory(res.data.filter(a => a.analysis_type === 'claim_analysis'));
  };

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post('/ai/analyze-claim', { text });
      setResult(res.data.analysis);
      loadHistory();
    } catch (err) {
      setResult({ raw_response: 'Error: ' + (err.response?.data?.error || err.message) });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this analysis?')) return;
    await api.delete(`/ai/analyses/${id}`);
    setSelectedHistory(null);
    loadHistory();
  };

  return (
    <div>
      <div className="page-header">
        <div><h2>AI Claim Analyzer</h2><p className="subtitle">Use AI to analyze claims for factual accuracy</p></div>
      </div>

      <div className="ai-input-section">
        <h3>Analyze a Claim</h3>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Enter a claim to analyze, e.g., 'Drinking warm lemon water every morning cures cancer'..."
        />
        <button className="ai-btn" onClick={handleAnalyze} disabled={loading || !text.trim()}>
          {loading ? <><span className="loading-spinner"></span> Analyzing...</> : <>Analyze Claim</>}
        </button>
      </div>

      {result && <AIResultDisplay result={result} type="claim_analysis" />}

      {history.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 16 }}>Analysis History</h3>
          <div className="data-table-container">
            <table className="data-table">
              <thead><tr><th>Input</th><th>Verdict</th><th>Date</th><th>Actions</th></tr></thead>
              <tbody>
                {history.slice(0, 15).map(item => (
                  <tr key={item.id} onClick={() => setSelectedHistory(item)}>
                    <td style={{ maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.input_text}</td>
                    <td><span className={`badge badge-${item.result?.verdict?.toLowerCase().includes('false') ? 'critical' : item.result?.verdict?.toLowerCase().includes('true') ? 'active' : 'medium'}`}>
                      {item.result?.verdict || 'N/A'}
                    </span></td>
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
              <h3>Analysis Details</h3>
              <button className="modal-close" onClick={() => setSelectedHistory(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="detail-item full-width" style={{ marginBottom: 16 }}>
                <div className="detail-label">Input Text</div>
                <div className="detail-value">{selectedHistory.input_text}</div>
              </div>
              <AIResultDisplay result={selectedHistory.result} type="claim_analysis" />
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
