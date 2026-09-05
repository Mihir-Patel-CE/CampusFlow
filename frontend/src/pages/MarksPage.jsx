import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import EmptyState from '../components/common/EmptyState';
import { Award, TrendingUp, Search, Layers, CheckCircle2 } from 'lucide-react';

const MarksPage = () => {
  const toast = useToast();
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchMarks = async () => {
      try {
        const res = await api.get('/student/marks');
        setMarks(res.data || []);
      } catch (err) {
        console.error('Failed to load marks', err);
        toast.error('Failed to load internal assessment marks.');
      } finally {
        setLoading(false);
      }
    };
    fetchMarks();
  }, []);

  const filteredMarks = marks.filter(m =>
    m.course_code?.toLowerCase().includes(search.toLowerCase()) ||
    m.title?.toLowerCase().includes(search.toLowerCase())
  );

  const avgPercentage = marks.length > 0
    ? (marks.reduce((acc, m) => acc + (m.percentage || 0), 0) / marks.length).toFixed(1)
    : '0.0';

  if (loading) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '1rem' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(139, 92, 246, 0.2)', borderTopColor: '#8b5cf6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading Internal Assessment Records...</span>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="title-gradient" style={{ fontSize: '1.65rem', fontWeight: '800', margin: '0 0 0.25rem 0' }}>
            Internal Assessment & Gradebook Records
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
            Detailed breakdown of mid-term examinations, continuous evaluations, quizzes, and practical tests.
          </p>
        </div>

        {/* Quick Summary Pill & Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          <div style={{ padding: '0.4rem 0.85rem', background: 'rgba(139, 92, 246, 0.12)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={16} color="#a78bfa" />
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Avg Performance:</span>
            <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#a78bfa' }}>{avgPercentage}%</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.4rem 0.75rem', gap: '0.5rem', minWidth: '220px' }}>
            <Search size={15} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search assessment..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '0.82rem', width: '100%', fontFamily: 'inherit' }}
            />
          </div>
        </div>
      </div>

      <div className="card">
        {filteredMarks.length > 0 ? (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Course Code</th>
                  <th>Assessment Title</th>
                  <th>Score</th>
                  <th>Max Score</th>
                  <th>Percentage</th>
                  <th>Weightage</th>
                  <th>Evaluation Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredMarks.map((m) => (
                  <tr key={m.id}>
                    <td style={{ fontWeight: '700', color: '#a78bfa' }}>{m.course_code}</td>
                    <td style={{ fontWeight: '600' }}>{m.title}</td>
                    <td style={{ fontWeight: '800', color: 'var(--text-primary)' }}>{m.score}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{m.max_score}</td>
                    <td style={{ fontWeight: '800', color: m.percentage >= 75 ? '#34d399' : m.percentage >= 60 ? '#fbbf24' : '#f87171' }}>
                      {m.percentage}%
                    </td>
                    <td>{m.weightage}%</td>
                    <td>
                      <span className={`badge ${m.percentage >= 75 ? 'badge-success' : m.percentage >= 60 ? 'badge-warning' : 'badge-danger'}`}>
                        {m.percentage >= 75 ? 'Mastery' : m.percentage >= 60 ? 'Satisfactory' : 'Action Required'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={Award}
            title={search ? "No assessments match your search" : "No assessment marks recorded"}
            description={search ? `No assessment found for "${search}".` : "Faculty evaluations and internal grades have not been uploaded yet."}
            actionText={search ? "Reset Search" : undefined}
            onAction={search ? () => setSearch('') : undefined}
          />
        )}
      </div>
    </div>
  );
};

export default MarksPage;
