import React, { useEffect, useRef, useState } from 'react';
import api from '../services/api';

export default function AIRealtimeMonitor() {
  const [running, setRunning] = useState(false);
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const lastSinceRef = useRef(null);
  const timerRef = useRef(null);

  const tick = async () => {
    try {
      const since = lastSinceRef.current || new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const res = await api.post('/ai/realtime-monitor/poll', { since });
      lastSinceRef.current = res.data.since;
      if (res.data.claims?.length > 0) {
        setItems((prev) => [...res.data.claims, ...prev].slice(0, 200));
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  useEffect(() => {
    if (running) {
      tick();
      timerRef.current = setInterval(tick, 10000);
      return () => clearInterval(timerRef.current);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  return (
    <div>
      <div className="page-header"><h2>Real-Time Monitor</h2></div>
      <p className="subtitle">Polls for new claims every 10 seconds (poll-based; no streaming infra required).</p>
      <div className="ai-input-section">
        <button className="ai-btn" onClick={() => setRunning((v) => !v)}>{running ? 'Stop' : 'Start'}</button>
      </div>
      {error && <div className="ai-result" style={{ borderColor: '#ef4444' }}><div className="ai-field"><div className="ai-field-value">{error}</div></div></div>}
      <div className="ai-result">
        <div className="ai-field"><div className="ai-field-label">Recent claims ({items.length})</div></div>
        <ul>
          {items.map((c) => (
            <li key={c.id}><strong>#{c.id}</strong> {c.title} <span style={{ color: '#999' }}>{new Date(c.created_at).toLocaleTimeString()}</span></li>
          ))}
        </ul>
      </div>
    </div>
  );
}
