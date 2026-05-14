import React, { useState } from 'react';
import api from '../services/api';

export default function AITrendPrediction() {
  const [horizonDays, setHorizonDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await api.post('/ai/trend-prediction', { horizon_days: Number(horizonDays) });
      setResult(res.data);
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.error || err.message || 'Request failed';
      if (status === 503) {
        setError('AI is not configured (OPENROUTER_API_KEY missing). Set it on the server and retry.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const pred = result?.prediction;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>AI Trend Prediction</h2>
          <p className="subtitle">Forecast misinformation narratives likely to surge in the coming days</p>
        </div>
      </div>

      <div className="ai-input-section">
        <h3>Forecast horizon (days)</h3>
        <input
          type="number"
          min="1"
          max="30"
          value={horizonDays}
          onChange={(e) => setHorizonDays(e.target.value)}
          style={{ width: 120 }}
        />
        <div style={{ marginTop: 12 }}>
          <button className="ai-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? <><span className="loading-spinner"></span> Predicting...</> : <>Generate Trend Prediction</>}
          </button>
        </div>
      </div>

      {error && (
        <div className="ai-result" style={{ borderColor: '#ef4444' }}>
          <div className="ai-result-header">
            <div className="ai-icon" style={{ background: '#ef4444' }}>!</div>
            <h4>Error</h4>
          </div>
          <div className="ai-field">
            <div className="ai-field-value" style={{ color: '#fecaca' }}>{error}</div>
          </div>
        </div>
      )}

      {pred && (
        <div className="ai-result">
          <div className="ai-result-header">
            <div className="ai-icon">📈</div>
            <h4>Predicted Trends ({result.horizon_days || horizonDays} days, {result.claim_count} claims)</h4>
          </div>

          {pred.summary && (
            <div className="ai-field">
              <div className="ai-field-label">Summary</div>
              <div className="ai-field-value">{pred.summary}</div>
            </div>
          )}

          {Array.isArray(pred.predicted_trends) && pred.predicted_trends.length > 0 && (
            <div className="ai-field">
              <div className="ai-field-label">Predicted Trends</div>
              <div className="ai-field-value">
                <ul>
                  {pred.predicted_trends.map((t, i) => (
                    <li key={i} style={{ marginBottom: 6 }}>
                      <strong>{t.topic}</strong>{' '}
                      <span className="badge badge-medium">{t.expected_volume}</span>{' '}
                      <span className="badge badge-critical">{t.expected_severity}</span>{' '}
                      <span className="badge">{t.confidence} conf.</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {Array.isArray(pred.narratives_to_watch) && pred.narratives_to_watch.length > 0 && (
            <div className="ai-field">
              <div className="ai-field-label">Narratives to Watch</div>
              <div className="ai-field-value">
                <ul>{pred.narratives_to_watch.map((n, i) => <li key={i}>{n}</li>)}</ul>
              </div>
            </div>
          )}

          {Array.isArray(pred.recommended_preparations) && pred.recommended_preparations.length > 0 && (
            <div className="ai-field">
              <div className="ai-field-label">Recommended Preparations</div>
              <div className="ai-field-value">
                <ul>{pred.recommended_preparations.map((n, i) => <li key={i}>{n}</li>)}</ul>
              </div>
            </div>
          )}
        </div>
      )}

      {result && !pred && (
        <div className="ai-result">
          <div className="ai-result-header">
            <div className="ai-icon">🤖</div>
            <h4>AI Response</h4>
          </div>
          <div className="ai-field">
            <div className="ai-field-value" style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
              {JSON.stringify(result, null, 2)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
