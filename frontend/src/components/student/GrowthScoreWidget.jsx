import React, { useState } from 'react';
import { Award, TrendingUp, Info, CheckCircle } from 'lucide-react';

const GrowthScoreWidget = ({ growthDetail }) => {
  const [showModal, setShowModal] = useState(false);

  if (!growthDetail) return null;

  const { overall_score, grade_tier, breakdown, tips } = growthDetail;

  return (
    <>
      <div className="card card-interactive" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(17, 24, 39, 0.95) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '1.4rem',
              fontWeight: '800',
              boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)'
            }}>
              {overall_score}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>Student Growth Score</h3>
                <span className="badge badge-info">{grade_tier}</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Multi-factor academic momentum score (Attendance, Marks, Submissions & Consistency)
              </p>
            </div>
          </div>

          <button
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
            onClick={() => setShowModal(true)}
          >
            Score Breakdown <Info size={14} />
          </button>
        </div>
      </div>

      {/* Detail Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={22} color="#a78bfa" />
                <h3 style={{ fontSize: '1.15rem' }}>Student Growth Score Formula</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 'var(--radius-sm)',
              padding: '1rem',
              textAlign: 'center',
              marginBottom: '1.25rem'
            }}>
              <p style={{ fontSize: '2.5rem', fontWeight: '800', color: '#a78bfa' }}>{overall_score} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ 100</span></p>
              <p style={{ fontSize: '0.9rem', fontWeight: '700', color: '#38bdf8' }}>Tier: {grade_tier}</p>
            </div>

            <h4 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '0.75rem' }}>Weighted Factor Breakdown:</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Attendance Rate (30%)</p>
                <p style={{ fontSize: '1.1rem', fontWeight: '700', color: '#34d399' }}>{breakdown?.attendance}%</p>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Internal Marks (35%)</p>
                <p style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fbbf24' }}>{breakdown?.internal_marks}%</p>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Assignment Completion (25%)</p>
                <p style={{ fontSize: '1.1rem', fontWeight: '700', color: '#a78bfa' }}>{breakdown?.assignment_completion}%</p>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Academic Consistency (10%)</p>
                <p style={{ fontSize: '1.1rem', fontWeight: '700', color: '#38bdf8' }}>{breakdown?.academic_consistency}%</p>
              </div>
            </div>

            <h4 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '0.5rem' }}>Growth Recommendations:</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1.25rem' }}>
              {tips?.map((tip, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                  <CheckCircle size={14} color="#34d399" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>

            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Note: The Student Growth Score is an internal productivity metric to encourage regular study habits and is not an official college transcript grade.
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default GrowthScoreWidget;
