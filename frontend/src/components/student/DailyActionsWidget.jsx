import React from 'react';
import { CheckCircle2, Clock, AlertCircle, ArrowUpRight, Flame } from 'lucide-react';

const DailyActionsWidget = ({ actions = [] }) => {
  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            padding: '0.4rem',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(139, 92, 246, 0.15)',
            color: '#a78bfa'
          }}>
            <Flame size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>What Should I Do Today?</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Smart Daily Prioritized Action System</p>
          </div>
        </div>

        <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
          {actions.length} Tasks Prioritized
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {actions.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
            No pending urgent tasks today. Great job staying caught up!
          </p>
        ) : (
          actions.map((item) => {
            const isHigh = item.priority === 'High';
            const isMed = item.priority === 'Medium';

            return (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1rem',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  borderLeft: `4px solid ${isHigh ? '#f43f5e' : isMed ? '#f59e0b' : '#10b981'}`,
                  borderRadius: 'var(--radius-sm)',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{
                    color: isHigh ? '#f87171' : isMed ? '#fbbf24' : '#34d399',
                    display: 'flex'
                  }}>
                    {isHigh ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.15rem' }}>
                      <p style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {item.title}
                      </p>
                      {item.course_code && (
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: '700',
                          padding: '0.1rem 0.4rem',
                          borderRadius: '4px',
                          background: 'rgba(255, 255, 255, 0.06)',
                          color: 'var(--text-secondary)'
                        }}>
                          {item.course_code}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={12} /> {item.due_info || 'Today'}
                      </span>
                      <span>Category: {item.category}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span className={`badge ${isHigh ? 'badge-high-risk' : isMed ? 'badge-medium-risk' : 'badge-low-risk'}`} style={{ fontSize: '0.65rem' }}>
                    {item.priority} Priority
                  </span>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                    onClick={() => alert(`Starting action: ${item.title}`)}
                  >
                    Action <ArrowUpRight size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default DailyActionsWidget;
