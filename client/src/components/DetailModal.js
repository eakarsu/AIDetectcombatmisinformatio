import React from 'react';

export default function DetailModal({ title, item, fields, onClose, onEdit, onDelete }) {
  if (!item) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="detail-grid">
            {fields.map((field, i) => (
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
          <button className="btn-danger" onClick={() => onDelete(item.id)}>Delete</button>
          <button className="btn-primary" onClick={() => onEdit(item)}>Edit</button>
        </div>
      </div>
    </div>
  );
}
