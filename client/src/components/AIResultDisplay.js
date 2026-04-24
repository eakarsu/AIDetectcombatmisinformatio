import React from 'react';

function getVerdictClass(verdict) {
  if (!verdict) return '';
  const v = verdict.toLowerCase();
  if (v.includes('dangerous') || v.includes('extremely')) return 'dangerous';
  if (v.includes('false') || v.includes('likely false')) return 'false';
  if (v.includes('true') || v.includes('likely true')) return 'true';
  return 'uncertain';
}

function getConfidenceColor(score) {
  if (score >= 0.8) return '#22c55e';
  if (score >= 0.6) return '#f59e0b';
  return '#ef4444';
}

function getEmotionColor(score) {
  if (score >= 0.7) return '#ef4444';
  if (score >= 0.4) return '#f59e0b';
  return '#22c55e';
}

export default function AIResultDisplay({ result, type }) {
  if (!result) return null;

  // Handle raw_response (when JSON parsing failed)
  if (result.raw_response) {
    return (
      <div className="ai-result">
        <div className="ai-result-header">
          <div className="ai-icon">🤖</div>
          <h4>AI Analysis Result</h4>
        </div>
        <div className="ai-field">
          <div className="ai-field-value" style={{ whiteSpace: 'pre-wrap' }}>{result.raw_response}</div>
        </div>
      </div>
    );
  }

  if (type === 'claim_analysis') {
    return (
      <div className="ai-result">
        <div className="ai-result-header">
          <div className="ai-icon">🤖</div>
          <h4>AI Claim Analysis</h4>
          <span className="model">Claude Haiku 4.5</span>
        </div>

        <div className="ai-field">
          <div className="ai-field-label">Verdict</div>
          <div className={`ai-verdict ${getVerdictClass(result.verdict)}`}>
            {result.verdict}
          </div>
        </div>

        {result.confidence !== undefined && (
          <div className="ai-field">
            <div className="ai-field-label">Confidence</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: getConfidenceColor(result.confidence) }}>
                {(result.confidence * 100).toFixed(0)}%
              </span>
              <div className="ai-confidence-bar" style={{ flex: 1 }}>
                <div className="ai-confidence-fill" style={{ width: `${result.confidence * 100}%`, background: getConfidenceColor(result.confidence) }} />
              </div>
            </div>
          </div>
        )}

        {result.reasoning && (
          <div className="ai-field">
            <div className="ai-field-label">Reasoning</div>
            <div className="ai-field-value">{result.reasoning}</div>
          </div>
        )}

        {result.key_indicators && (
          <div className="ai-field">
            <div className="ai-field-label">Key Indicators</div>
            <div className="ai-tags">
              {result.key_indicators.map((indicator, i) => (
                <span key={i} className="ai-tag">{indicator}</span>
              ))}
            </div>
          </div>
        )}

        {result.risk_level && (
          <div className="ai-field">
            <div className="ai-field-label">Risk Level</div>
            <span className={`badge badge-${result.risk_level}`}>{result.risk_level}</span>
          </div>
        )}

        {result.recommended_action && (
          <div className="ai-field">
            <div className="ai-field-label">Recommended Action</div>
            <div className="ai-field-value">{result.recommended_action}</div>
          </div>
        )}

        {result.manipulation_techniques && result.manipulation_techniques.length > 0 && (
          <div className="ai-field">
            <div className="ai-field-label">Manipulation Techniques Detected</div>
            <div className="ai-tags">
              {result.manipulation_techniques.map((tech, i) => (
                <span key={i} className="ai-tag danger">{tech.replace(/_/g, ' ')}</span>
              ))}
            </div>
          </div>
        )}

        {result.category && (
          <div className="ai-field">
            <div className="ai-field-label">Category</div>
            <span className="ai-tag">{result.category}</span>
          </div>
        )}
      </div>
    );
  }

  if (type === 'sentiment_analysis') {
    return (
      <div className="ai-result">
        <div className="ai-result-header">
          <div className="ai-icon">💭</div>
          <h4>Sentiment Analysis</h4>
          <span className="model">Claude Haiku 4.5</span>
        </div>

        <div className="ai-field">
          <div className="ai-field-label">Sentiment</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className={`ai-verdict ${result.score < -0.3 ? 'false' : result.score > 0.3 ? 'true' : 'uncertain'}`}>
              {result.sentiment}
            </span>
            <span style={{ fontSize: 20, fontWeight: 700, color: result.score < 0 ? '#fca5a5' : '#86efac' }}>
              {result.score > 0 ? '+' : ''}{result.score?.toFixed(2)}
            </span>
          </div>
        </div>

        {result.emotions && (
          <div className="ai-field">
            <div className="ai-field-label">Emotional Analysis</div>
            <div className="ai-emotions-grid">
              {Object.entries(result.emotions).map(([emotion, score]) => (
                <div key={emotion} className="ai-emotion">
                  <div className="emotion-value" style={{ color: getEmotionColor(score) }}>
                    {(score * 100).toFixed(0)}%
                  </div>
                  <div className="emotion-name">{emotion}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {result.manipulation_indicators && (
          <div className="ai-field">
            <div className="ai-field-label">Manipulation Indicators</div>
            <div className="ai-tags">
              {Object.entries(result.manipulation_indicators).map(([key, value]) => (
                <span key={key} className={`ai-tag ${value ? 'danger' : ''}`}>
                  {value ? '⚠ ' : '✓ '}{key.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        )}

        {result.viral_potential && (
          <div className="ai-field">
            <div className="ai-field-label">Viral Potential</div>
            <span className={`badge badge-${result.viral_potential?.toLowerCase().includes('high') || result.viral_potential?.toLowerCase().includes('very') ? 'critical' : 'medium'}`}>
              {result.viral_potential}
            </span>
          </div>
        )}

        {result.target_audience && (
          <div className="ai-field">
            <div className="ai-field-label">Target Audience</div>
            <div className="ai-field-value">{result.target_audience}</div>
          </div>
        )}

        {result.emotional_triggers && (
          <div className="ai-field">
            <div className="ai-field-label">Emotional Triggers</div>
            <div className="ai-tags">
              {result.emotional_triggers.map((trigger, i) => (
                <span key={i} className="ai-tag warning">{trigger}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (type === 'source_credibility') {
    return (
      <div className="ai-result">
        <div className="ai-result-header">
          <div className="ai-icon">🔍</div>
          <h4>Source Credibility Analysis</h4>
          <span className="model">Claude Haiku 4.5</span>
        </div>

        {result.credibility_score !== undefined && (
          <div className="ai-field">
            <div className="ai-field-label">Credibility Score</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: result.credibility_score >= 7 ? '#22c55e' : result.credibility_score >= 4 ? '#f59e0b' : '#ef4444' }}>
                {result.credibility_score}/10
              </span>
              <div className="ai-confidence-bar" style={{ flex: 1 }}>
                <div className="ai-confidence-fill" style={{
                  width: `${result.credibility_score * 10}%`,
                  background: result.credibility_score >= 7 ? '#22c55e' : result.credibility_score >= 4 ? '#f59e0b' : '#ef4444'
                }} />
              </div>
            </div>
          </div>
        )}

        {result.assessment && (
          <div className="ai-field">
            <div className="ai-field-label">Assessment</div>
            <div className="ai-field-value">{result.assessment}</div>
          </div>
        )}

        {result.factors && (
          <div className="ai-field">
            <div className="ai-field-label">Evaluation Factors</div>
            <div className="detail-grid">
              {Object.entries(result.factors).map(([key, value]) => (
                <div key={key} className="detail-item">
                  <div className="detail-label">{key.replace(/_/g, ' ')}</div>
                  <div className="detail-value">{String(value)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {result.recommendation && (
          <div className="ai-field">
            <div className="ai-field-label">Recommendation</div>
            <div className="ai-field-value">{result.recommendation}</div>
          </div>
        )}

        {result.bias_indicators && (
          <div className="ai-field">
            <div className="ai-field-label">Bias Indicators</div>
            <div className="ai-tags">
              {result.bias_indicators.map((bias, i) => (
                <span key={i} className="ai-tag warning">{bias}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (type === 'pattern_detection') {
    return (
      <div className="ai-result">
        <div className="ai-result-header">
          <div className="ai-icon">🧩</div>
          <h4>Misinformation Pattern Detection</h4>
          <span className="model">Claude Haiku 4.5</span>
        </div>

        {result.overall_risk && (
          <div className="ai-field">
            <div className="ai-field-label">Overall Risk</div>
            <span className={`badge badge-${result.overall_risk}`}>{result.overall_risk}</span>
          </div>
        )}

        {result.narrative_type && (
          <div className="ai-field">
            <div className="ai-field-label">Narrative Type</div>
            <div className="ai-field-value">{result.narrative_type}</div>
          </div>
        )}

        {result.patterns_detected && (
          <div className="ai-field">
            <div className="ai-field-label">Patterns Detected</div>
            {result.patterns_detected.map((pattern, i) => (
              <div key={i} style={{ background: 'rgba(15,23,42,0.5)', padding: 12, borderRadius: 10, marginBottom: 8, border: '1px solid rgba(51,65,85,0.5)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, color: '#e2e8f0' }}>{pattern.pattern_name}</span>
                  <span className={`badge badge-${pattern.severity || 'medium'}`}>{pattern.severity || 'unknown'}</span>
                </div>
                <div style={{ fontSize: 13, color: '#94a3b8' }}>{pattern.description}</div>
                {pattern.confidence && (
                  <div className="ai-confidence-bar" style={{ marginTop: 8 }}>
                    <div className="ai-confidence-fill" style={{ width: `${pattern.confidence * 100}%`, background: '#8b5cf6' }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {result.counter_narrative && (
          <div className="ai-field">
            <div className="ai-field-label">Suggested Counter-Narrative</div>
            <div className="ai-field-value" style={{ background: 'rgba(34,197,94,0.05)', padding: 12, borderRadius: 10, border: '1px solid rgba(34,197,94,0.2)' }}>
              {result.counter_narrative}
            </div>
          </div>
        )}

        {result.similar_debunked_claims && (
          <div className="ai-field">
            <div className="ai-field-label">Similar Debunked Claims</div>
            <div className="ai-tags">
              {result.similar_debunked_claims.map((claim, i) => (
                <span key={i} className="ai-tag">{claim}</span>
              ))}
            </div>
          </div>
        )}

        {result.recommended_response && (
          <div className="ai-field">
            <div className="ai-field-label">Recommended Response</div>
            <div className="ai-field-value">{result.recommended_response}</div>
          </div>
        )}
      </div>
    );
  }

  if (type === 'fact_check_summary') {
    return (
      <div className="ai-result">
        <div className="ai-result-header">
          <div className="ai-icon">📝</div>
          <h4>AI-Generated Fact-Check Summary</h4>
          <span className="model">Claude Haiku 4.5</span>
        </div>

        {result.headline && (
          <div className="ai-field">
            <div className="ai-field-label">Headline</div>
            <div className="ai-field-value" style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>{result.headline}</div>
          </div>
        )}

        {result.summary && (
          <div className="ai-field">
            <div className="ai-field-label">Summary</div>
            <div className="ai-field-value">{result.summary}</div>
          </div>
        )}

        {result.detailed_analysis && (
          <div className="ai-field">
            <div className="ai-field-label">Detailed Analysis</div>
            <div className="ai-field-value">{result.detailed_analysis}</div>
          </div>
        )}

        {result.verdict_explanation && (
          <div className="ai-field">
            <div className="ai-field-label">Verdict Explanation</div>
            <div className="ai-field-value">{result.verdict_explanation}</div>
          </div>
        )}

        {result.what_to_know && (
          <div className="ai-field">
            <div className="ai-field-label">Key Facts to Know</div>
            <ul style={{ paddingLeft: 20 }}>
              {result.what_to_know.map((fact, i) => (
                <li key={i} style={{ marginBottom: 6, color: '#cbd5e1', fontSize: 14 }}>{fact}</li>
              ))}
            </ul>
          </div>
        )}

        {result.share_message && (
          <div className="ai-field">
            <div className="ai-field-label">Share Message</div>
            <div style={{ background: 'rgba(99,102,241,0.1)', padding: 12, borderRadius: 10, border: '1px solid rgba(99,102,241,0.2)', fontSize: 14, color: '#c7d2fe', fontStyle: 'italic' }}>
              "{result.share_message}"
            </div>
          </div>
        )}
      </div>
    );
  }

  // Generic display for any other type
  return (
    <div className="ai-result">
      <div className="ai-result-header">
        <div className="ai-icon">🤖</div>
        <h4>AI Analysis Result</h4>
        <span className="model">Claude Haiku 4.5</span>
      </div>
      {Object.entries(result).map(([key, value]) => (
        <div className="ai-field" key={key}>
          <div className="ai-field-label">{key.replace(/_/g, ' ')}</div>
          <div className="ai-field-value">
            {typeof value === 'object' ? (
              Array.isArray(value) ? (
                <div className="ai-tags">
                  {value.map((item, i) => (
                    <span key={i} className="ai-tag">{typeof item === 'object' ? JSON.stringify(item) : String(item)}</span>
                  ))}
                </div>
              ) : (
                <div className="detail-grid">
                  {Object.entries(value).map(([k, v]) => (
                    <div key={k} className="detail-item">
                      <div className="detail-label">{k.replace(/_/g, ' ')}</div>
                      <div className="detail-value">{String(v)}</div>
                    </div>
                  ))}
                </div>
              )
            ) : String(value)}
          </div>
        </div>
      ))}
    </div>
  );
}
