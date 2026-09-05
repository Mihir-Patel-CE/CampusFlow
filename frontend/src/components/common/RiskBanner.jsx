import React from 'react';
import { AlertTriangle, ShieldCheck, Info, Sparkles } from 'lucide-react';

const RiskBanner = ({ riskAssessment }) => {
  if (!riskAssessment) return null;

  const { risk_level, risk_score, key_factors } = riskAssessment;

  const isHigh = risk_level === 'High Risk';
  const isMedium = risk_level === 'Medium Risk';

  const badgeClass = isHigh ? 'badge-high-risk' : isMedium ? 'badge-medium-risk' : 'badge-low-risk';
  const borderColor = isHigh ? 'rgba(244, 63, 94, 0.4)' : isMedium ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.4)';
  const bgGradient = isHigh
    ? 'linear-gradient(135deg, rgba(244, 63, 94, 0.12) 0%, rgba(17, 24, 39, 0.9) 100%)'
    : isMedium
    ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(17, 24, 39, 0.9) 100%)'
    : 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(17, 24, 39, 0.9) 100%)';

  return (
    <div className="card" style={{
      background: bgGradient,
      border: `1px solid ${borderColor}`,
      marginBottom: '1.5rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flex: 1, minWidth: '280px' }}>
          <div style={{
            padding: '0.6rem',
            borderRadius: 'var(--radius-sm)',
            background: isHigh ? 'rgba(244, 63, 94, 0.2)' : isMedium ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
            color: isHigh ? '#f87171' : isMedium ? '#fbbf24' : '#34d399'
          }}>
            {isHigh ? <AlertTriangle size={24} /> : isMedium ? <Info size={24} /> : <ShieldCheck size={24} />}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>Smart Academic Risk Detection</h3>
              <span className={`badge ${badgeClass}`}>{risk_level}</span>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Scikit-learn ML Model prediction based on attendance, marks trend, and assignment telemetry.
            </p>

            {/* Contributing factors callout */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Key Contributing Factors:
              </p>
              {key_factors && key_factors.map((factor, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <span style={{ color: isHigh ? '#f87171' : isMedium ? '#fbbf24' : '#34d399', fontWeight: '700' }}>•</span>
                  <span>{factor}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Support disclaimer notice */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.75rem 1rem',
          maxWidth: '280px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-cyan)', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.25rem' }}>
            <Sparkles size={14} />
            <span>Academic Support Notice</span>
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            This is an automated academic support assessment to assist students early, not an official grade or academic penalty.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RiskBanner;
