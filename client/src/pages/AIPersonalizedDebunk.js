import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function AIPersonalizedDebunk() {
  const [profiles, setProfiles] = useState([]);
  const [claimId, setClaimId] = useState('');
  const [profileId, setProfileId] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/ai/audience-profiles').then((r) => setProfiles(r.data.profiles || [])).catch(() => {});
  }, []);

  const submit = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await api.post('/ai/personalized-debunk', {
        claim_id: Number(claimId),
        audience_profile_id: profileId ? Number(profileId) : undefined,
      });
      setResult(res.data);
    } catch (err) {
      const status = err.response?.status;
      if (status === 503) setError('AI is not configured (OPENROUTER_API_KEY missing).');
      else setError(err.response?.data?.error || err.message);
    } finally { setLoading(false); }
  };

  return (
    <div>
      <div className="page-header"><h2>Personalized Debunking</h2></div>
      <p className="subtitle">Generate a debunk tailored to an audience profile.</p>
      <div className="ai-input-section">
        <input type="number" placeholder="claim id" value={claimId} onChange={(e) => setClaimId(e.target.value)} style={{ marginRight: 8 }} />
        <select value={profileId} onChange={(e) => setProfileId(e.target.value)}>
          <option value="">(generic audience)</option>
          {profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button className="ai-btn" onClick={submit} disabled={loading || !claimId} style={{ marginLeft: 8 }}>{loading ? 'Generating…' : 'Generate'}</button>
      </div>
      {error && <div className="ai-result" style={{ borderColor: '#ef4444' }}><div className="ai-field"><div className="ai-field-value">{error}</div></div></div>}
      {result?.debunk && (
        <div className="ai-result">
          {Object.entries(result.debunk).map(([k, v]) => (
            <div className="ai-field" key={k}>
              <div className="ai-field-label">{k}</div>
              <div className="ai-field-value">{Array.isArray(v) ? <ul>{v.map((x, i) => <li key={i}>{x}</li>)}</ul> : String(v)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
