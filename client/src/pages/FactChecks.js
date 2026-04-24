import React, { useState, useEffect } from 'react';
import api from '../services/api';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';

export default function FactChecks() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => { load(); }, []);
  const load = async () => { const res = await api.get('/factchecks'); setItems(res.data); };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this fact check?')) return;
    await api.delete(`/factchecks/${id}`);
    setSelected(null); load();
  };

  const handleEdit = (item) => { setSelected(null); setEditItem(item); setShowForm(true); };

  const handleSubmit = async (data) => {
    if (editItem) { await api.put(`/factchecks/${editItem.id}`, data); }
    else { await api.post('/factchecks', data); }
    setShowForm(false); setEditItem(null); load();
  };

  const filtered = items.filter(i => i.claim_title?.toLowerCase().includes(search.toLowerCase()) || i.summary?.toLowerCase().includes(search.toLowerCase()));

  const formFields = [
    { key: 'claim_id', label: 'Claim ID', type: 'number', placeholder: 'Associated claim ID' },
    { key: 'verdict', label: 'Verdict', type: 'select', required: true, options: [
      { value: 'true', label: 'True' }, { value: 'mostly_true', label: 'Mostly True' },
      { value: 'mixed', label: 'Mixed' }, { value: 'mostly_false', label: 'Mostly False' },
      { value: 'false', label: 'False' }, { value: 'in_review', label: 'In Review' },
      { value: 'investigating', label: 'Investigating' }
    ]},
    { key: 'summary', label: 'Summary', type: 'textarea', required: true, placeholder: 'Fact check summary' },
    { key: 'evidence', label: 'Evidence', type: 'textarea', placeholder: 'Evidence gathered' },
    { key: 'sources_used', label: 'Sources Used', placeholder: 'List of sources referenced' },
    { key: 'checker_name', label: 'Checker Name', placeholder: 'Name of fact-checker' },
    { key: 'confidence_score', label: 'Confidence (0-10)', type: 'number', step: '0.1', min: '0', max: '10' },
    { key: 'methodology', label: 'Methodology', type: 'textarea', placeholder: 'Fact-checking methodology used' },
  ];

  const getVerdictBadge = (v) => {
    if (!v) return 'medium';
    if (v === 'true' || v === 'mostly_true') return 'verified';
    if (v === 'false' || v === 'mostly_false') return 'debunked';
    return 'in_review';
  };

  const detailFields = [
    { key: 'claim_title', label: 'Claim', fullWidth: true },
    { key: 'verdict', label: 'Verdict', render: (v) => <span className={`badge badge-${getVerdictBadge(v)}`}>{v}</span> },
    { key: 'confidence_score', label: 'Confidence', render: (v) => (
      <div className="score-bar">
        <div className="score-bar-bg"><div className="score-bar-fill" style={{ width: `${v*10}%`, background: v >= 8 ? '#22c55e' : v >= 5 ? '#f59e0b' : '#ef4444' }} /></div>
        <span className="score-value" style={{ color: v >= 8 ? '#86efac' : v >= 5 ? '#fde047' : '#fca5a5' }}>{v}/10</span>
      </div>
    )},
    { key: 'summary', label: 'Summary', fullWidth: true },
    { key: 'evidence', label: 'Evidence', fullWidth: true },
    { key: 'sources_used', label: 'Sources Used', fullWidth: true },
    { key: 'checker_name', label: 'Checked By' },
    { key: 'methodology', label: 'Methodology', fullWidth: true },
    { key: 'created_at', label: 'Date', render: (v) => new Date(v).toLocaleDateString() },
  ];

  return (
    <div>
      <div className="page-header">
        <div><h2>Fact Checks</h2><p className="subtitle">Completed and in-progress fact-check investigations</p></div>
        <button className="btn-primary" onClick={() => { setEditItem(null); setShowForm(true); }}>+ New Fact Check</button>
      </div>
      <div className="search-bar">
        <div className="search-wrapper">
          <input className="search-input" placeholder="Search fact checks..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>
      <div className="data-table-container">
        <table className="data-table">
          <thead><tr><th>Claim</th><th>Verdict</th><th>Confidence</th><th>Checker</th><th>Date</th></tr></thead>
          <tbody>
            {filtered.map(item => (
              <tr key={item.id} onClick={() => setSelected(item)}>
                <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.claim_title || `Claim #${item.claim_id}`}</td>
                <td><span className={`badge badge-${getVerdictBadge(item.verdict)}`}>{item.verdict}</span></td>
                <td>
                  <div className="score-bar">
                    <div className="score-bar-bg" style={{ width: 60 }}><div className="score-bar-fill" style={{ width: `${item.confidence_score*10}%`, background: item.confidence_score >= 8 ? '#22c55e' : '#f59e0b' }} /></div>
                    <span className="score-value">{item.confidence_score}</span>
                  </div>
                </td>
                <td>{item.checker_name || '-'}</td>
                <td>{new Date(item.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selected && <DetailModal title="Fact Check Details" item={selected} fields={detailFields} onClose={() => setSelected(null)} onEdit={handleEdit} onDelete={handleDelete} />}
      {showForm && <FormModal title={editItem ? 'Edit Fact Check' : 'New Fact Check'} fields={formFields} initialData={editItem} onSubmit={handleSubmit} onClose={() => { setShowForm(false); setEditItem(null); }} />}
    </div>
  );
}
