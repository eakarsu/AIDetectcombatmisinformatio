import React, { useState, useEffect } from 'react';
import api from '../services/api';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';

export default function Reports() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => { load(); }, []);
  const load = async () => { const res = await api.get('/reports'); setItems(res.data); };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete?')) return;
    await api.delete(`/reports/${id}`); setSelected(null); load();
  };
  const handleEdit = (item) => { setSelected(null); setEditItem(item); setShowForm(true); };
  const handleSubmit = async (data) => {
    if (editItem) { await api.put(`/reports/${editItem.id}`, data); }
    else { await api.post('/reports', data); }
    setShowForm(false); setEditItem(null); load();
  };

  const filtered = items.filter(i => i.title.toLowerCase().includes(search.toLowerCase()));

  const formFields = [
    { key: 'title', label: 'Title', required: true, placeholder: 'Report title' },
    { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Report description' },
    { key: 'type', label: 'Type', type: 'select', required: true, options: [
      { value: 'weekly', label: 'Weekly' }, { value: 'monthly', label: 'Monthly' },
      { value: 'quarterly', label: 'Quarterly' }, { value: 'annual', label: 'Annual' },
      { value: 'special', label: 'Special' }, { value: 'alert', label: 'Alert' },
      { value: 'analysis', label: 'Analysis' }, { value: 'technical', label: 'Technical' },
      { value: 'internal', label: 'Internal' }, { value: 'brief', label: 'Brief' },
      { value: 'emergency', label: 'Emergency' }, { value: 'assessment', label: 'Assessment' }
    ]},
    { key: 'status', label: 'Status', type: 'select', options: [
      { value: 'draft', label: 'Draft' }, { value: 'published', label: 'Published' }
    ]},
    { key: 'author', label: 'Author', placeholder: 'Author name' },
  ];

  const detailFields = [
    { key: 'title', label: 'Title', fullWidth: true },
    { key: 'description', label: 'Description', fullWidth: true },
    { key: 'type', label: 'Type', render: (v) => <span className="ai-tag">{v}</span> },
    { key: 'status', label: 'Status', render: (v) => <span className={`badge badge-${v}`}>{v}</span> },
    { key: 'author', label: 'Author' },
    { key: 'data', label: 'Report Data', fullWidth: true, render: (v) => {
      if (!v) return 'No data';
      const data = typeof v === 'string' ? JSON.parse(v) : v;
      return (
        <div className="detail-grid">
          {Object.entries(data).map(([k, val]) => (
            <div key={k} className="detail-item">
              <div className="detail-label">{k.replace(/_/g, ' ')}</div>
              <div className="detail-value" style={{ fontSize: 18, fontWeight: 700 }}>{typeof val === 'number' ? val.toLocaleString() : String(val)}</div>
            </div>
          ))}
        </div>
      );
    }},
    { key: 'created_at', label: 'Created', render: (v) => new Date(v).toLocaleDateString() },
  ];

  return (
    <div>
      <div className="page-header">
        <div><h2>Reports</h2><p className="subtitle">Fact-checking reports and publications</p></div>
        <button className="btn-primary" onClick={() => { setEditItem(null); setShowForm(true); }}>+ New Report</button>
      </div>
      <div className="search-bar">
        <div className="search-wrapper">
          <input className="search-input" placeholder="Search reports..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>
      <div className="data-table-container">
        <table className="data-table">
          <thead><tr><th>Title</th><th>Type</th><th>Status</th><th>Author</th><th>Date</th></tr></thead>
          <tbody>
            {filtered.map(item => (
              <tr key={item.id} onClick={() => setSelected(item)}>
                <td style={{ maxWidth: 350, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</td>
                <td><span className="ai-tag">{item.type}</span></td>
                <td><span className={`badge badge-${item.status}`}>{item.status}</span></td>
                <td>{item.author || '-'}</td>
                <td>{new Date(item.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selected && <DetailModal title="Report Details" item={selected} fields={detailFields} onClose={() => setSelected(null)} onEdit={handleEdit} onDelete={handleDelete} />}
      {showForm && <FormModal title={editItem ? 'Edit Report' : 'New Report'} fields={formFields} initialData={editItem} onSubmit={handleSubmit} onClose={() => { setShowForm(false); setEditItem(null); }} />}
    </div>
  );
}
