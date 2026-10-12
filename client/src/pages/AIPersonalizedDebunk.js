import NativeAIControls from "../components/NativeAIControls.jsx";
import FormattedAIReport from "../components/FormattedAIReport";
import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function AIPersonalizedDebunk() {
  const [claims, setClaims] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [claimId, setClaimId] = useState('');
  const [profileId, setProfileId] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/claims?page=1&limit=100'),
      api.get('/ai/audience-profiles'),
    ]).then(([claimsResponse, profilesResponse]) => {
      setClaims(claimsResponse.data.data || []);
      setProfiles(profilesResponse.data.profiles || []);
    }).catch(() => {});
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
    <NativeAIControls busy={loading} context="Detectcombatmisinformatio"><div>
      <div className="page-header"><h2>Personalized Debunking</h2></div>
      <p className="subtitle">Generate a debunk tailored to an audience profile.</p>
      <div className="ai-input-section">
        <div className="form-group">
          <label htmlFor="personalized-debunk-claim">Claim *</label>
          <select id="personalized-debunk-claim" data-ai-field="claimId" value={claimId} onChange={(e) => setClaimId(e.target.value)}>
            <option value="">{claims.length ? 'Select a claim' : 'No claims available'}</option>
            {claims.map((claim) => <option key={claim.id} value={claim.id}>{claim.title}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="personalized-debunk-profile">Audience profile (optional)</label>
          <select id="personalized-debunk-profile" data-ai-field="profileId" value={profileId} onChange={(e) => setProfileId(e.target.value)}>
            <option value="">Generic audience</option>
            {profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}
          </select>
        </div>
        <button className="ai-btn" onClick={submit} disabled={loading || !claimId}>{loading ? 'Generating…' : 'Generate'}</button>
      </div>
      {error && <div className="ai-result" style={{ borderColor: '#ef4444' }}><div className="ai-field"><div className="ai-field-value">{error}</div></div></div>}
      {result?.debunk && <FormattedAIReport response={result.debunk} title="Personalized debunk" />}
    </div></NativeAIControls>
  );
}
