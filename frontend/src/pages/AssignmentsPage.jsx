import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import EmptyState from '../components/common/EmptyState';
import { BookOpen, Send, CheckCircle2, Clock, Search, X, Filter } from 'lucide-react';

const AssignmentsPage = () => {
  const toast = useToast();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeAssign, setActiveAssign] = useState(null);
  const [subText, setSubText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'pending' | 'submitted'
  const [search, setSearch] = useState('');

  const fetchAssignments = async () => {
    try {
      const res = await api.get('/student/assignments');
      setAssignments(res.data || []);
    } catch (err) {
      console.error('Failed to load assignments', err);
      toast.error('Failed to load assignments list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    if (!activeAssign) return;
    setSubmitting(true);
    try {
      await api.post(`/student/assignments/${activeAssign.id}/submit`, {
        assignment_id: activeAssign.id,
        submission_text: subText
      });
      toast.success('Assignment submitted successfully!');
      setActiveAssign(null);
      setSubText('');
      fetchAssignments();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAssignments = assignments.filter((item) => {
    if (filterStatus === 'pending' && item.is_submitted) return false;
    if (filterStatus === 'submitted' && !item.is_submitted) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.title?.toLowerCase().includes(q) ||
        item.course_code?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '1rem' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(139, 92, 246, 0.2)', borderTopColor: '#8b5cf6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading Assignments Suite...</span>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="title-gradient" style={{ fontSize: '1.65rem', fontWeight: '800', margin: '0 0 0.25rem 0' }}>
            Course Assignments & Submissions Suite
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
            Submit lab homework, review faculty feedback & scores, and track upcoming deadlines.
          </p>
        </div>

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.4rem 0.75rem', gap: '0.5rem', minWidth: '220px' }}>
          <Search size={15} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search assignments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '0.82rem', width: '100%', fontFamily: 'inherit' }}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setFilterStatus('all')}
          className={`btn ${filterStatus === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
        >
          All ({assignments.length})
        </button>
        <button
          onClick={() => setFilterStatus('pending')}
          className={`btn ${filterStatus === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
        >
          Pending ({assignments.filter(a => !a.is_submitted).length})
        </button>
        <button
          onClick={() => setFilterStatus('submitted')}
          className={`btn ${filterStatus === 'submitted' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
        >
          Submitted ({assignments.filter(a => a.is_submitted).length})
        </button>
      </div>

      {filteredAssignments.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filteredAssignments.map((item) => (
            <div key={item.id} className="card card-interactive">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#a78bfa' }}>{item.course_code}</span>
                <span className={`badge ${item.is_submitted ? 'badge-success' : 'badge-warning'}`}>
                  {item.is_submitted ? 'Submitted' : 'Action Required'}
                </span>
              </div>

              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '0.4rem' }}>{item.title}</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.85rem', lineHeight: 1.45 }}>
                {item.description}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem', padding: '0.4rem 0', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
                <span>Due: <strong>{item.due_date}</strong></span>
                <span>Max: <strong>{item.max_score} pts</strong></span>
              </div>

              {item.is_submitted ? (
                <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '0.75rem', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
                    <CheckCircle2 size={15} color="#34d399" />
                    <p style={{ fontSize: '0.78rem', fontWeight: '700', color: '#34d399', margin: 0 }}>Submitted Solution</p>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontStyle: 'italic', margin: '0 0 0.4rem 0', wordBreak: 'break-word' }}>
                    "{item.submission_text}"
                  </p>
                  {item.score !== null ? (
                    <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#a78bfa', background: 'rgba(139, 92, 246, 0.1)', padding: '0.35rem 0.5rem', borderRadius: '4px' }}>
                      Evaluation: {item.score} / {item.max_score} pts • Feedback: {item.feedback || 'Good effort'}
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Pending faculty evaluation</span>
                  )}
                </div>
              ) : (
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', fontSize: '0.85rem' }}
                  onClick={() => {
                    setActiveAssign(item);
                    setSubText('');
                  }}
                >
                  <Send size={15} /> Submit Solution
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={BookOpen}
          title={search ? "No matching assignments" : filterStatus === 'pending' ? "No pending assignments!" : "No assignments found"}
          description={search ? `No assignment matched "${search}".` : filterStatus === 'pending' ? "You have completed all assigned coursework on time." : "No assignments have been assigned yet."}
          actionText={search || filterStatus !== 'all' ? "Clear Filter" : undefined}
          onAction={() => {
            setSearch('');
            setFilterStatus('all');
          }}
        />
      )}

      {/* Submission Modal */}
      {activeAssign && (
        <div className="modal-overlay" onClick={() => !submitting && setActiveAssign(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#a78bfa', fontWeight: '700' }}>{activeAssign.course_code}</span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0 }}>Submit Solution</h3>
              </div>
              <button
                onClick={() => setActiveAssign(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.85rem', borderRadius: '8px', marginBottom: '1.25rem', border: '1px solid var(--border-color)' }}>
              <p style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 0.25rem 0' }}>{activeAssign.title}</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>{activeAssign.description}</p>
            </div>

            <form onSubmit={handleSubmitAssignment}>
              <div className="form-group">
                <label className="form-label">Solution Content / Code Snippet / Submission Repository Link</label>
                <textarea
                  className="form-textarea"
                  rows="6"
                  value={subText}
                  onChange={(e) => setSubText(e.target.value)}
                  placeholder="Paste your completed solution code, writeup, or GitHub repository URL here..."
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setActiveAssign(null)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting || !subText.trim()}
                >
                  {submitting ? 'Submitting...' : 'Confirm Submission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentsPage;
