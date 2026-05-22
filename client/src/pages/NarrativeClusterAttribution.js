import React, { useEffect, useState } from 'react';

export default function NarrativeClusterAttribution() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch('/api/narrative-cluster-attribution').then((res) => res.json()).then(setData).catch(() => setData(null));
  }, []);
  return (
    <div className="page">
      <h1>Narrative Cluster Attribution</h1>
      <p>Group misinformation narratives, trace source families, and prepare debunk actions.</p>
      <div className="stats-grid">
        {data && Object.entries(data.summary).map(([key, value]) => <div className="stat-card" key={key}><span>{key.replaceAll('_', ' ')}</span><strong>{value}</strong></div>)}
      </div>
      <div className="card">
        {(data?.clusters || []).map((item) => <div key={item.narrative} style={{ padding: 12, borderBottom: '1px solid #e5e7eb' }}><strong>{item.narrative}</strong><div>{item.origin} - {item.spread} spread - {item.action}</div></div>)}
      </div>
    </div>
  );
}
