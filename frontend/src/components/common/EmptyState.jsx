import React from 'react';
import { Layers } from 'lucide-react';

const EmptyState = ({
  icon: Icon = Layers,
  title = 'No records found',
  description = 'There is currently no data available for this section.',
  actionText,
  onAction,
  compact = false,
  style = {}
}) => {
  return (
    <div
      className="empty-state-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: compact ? '2rem 1rem' : '3.5rem 1.5rem',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px dashed var(--border-color)',
        borderRadius: 'var(--radius-md)',
        width: '100%',
        ...style
      }}
    >
      <div
        style={{
          width: compact ? '44px' : '56px',
          height: compact ? '44px' : '56px',
          borderRadius: '50%',
          background: 'rgba(139, 92, 246, 0.1)',
          border: '1px solid rgba(139, 92, 246, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#a78bfa',
          marginBottom: compact ? '0.75rem' : '1.25rem'
        }}
      >
        <Icon size={compact ? 22 : 28} />
      </div>

      <h3
        style={{
          fontSize: compact ? '0.95rem' : '1.15rem',
          fontWeight: '700',
          color: 'var(--text-primary)',
          marginBottom: '0.35rem'
        }}
      >
        {title}
      </h3>

      <p
        style={{
          fontSize: compact ? '0.78rem' : '0.875rem',
          color: 'var(--text-secondary)',
          maxWidth: '440px',
          lineHeight: 1.45,
          marginBottom: actionText && onAction ? '1.25rem' : 0
        }}
      >
        {description}
      </p>

      {actionText && onAction && (
        <button
          onClick={onAction}
          className="btn btn-primary"
          style={{ fontSize: '0.82rem', padding: '0.45rem 1rem' }}
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
