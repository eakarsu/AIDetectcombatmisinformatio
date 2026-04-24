import React, { useState, useEffect } from 'react';
import api from '../services/api';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';

export default function Team() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => { load(); }, []);
  const load = async () => { const res = await api.get('/team'); setItems(res.data); };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete?')) return;
    await api.delete(`/team/${id}`); setSelected(null); load();
  };
  const handleEdit = (item) => { setSelected(null); setEditItem(item); setShowForm(true); };
  const handleSubmit = async (data) => {
    if (editItem) { await api.put(`/team/${editItem.id}`, data); }
    else { await api.post('/team', data); }
    setShowForm(false); setEditItem(null); load();
  };

  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.role.toLowerCase().includes(search.toLowerCase()));

  const formFields = [
    { key: 'name', label: 'Name', required: true, placeholder: 'Full name' },
    { key: 'email', label: 'Email', type: 'email', required: true, placeholder: 'email@factcheck.org' },
    { key: 'role', label: 'Role', required: true, placeholder: 'e.g., Fact-Checker' },
    { key: 'specialization', label: 'Specialization', placeholder: 'e.g., Health & Science' },
    { key: 'status', label: 'Status', type: 'select', options: [
      { value: 'active', label: 'Active' }, { value: 'on_leave', label: 'On Leave' }, { value: 'inactive', label: 'Inactive' }
    ]},
  ];

  const detailFields = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    { key: 'specialization', label: 'Specialization' },
    { key: 'status', label: 'Status', render: (v) => <span className={`badge badge-${v}`}>{v?.replace('_', ' ')}</span> },
    { key: 'claims_reviewed', label: 'Claims Reviewed', render: (v) => v?.toLocaleString() },
    { key: 'accuracy_rate', label: 'Accuracy Rate', render: (v) => (
      <div className="score-bar">
        <div className="score-bar-bg"><div className="score-bar-fill" style={{ width: `${v}%`, background: v >= 95 ? '#22c55e' : v >= 90 ? '#f59e0b' : '#ef4444' }} /></div>
        <span className="score-value" style={{ color: v >= 95 ? '#86efac' : '#fde047' }}>{v}%</span>
      </div>
    )},
    { key: 'joined_at', label: 'Joined', render: (v) => new Date(v).toLocaleDateString() },
  ];

  return (
    <div>
      <div className="page-header">
        <div><h2>Team Members</h2><p className="subtitle">Manage your fact-checking team</p></div>
        <button className="btn-primary" onClick={() => { setEditItem(null); setShowForm(true); }}>+ New Member</button>
      </div>
      <div className="search-bar">
        <div className="search-wrapper">
          <input className="search-input" placeholder="Search team members..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>
      <div className="data-table-container">
        <table className="data-table">
          <thead><tr><th>Name</th><th>Role</th><th>Specialization</th><th>Claims</th><th>Accuracy</th><th>Status</th></tr></thead>
          <tbody>
            {filtered.map(item => (
              <tr key={item.id} onClick={() => setSelected(item)}>
                <td><strong>{item.name}</strong></td>
                <td>{item.role}</td>
                <td>{item.specialization || '-'}</td>
                <td>{item.claims_reviewed?.toLocaleString()}</td>
                <td style={{ color: item.accuracy_rate >= 95 ? '#86efac' : '#fde047' }}>{item.accuracy_rate}%</td>
                <td><span className={`badge badge-${item.status}`}>{item.status?.replace('_', ' ')}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selected && <DetailModal title="Team Member Details" item={selected} fields={detailFields} onClose={() => setSelected(null)} onEdit={handleEdit} onDelete={handleDelete} />}
      {showForm && <FormModal title={editItem ? 'Edit Member' : 'New Team Member'} fields={formFields} initialData={editItem} onSubmit={handleSubmit} onClose={() => { setShowForm(false); setEditItem(null); }} />}
    </div>
  );
}
