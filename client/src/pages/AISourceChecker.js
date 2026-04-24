import React, { useState, useEffect } from 'react';
import api from '../services/api';
import AIResultDisplay from '../components/AIResultDisplay';

export default function AISourceChecker() {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedHistory, setSelectedHistory] = useState(null);

  useEffect(() => { loadHistory(); }, []);
  const loadHistory = async () => {
    const res = await api.get('/ai/analyses');
    setHistory(res.data.filter(a => a.analysis_type === 'source_credibility'));
  };

  const handleAnalyze = async () => {
    if (!name.trim()) return;
    setLoading(true); setResult(null);
    try {
      const res = await api.post('/ai/analyze-source', { name, url, description });
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
        <div><h2>AI Source Credibility Checker</h2><p className="subtitle">Evaluate the credibility and reliability of information sources</p></div>
      </div>
      <div className="ai-input-section">
        <h3>Check Source Credibility</h3>
        <div className="form-row" style={{ marginBottom: 12 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Source Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., InfoWars, Reuters" />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>URL</label>
            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." />
          </div>
        </div>
        <div className="form-group">
          <label>Description (optional)</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Any additional context about the source..." style={{ minHeight: 60 }} />
        </div>
        <button className="ai-btn" onClick={handleAnalyze} disabled={loading || !name.trim()}>
          {loading ? <><span className="loading-spinner"></span> Analyzing...</> : <>Check Credibility</>}
        </button>
      </div>
      {result && <AIResultDisplay result={result} type="source_credibility" />}
      {history.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 16 }}>Analysis History</h3>
          <div className="data-table-container">
            <table className="data-table">
              <thead><tr><th>Source</th><th>Score</th><th>Date</th><th>Actions</th></tr></thead>
              <tbody>
                {history.slice(0, 15).map(item => (
                  <tr key={item.id} onClick={() => setSelectedHistory(item)}>
                    <td>{item.input_text}</td>
                    <td style={{ color: item.result?.credibility_score >= 7 ? '#86efac' : item.result?.credibility_score >= 4 ? '#fde047' : '#fca5a5', fontWeight: 700 }}>
                      {item.result?.credibility_score || 'N/A'}/10
                    </td>
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
              <h3>Source Credibility Details</h3>
              <button className="modal-close" onClick={() => setSelectedHistory(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="detail-item full-width" style={{ marginBottom: 16 }}>
                <div className="detail-label">Source</div>
                <div className="detail-value">{selectedHistory.input_text}</div>
              </div>
              <AIResultDisplay result={selectedHistory.result} type="source_credibility" />
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
