import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentClaims, setRecentClaims] = useState([]);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, claimsRes, alertsRes] = await Promise.all([
        api.get('/ai/dashboard-stats'),
        api.get('/claims?page=1&limit=20'),
        api.get('/alerts'),
      ]);
      setStats(statsRes.data);
      // Handle both legacy array and paginated {data, pagination} responses
      const claimRows = Array.isArray(claimsRes.data) ? claimsRes.data : (claimsRes.data?.data || []);
      const alertRows = Array.isArray(alertsRes.data) ? alertsRes.data : (alertsRes.data?.data || []);
      setRecentClaims(claimRows.slice(0, 5));
      setActiveAlerts(alertRows.filter(a => a.status === 'active').slice(0, 5));
    } catch (err) {
      console.error(err);
    }
  };

  if (!stats) return <div className="main-content"><p>Loading dashboard...</p></div>;

  const cards = [
    { label: 'Total Claims', value: stats.claims?.total || 0, icon: '📋', cls: 'info', path: '/claims' },
    { label: 'Pending Review', value: stats.claims?.pending || 0, icon: '⏳', cls: 'warning', path: '/claims' },
    { label: 'Debunked', value: stats.claims?.debunked || 0, icon: '❌', cls: 'critical', path: '/factchecks' },
    { label: 'Fact Checks', value: stats.factChecks?.total || 0, icon: '✅', cls: 'success', path: '/factchecks' },
    { label: 'Active Alerts', value: stats.activeAlerts || 0, icon: '🚨', cls: 'critical', path: '/alerts' },
    { label: 'Trending Topics', value: stats.trendingTopics || 0, icon: '📈', cls: 'purple', path: '/trending' },
    { label: 'Sources Tracked', value: stats.sources?.total || 0, icon: '🔗', cls: 'info', path: '/sources' },
    { label: 'Categories', value: stats.categories || 0, icon: '🏷️', cls: 'success', path: '/categories' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p className="subtitle">Real-time misinformation monitoring overview</p>
        </div>
      </div>

      <div className="dashboard-grid">
        {cards.map((card, i) => (
          <div key={i} className={`stat-card ${card.cls}`} onClick={() => navigate(card.path)}>
            <div className="stat-icon">{card.icon}</div>
            <div className="stat-value">{card.value}</div>
            <div className="stat-label">{card.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="data-table-container">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9' }}>Highest Priority Claims</h3>
            <button className="btn-secondary" onClick={() => navigate('/claims')}>View All</button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Claim</th>
                <th>Priority</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentClaims.map(claim => (
                <tr key={claim.id} onClick={() => navigate('/claims')}>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{claim.title}</td>
                  <td><span className={`badge badge-${claim.priority}`}>{claim.priority}</span></td>
                  <td><span className={`badge badge-${claim.status}`}>{claim.status.replace('_', ' ')}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="data-table-container">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9' }}>Active Alerts</h3>
            <button className="btn-secondary" onClick={() => navigate('/alerts')}>View All</button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Alert</th>
                <th>Severity</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {activeAlerts.map(alert => (
                <tr key={alert.id} onClick={() => navigate('/alerts')}>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{alert.title}</td>
                  <td><span className={`badge badge-${alert.severity}`}>{alert.severity}</span></td>
                  <td>{alert.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
