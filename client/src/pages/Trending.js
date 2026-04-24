import React, { useState, useEffect } from 'react';
import api from '../services/api';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';

export default function Trending() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => { load(); }, []);
  const load = async () => { const res = await api.get('/trending'); setItems(res.data); };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete?')) return;
    await api.delete(`/trending/${id}`); setSelected(null); load();
  };
  const handleEdit = (item) => { setSelected(null); setEditItem(item); setShowForm(true); };
  const handleSubmit = async (data) => {
    if (editItem) { await api.put(`/trending/${editItem.id}`, data); }
    else { await api.post('/trending', data); }
    setShowForm(false); setEditItem(null); load();
  };

  const filtered = items.filter(i => i.topic.toLowerCase().includes(search.toLowerCase()));

  const formFields = [
    { key: 'topic', label: 'Topic', required: true, placeholder: 'Trending topic name' },
    { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Topic description' },
    { key: 'category', label: 'Category', placeholder: 'e.g., Health, Politics' },
    { key: 'mention_count', label: 'Mention Count', type: 'number' },
    { key: 'growth_rate', label: 'Growth Rate (%)', type: 'number', step: '0.1' },
    { key: 'risk_level', label: 'Risk Level', type: 'select', options: [
      { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' }, { value: 'critical', label: 'Critical' }
    ]},
  ];

  const detailFields = [
    { key: 'topic', label: 'Topic', fullWidth: true },
    { key: 'description', label: 'Description', fullWidth: true },
    { key: 'category', label: 'Category' },
    { key: 'risk_level', label: 'Risk Level', render: (v) => <span className={`badge badge-${v}`}>{v}</span> },
    { key: 'mention_count', label: 'Mentions', render: (v) => v?.toLocaleString() },
    { key: 'growth_rate', label: 'Growth Rate', render: (v) => (
      <span style={{ color: v > 0 ? '#fca5a5' : '#86efac', fontWeight: 700 }}>
        {v > 0 ? '+' : ''}{v}%
      </span>
    )},
    { key: 'first_seen', label: 'First Seen', render: (v) => new Date(v).toLocaleDateString() },
    { key: 'last_seen', label: 'Last Seen', render: (v) => new Date(v).toLocaleDateString() },
  ];

  return (
    <div>
      <div className="page-header">
        <div><h2>Trending Topics</h2><p className="subtitle">Monitor trending misinformation topics and their growth</p></div>
        <button className="btn-primary" onClick={() => { setEditItem(null); setShowForm(true); }}>+ New Topic</button>
      </div>
      <div className="search-bar">
        <div className="search-wrapper">
          <input className="search-input" placeholder="Search topics..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>
      <div className="data-table-container">
        <table className="data-table">
          <thead><tr><th>Topic</th><th>Category</th><th>Mentions</th><th>Growth</th><th>Risk</th></tr></thead>
          <tbody>
            {filtered.map(item => (
              <tr key={item.id} onClick={() => setSelected(item)}>
                <td><strong>{item.topic}</strong></td>
                <td>{item.category}</td>
                <td>{item.mention_count?.toLocaleString()}</td>
                <td style={{ color: item.growth_rate > 0 ? '#fca5a5' : '#86efac', fontWeight: 600 }}>
                  {item.growth_rate > 0 ? '+' : ''}{item.growth_rate}%
                </td>
                <td><span className={`badge badge-${item.risk_level}`}>{item.risk_level}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selected && <DetailModal title="Trending Topic Details" item={selected} fields={detailFields} onClose={() => setSelected(null)} onEdit={handleEdit} onDelete={handleDelete} />}
      {showForm && <FormModal title={editItem ? 'Edit Topic' : 'New Topic'} fields={formFields} initialData={editItem} onSubmit={handleSubmit} onClose={() => { setShowForm(false); setEditItem(null); }} />}
    </div>
  );
}
