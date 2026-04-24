import React, { useState, useEffect } from 'react';
import api from '../services/api';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';

export default function Sources() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => { load(); }, []);
  const load = async () => { const res = await api.get('/sources'); setItems(res.data); };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this source?')) return;
    await api.delete(`/sources/${id}`); setSelected(null); load();
  };
  const handleEdit = (item) => { setSelected(null); setEditItem(item); setShowForm(true); };
  const handleSubmit = async (data) => {
    if (editItem) { await api.put(`/sources/${editItem.id}`, data); }
    else { await api.post('/sources', data); }
    setShowForm(false); setEditItem(null); load();
  };

  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  const getCredColor = (score) => score >= 7 ? '#22c55e' : score >= 4 ? '#f59e0b' : '#ef4444';

  const formFields = [
    { key: 'name', label: 'Name', required: true, placeholder: 'Source name' },
    { key: 'url', label: 'URL', placeholder: 'https://...' },
    { key: 'type', label: 'Type', type: 'select', options: [
      { value: 'news_agency', label: 'News Agency' }, { value: 'news_outlet', label: 'News Outlet' },
      { value: 'blog', label: 'Blog' }, { value: 'social_media', label: 'Social Media' },
      { value: 'messaging', label: 'Messaging' }, { value: 'video_platform', label: 'Video Platform' },
      { value: 'academic', label: 'Academic' }, { value: 'satire', label: 'Satire' },
      { value: 'encyclopedia', label: 'Encyclopedia' }
    ]},
    { key: 'credibility_score', label: 'Credibility Score (0-10)', type: 'number', step: '0.1', min: '0', max: '10' },
    { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Source description' },
  ];

  const detailFields = [
    { key: 'name', label: 'Name' },
    { key: 'url', label: 'URL', render: (v) => v ? <a href={v} target="_blank" rel="noreferrer" style={{ color: '#818cf8' }}>{v}</a> : 'N/A' },
    { key: 'type', label: 'Type', render: (v) => <span className="ai-tag">{v?.replace('_', ' ')}</span> },
    { key: 'credibility_score', label: 'Credibility', render: (v) => (
      <div className="score-bar">
        <div className="score-bar-bg"><div className="score-bar-fill" style={{ width: `${v*10}%`, background: getCredColor(v) }} /></div>
        <span className="score-value" style={{ color: getCredColor(v) }}>{v}/10</span>
      </div>
    )},
    { key: 'description', label: 'Description', fullWidth: true },
    { key: 'total_claims', label: 'Total Claims' },
    { key: 'verified_claims', label: 'Verified Claims' },
    { key: 'false_claims', label: 'False Claims' },
  ];

  return (
    <div>
      <div className="page-header">
        <div><h2>Sources</h2><p className="subtitle">Track and rate information source credibility</p></div>
        <button className="btn-primary" onClick={() => { setEditItem(null); setShowForm(true); }}>+ New Source</button>
      </div>
      <div className="search-bar">
        <div className="search-wrapper">
          <input className="search-input" placeholder="Search sources..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>
      <div className="data-table-container">
        <table className="data-table">
          <thead><tr><th>Source</th><th>Type</th><th>Credibility</th><th>Total Claims</th><th>False Claims</th></tr></thead>
          <tbody>
            {filtered.map(item => (
              <tr key={item.id} onClick={() => setSelected(item)}>
                <td><strong>{item.name}</strong></td>
                <td><span className="ai-tag">{item.type?.replace('_', ' ')}</span></td>
                <td>
                  <div className="score-bar">
                    <div className="score-bar-bg" style={{ width: 60 }}><div className="score-bar-fill" style={{ width: `${item.credibility_score*10}%`, background: getCredColor(item.credibility_score) }} /></div>
                    <span className="score-value" style={{ color: getCredColor(item.credibility_score) }}>{item.credibility_score}</span>
                  </div>
                </td>
                <td>{item.total_claims}</td>
                <td style={{ color: item.false_claims > 100 ? '#fca5a5' : '#94a3b8' }}>{item.false_claims}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selected && <DetailModal title="Source Details" item={selected} fields={detailFields} onClose={() => setSelected(null)} onEdit={handleEdit} onDelete={handleDelete} />}
      {showForm && <FormModal title={editItem ? 'Edit Source' : 'New Source'} fields={formFields} initialData={editItem} onSubmit={handleSubmit} onClose={() => { setShowForm(false); setEditItem(null); }} />}
    </div>
  );
}
