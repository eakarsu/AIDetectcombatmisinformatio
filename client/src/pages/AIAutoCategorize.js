import React, { useState } from 'react';
import api from '../services/api';

const DEFAULT_CATEGORIES = ['health', 'politics', 'science', 'finance', 'environment', 'technology', 'society', 'conspiracy', 'other'];

export default function AIAutoCategorize() {
  const [claimText, setClaimText] = useState('');
  const [categoriesInput, setCategoriesInput] = useState(DEFAULT_CATEGORIES.join(', '));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!claimText.trim()) {
      setError('Claim text is required');
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);

    const payload = { claim_text: claimText };
    const cats = categoriesInput
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (cats.length) payload.available_categories = cats;

    try {
      const res = await api.post('/ai/auto-categorize', payload);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const cat = result?.categorization;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>AI Auto-Categorize</h2>
          <p className="subtitle">Classify a claim into your taxonomy with tags and confidence</p>
        </div>
      </div>

      <div className="ai-input-section">
        <h3>Claim to Categorize</h3>
        <textarea
          value={claimText}
          onChange={(e) => setClaimText(e.target.value)}
          placeholder="e.g., 'Drinking warm lemon water every morning cures cancer.'"
        />

        <h3 style={{ marginTop: 16 }}>Available Categories (optional, comma-separated)</h3>
        <textarea
          value={categoriesInput}
          onChange={(e) => setCategoriesInput(e.target.value)}
          placeholder="health, politics, science, ..."
          style={{ minHeight: 80 }}
        />

        <button
          className="ai-btn"
          onClick={handleSubmit}
          disabled={loading || !claimText.trim()}
        >
          {loading ? <><span className="loading-spinner"></span> Categorizing...</> : <>Auto-Categorize Claim</>}
        </button>
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

      {result && cat && (
        <div className="ai-result">
          <div className="ai-result-header">
            <div className="ai-icon">🏷️</div>
            <h4>Categorization Result</h4>
          </div>

          {cat.primary_category && (
            <div className="ai-field">
              <div className="ai-field-label">Primary Category</div>
              <div className="ai-field-value" style={{ fontSize: 18, fontWeight: 700 }}>
                <span className="badge badge-active">{cat.primary_category}</span>
              </div>
            </div>
          )}

          {Array.isArray(cat.secondary_categories) && cat.secondary_categories.length > 0 && (
            <div className="ai-field">
              <div className="ai-field-label">Secondary Categories</div>
              <div className="ai-field-value" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {cat.secondary_categories.map((c) => (
                  <span key={c} className="badge badge-medium">{c}</span>
                ))}
              </div>
            </div>
          )}

          {Array.isArray(cat.tags) && cat.tags.length > 0 && (
            <div className="ai-field">
              <div className="ai-field-label">Tags</div>
              <div className="ai-field-value" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {cat.tags.map((t) => (
                  <span key={t} className="badge">{t}</span>
                ))}
              </div>
            </div>
          )}

          {cat.confidence && (
            <div className="ai-field">
              <div className="ai-field-label">Confidence</div>
              <div className="ai-field-value">
                <span className={`badge badge-${cat.confidence === 'high' ? 'active' : cat.confidence === 'medium' ? 'medium' : 'critical'}`}>
                  {cat.confidence}
                </span>
              </div>
            </div>
          )}

          {cat.rationale && (
            <div className="ai-field">
              <div className="ai-field-label">Rationale</div>
              <div className="ai-field-value">{cat.rationale}</div>
            </div>
          )}
        </div>
      )}

      {result && !cat && (
        <div className="ai-result">
          <div className="ai-result-header">
            <div className="ai-icon">🤖</div>
            <h4>AI Response</h4>
          </div>
          <div className="ai-field">
            <div className="ai-field-value" style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
              {result.raw || JSON.stringify(result, null, 2)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
