import React from 'react';

export default function DetailModal({ title, item, fields, onClose, onEdit, onDelete }) {
  if (!item) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="detail-grid">
            {(fields || Object.keys(item).filter(k => !['id', 'created_at', 'updated_at'].includes(k)).map(k => ({ key: k, label: k.replace(/_/g, ' ') }))).map((field, i) => (
              <div key={i} className={`detail-item ${field.fullWidth ? 'full-width' : ''}`}>
                <div className="detail-label">{field.label}</div>
                <div className="detail-value">
                  {field.render ? field.render(item[field.key], item) : (item[field.key] || 'N/A')}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-primary" onClick={() => onEdit ? onEdit(item) : onClose()}>Edit</button>
          <button className="btn-danger" onClick={() => onDelete ? onDelete(item.id) : onClose()}>Delete</button>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
