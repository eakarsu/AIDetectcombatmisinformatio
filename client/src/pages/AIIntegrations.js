import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function AIIntegrations() {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/ai/integrations/status').then((r) => setStatus(r.data.status)).catch((err) => setError(err.response?.data?.error || err.message));
  }, []);

  return (
    <div>
      <div className="page-header"><h2>External Integrations</h2></div>
      <p className="subtitle">Social platforms and fact-check networks. Set the listed env vars to enable.</p>
      {error && <div className="ai-result" style={{ borderColor: '#ef4444' }}><div className="ai-field"><div className="ai-field-value">{error}</div></div></div>}
      {status && (
        <div className="ai-result">
          {Object.entries(status).map(([provider, s]) => (
            <div key={provider} className="ai-field">
              <div className="ai-field-label" style={{ textTransform: 'capitalize' }}>
                {provider}: <span style={{ color: s.configured ? '#4ade80' : '#f87171' }}>{s.configured ? 'configured' : 'not configured'}</span>
              </div>
              {!s.configured && <div className="ai-field-value" style={{ fontSize: 12 }}>Missing: {s.missing.join(', ')}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
