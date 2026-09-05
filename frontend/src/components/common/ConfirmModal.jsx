import React from 'react';
import { AlertTriangle, Trash2, AlertCircle, X } from 'lucide-react';

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone. Please confirm to proceed.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  type = 'danger',
  loading = false
}) => {
  if (!isOpen) return null;

  const isDanger = type === 'danger';
  const Icon = isDanger ? Trash2 : AlertTriangle;
  const iconColor = isDanger ? '#f87171' : '#fbbf24';
  const iconBg = isDanger ? 'rgba(244, 63, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)';
  const iconBorder = isDanger ? 'rgba(244, 63, 94, 0.3)' : 'rgba(245, 158, 11, 0.3)';

  return (
    <div className="modal-overlay" onClick={!loading ? onClose : undefined} style={{ zIndex: 1200 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '440px', padding: '1.75rem' }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.25rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: iconBg,
              border: `1px solid ${iconBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Icon size={22} color={iconColor} />
          </div>

          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
              {title}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.4rem', lineHeight: 1.45 }}>
              {message}
            </p>
          </div>

          {!loading && (
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '0.2rem'
              }}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
            style={{ fontSize: '0.85rem' }}
          >
            {cancelText}
          </button>

          <button
            type="button"
            className={`btn ${isDanger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={loading}
            style={{ fontSize: '0.85rem' }}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
