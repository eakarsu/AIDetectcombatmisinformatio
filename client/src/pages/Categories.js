import React, { useState, useEffect } from 'react';
import api from '../services/api';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';

export default function Categories() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => { load(); }, []);
  const load = async () => { const res = await api.get('/categories'); setItems(res.data); };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete?')) return;
    await api.delete(`/categories/${id}`); setSelected(null); load();
  };
  const handleEdit = (item) => { setSelected(null); setEditItem(item); setShowForm(true); };
  const handleSubmit = async (data) => {
    if (editItem) { await api.put(`/categories/${editItem.id}`, data); }
    else { await api.post('/categories', data); }
    setShowForm(false); setEditItem(null); load();
  };

  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  const formFields = [
    { key: 'name', label: 'Name', required: true, placeholder: 'Category name' },
    { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Category description' },
    { key: 'color', label: 'Color', type: 'color', defaultValue: '#3B82F6' },
  ];

  const detailFields = [
    { key: 'name', label: 'Name', render: (v, item) => <><span className="color-dot" style={{ background: item.color }}></span>{v}</> },
    { key: 'color', label: 'Color', render: (v) => <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span className="color-dot" style={{ background: v }}></span>{v}</span> },
    { key: 'description', label: 'Description', fullWidth: true },
    { key: 'claim_count', label: 'Total Claims' },
    { key: 'created_at', label: 'Created', render: (v) => new Date(v).toLocaleDateString() },
  ];

  return (
    <div>
      <div className="page-header">
        <div><h2>Categories</h2><p className="subtitle">Organize claims by misinformation category</p></div>
        <button className="btn-primary" onClick={() => { setEditItem(null); setShowForm(true); }}>+ New Category</button>
      </div>
      <div className="search-bar">
        <div className="search-wrapper">
          <input className="search-input" placeholder="Search categories..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>
      <div className="data-table-container">
        <table className="data-table">
          <thead><tr><th>Category</th><th>Description</th><th>Claims</th></tr></thead>
          <tbody>
            {filtered.map(item => (
              <tr key={item.id} onClick={() => setSelected(item)}>
                <td><span className="color-dot" style={{ background: item.color }}></span><strong>{item.name}</strong></td>
                <td style={{ maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description}</td>
                <td><strong>{item.claim_count}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selected && <DetailModal title="Category Details" item={selected} fields={detailFields} onClose={() => setSelected(null)} onEdit={handleEdit} onDelete={handleDelete} />}
      {showForm && <FormModal title={editItem ? 'Edit Category' : 'New Category'} fields={formFields} initialData={editItem} onSubmit={handleSubmit} onClose={() => { setShowForm(false); setEditItem(null); }} />}
    </div>
  );
}
