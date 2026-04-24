import React, { useState, useEffect } from 'react';
import api from '../services/api';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';

export default function Alerts() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => { load(); }, []);
  const load = async () => { const res = await api.get('/alerts'); setItems(res.data); };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete?')) return;
    await api.delete(`/alerts/${id}`); setSelected(null); load();
  };
  const handleEdit = (item) => { setSelected(null); setEditItem(item); setShowForm(true); };
  const handleSubmit = async (data) => {
    if (editItem) { await api.put(`/alerts/${editItem.id}`, data); }
    else { await api.post('/alerts', data); }
    setShowForm(false); setEditItem(null); load();
  };

  const filtered = items.filter(i => {
    const matchSearch = i.title.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || i.severity === filter || i.status === filter;
    return matchSearch && matchFilter;
  });

  const formFields = [
    { key: 'title', label: 'Title', required: true, placeholder: 'Alert title' },
    { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Alert details' },
    { key: 'severity', label: 'Severity', type: 'select', options: [
      { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' }, { value: 'critical', label: 'Critical' }
    ]},
    { key: 'type', label: 'Type', required: true, placeholder: 'e.g., viral_spike, bot_network' },
    { key: 'source', label: 'Source', placeholder: 'e.g., Facebook, Twitter/X' },
    { key: 'status', label: 'Status', type: 'select', options: [
      { value: 'active', label: 'Active' }, { value: 'investigating', label: 'Investigating' },
      { value: 'monitoring', label: 'Monitoring' }, { value: 'resolved', label: 'Resolved' }
    ]},
    { key: 'claim_id', label: 'Related Claim ID', type: 'number', placeholder: 'Optional claim ID' },
  ];

  const detailFields = [
    { key: 'title', label: 'Title', fullWidth: true },
    { key: 'description', label: 'Description', fullWidth: true },
    { key: 'severity', label: 'Severity', render: (v) => <span className={`badge badge-${v}`}>{v}</span> },
    { key: 'status', label: 'Status', render: (v) => <span className={`badge badge-${v}`}>{v}</span> },
    { key: 'type', label: 'Type', render: (v) => <span className="ai-tag">{v?.replace(/_/g, ' ')}</span> },
    { key: 'source', label: 'Source' },
    { key: 'claim_title', label: 'Related Claim' },
    { key: 'created_at', label: 'Created', render: (v) => new Date(v).toLocaleString() },
  ];

  return (
    <div>
      <div className="page-header">
        <div><h2>Alerts</h2><p className="subtitle">Misinformation alerts and threat monitoring</p></div>
        <button className="btn-primary" onClick={() => { setEditItem(null); setShowForm(true); }}>+ New Alert</button>
      </div>
      <div className="search-bar">
        <div className="search-wrapper">
          <input className="search-input" placeholder="Search alerts..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="filter-chips">
          {['all', 'critical', 'high', 'medium', 'active', 'investigating', 'resolved'].map(f => (
            <span key={f} className={`filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f === 'all' ? 'All' : f}
            </span>
          ))}
        </div>
      </div>
      <div className="data-table-container">
        <table className="data-table">
          <thead><tr><th>Alert</th><th>Severity</th><th>Type</th><th>Source</th><th>Status</th></tr></thead>
          <tbody>
            {filtered.map(item => (
              <tr key={item.id} onClick={() => setSelected(item)}>
                <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <span className={`urgency-dot ${item.severity}`}></span>
                  {item.title}
                </td>
                <td><span className={`badge badge-${item.severity}`}>{item.severity}</span></td>
                <td><span className="ai-tag">{item.type?.replace(/_/g, ' ')}</span></td>
                <td>{item.source}</td>
                <td><span className={`badge badge-${item.status}`}>{item.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selected && <DetailModal title="Alert Details" item={selected} fields={detailFields} onClose={() => setSelected(null)} onEdit={handleEdit} onDelete={handleDelete} />}
      {showForm && <FormModal title={editItem ? 'Edit Alert' : 'New Alert'} fields={formFields} initialData={editItem} onSubmit={handleSubmit} onClose={() => { setShowForm(false); setEditItem(null); }} />}
    </div>
  );
}
