import React, { useState, useEffect } from 'react';
import api from '../services/api';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';

export default function Claims() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => { load(); }, []);

  const load = async () => {
    const res = await api.get('/claims');
    setItems(res.data);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this claim?')) return;
    await api.delete(`/claims/${id}`);
    setSelected(null);
    load();
  };

  const handleEdit = (item) => {
    setSelected(null);
    setEditItem(item);
    setShowForm(true);
  };

  const handleSubmit = async (data) => {
    if (editItem) {
      await api.put(`/claims/${editItem.id}`, data);
    } else {
      await api.post('/claims', data);
    }
    setShowForm(false);
    setEditItem(null);
    load();
  };

  const filtered = items.filter(item => {
    const matchSearch = item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.content.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || item.status === filter || item.priority === filter;
    return matchSearch && matchFilter;
  });

  const formFields = [
    { key: 'title', label: 'Title', required: true, placeholder: 'Enter claim title' },
    { key: 'content', label: 'Content', type: 'textarea', required: true, placeholder: 'Full claim text' },
    { key: 'priority', label: 'Priority', type: 'select', options: [
      { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' }, { value: 'critical', label: 'Critical' }
    ]},
    { key: 'status', label: 'Status', type: 'select', options: [
      { value: 'pending', label: 'Pending' }, { value: 'investigating', label: 'Investigating' },
      { value: 'in_review', label: 'In Review' }, { value: 'debunked', label: 'Debunked' },
      { value: 'verified', label: 'Verified' }
    ]},
    { key: 'urgency_score', label: 'Urgency Score (0-10)', type: 'number', step: '0.1', min: '0', max: '10' },
    { key: 'origin_url', label: 'Origin URL', placeholder: 'https://...' },
    { key: 'assigned_to', label: 'Assigned To', placeholder: 'Fact-checker name' },
  ];

  const detailFields = [
    { key: 'title', label: 'Title', fullWidth: true },
    { key: 'content', label: 'Content', fullWidth: true },
    { key: 'status', label: 'Status', render: (v) => <span className={`badge badge-${v}`}>{v?.replace('_', ' ')}</span> },
    { key: 'priority', label: 'Priority', render: (v) => <span className={`badge badge-${v}`}>{v}</span> },
    { key: 'urgency_score', label: 'Urgency Score', render: (v) => (
      <div className="score-bar">
        <div className="score-bar-bg"><div className="score-bar-fill" style={{ width: `${v*10}%`, background: v >= 8 ? '#ef4444' : v >= 5 ? '#f59e0b' : '#22c55e' }} /></div>
        <span className="score-value" style={{ color: v >= 8 ? '#ef4444' : v >= 5 ? '#f59e0b' : '#22c55e' }}>{v}</span>
      </div>
    )},
    { key: 'source_name', label: 'Source' },
    { key: 'category_name', label: 'Category' },
    { key: 'spread_rate', label: 'Spread Rate', render: (v) => v ? `${v.toLocaleString()} shares/day` : 'N/A' },
    { key: 'reach', label: 'Reach', render: (v) => v ? `${(v/1000000).toFixed(1)}M people` : 'N/A' },
    { key: 'origin_url', label: 'Origin URL' },
    { key: 'assigned_to', label: 'Assigned To' },
    { key: 'created_at', label: 'Created', render: (v) => new Date(v).toLocaleDateString() },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Claims Monitor</h2>
          <p className="subtitle">Track and prioritize incoming claims for fact-checking</p>
        </div>
        <button className="btn-primary" onClick={() => { setEditItem(null); setShowForm(true); }}>+ New Claim</button>
      </div>

      <div className="search-bar">
        <div className="search-wrapper">
          <input className="search-input" placeholder="Search claims..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="filter-chips">
          {['all', 'pending', 'investigating', 'in_review', 'debunked', 'critical', 'high'].map(f => (
            <span key={f} className={`filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f === 'all' ? 'All' : f.replace('_', ' ')}
            </span>
          ))}
        </div>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Claim</th>
              <th>Source</th>
              <th>Priority</th>
              <th>Urgency</th>
              <th>Status</th>
              <th>Assigned</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(item => (
              <tr key={item.id} onClick={() => setSelected(item)}>
                <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <span className={`urgency-dot ${item.priority}`}></span>
                  {item.title}
                </td>
                <td>{item.source_name || '-'}</td>
                <td><span className={`badge badge-${item.priority}`}>{item.priority}</span></td>
                <td>
                  <div className="score-bar">
                    <div className="score-bar-bg" style={{ width: 60 }}><div className="score-bar-fill" style={{ width: `${item.urgency_score*10}%`, background: item.urgency_score >= 8 ? '#ef4444' : item.urgency_score >= 5 ? '#f59e0b' : '#22c55e' }} /></div>
                    <span className="score-value" style={{ color: item.urgency_score >= 8 ? '#fca5a5' : item.urgency_score >= 5 ? '#fde047' : '#86efac' }}>{item.urgency_score}</span>
                  </div>
                </td>
                <td><span className={`badge badge-${item.status}`}>{item.status?.replace('_', ' ')}</span></td>
                <td>{item.assigned_to || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <DetailModal title="Claim Details" item={selected} fields={detailFields} onClose={() => setSelected(null)} onEdit={handleEdit} onDelete={handleDelete} />
      )}

      {showForm && (
        <FormModal title={editItem ? 'Edit Claim' : 'New Claim'} fields={formFields} initialData={editItem} onSubmit={handleSubmit} onClose={() => { setShowForm(false); setEditItem(null); }} />
      )}
    </div>
  );
}
