import React, { useState } from 'react';
import { BrainCircuit, Calendar, Clock, BookOpen, Sparkles } from 'lucide-react';
import api from '../../services/api';

const StudyPlannerModal = ({ courses = [], onClose }) => {
  const [examTitle, setExamTitle] = useState('Operating Systems End-Sem Exam');
  const [examDate, setExamDate] = useState('2026-09-20');
  const [hoursPerDay, setHoursPerDay] = useState(4.0);
  const [prepLevels, setPrepLevels] = useState({});
  const [loading, setLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState(null);

  const handleLevelChange = (courseId, level) => {
    setPrepLevels(prev => ({ ...prev, [courseId]: level }));
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const subjectIds = courses.map(c => c.id);
      const res = await api.post('/student/study-plan/generate', {
        exam_title: examTitle,
        exam_date: examDate,
        available_hours_per_day: parseFloat(hoursPerDay),
        subject_ids: subjectIds,
        preparation_levels: prepLevels
      });
      setGeneratedPlan(res.data);
    } catch (err) {
      alert('Failed to generate study plan. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              padding: '0.4rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(6, 182, 212, 0.15)',
              color: '#38bdf8'
            }}>
              <BrainCircuit size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem' }}>Smart Study Planner Generator</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Prioritized exam preparation schedule generator
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
        </div>

        {!generatedPlan ? (
          <form onSubmit={handleGenerate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Exam Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Exam Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Daily Available Study Hours: ({hoursPerDay} hrs/day)</label>
              <input
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={hoursPerDay}
                onChange={(e) => setHoursPerDay(e.target.value)}
                style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
              />
            </div>

            <h4 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '0.75rem' }}>Current Preparation Level per Subject:</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
              {courses.map((course) => (
                <div key={course.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.85rem',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)' }}>{course.code}</span> - {course.title}
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {['Low', 'Medium', 'High'].map((lvl) => {
                      const selected = (prepLevels[course.id] || 'Medium') === lvl;
                      return (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => handleLevelChange(course.id, lvl)}
                          style={{
                            padding: '0.25rem 0.6rem',
                            fontSize: '0.75rem',
                            borderRadius: '4px',
                            border: '1px solid var(--border-color)',
                            background: selected ? 'rgba(139, 92, 246, 0.25)' : 'transparent',
                            color: selected ? '#a78bfa' : 'var(--text-muted)',
                            fontWeight: selected ? '700' : '400',
                            cursor: 'pointer'
                          }}
                        >
                          {lvl}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Generating Schedule...' : 'Generate Personalized Study Schedule'} <Sparkles size={16} />
            </button>
          </form>
        ) : (
          <div>
            <div style={{
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(17, 24, 39, 0.9) 100%)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              marginBottom: '1.25rem'
            }}>
              <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#38bdf8', marginBottom: '0.25rem' }}>{generatedPlan.exam_title} Schedule</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Exam Date: {generatedPlan.exam_date} | Prep Window: {generatedPlan.total_days} Days ({generatedPlan.total_study_hours} total hrs)
              </p>
            </div>

            <h4 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '0.6rem' }}>Allocated Subject Focus Breakdown:</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
              {generatedPlan.subject_breakdown.map((sb, idx) => (
                <div key={idx} style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.75rem'
                }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: '700', color: '#a78bfa' }}>{sb.course_code}</p>
                  <p style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-primary)' }}>{sb.allocated_hours} hrs</p>
                  <span className="badge badge-info" style={{ fontSize: '0.6rem', marginTop: '0.25rem' }}>{sb.priority_label}</span>
                </div>
              ))}
            </div>

            <h4 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '0.6rem' }}>Daily Study Roadmap (Next 7 Days):</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '250px', overflowY: 'auto', marginBottom: '1.25rem' }}>
              {generatedPlan.daily_roadmap.slice(0, 7).map((day) => (
                <div key={day.day_number} style={{
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                      Day {day.day_number} - {day.day_name} ({day.date})
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>{day.daily_hours} Study Hours</span>
                  </div>

                  {day.sessions.map((sess, sIdx) => (
                    <div key={sIdx} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '0.5rem', marginBottom: '0.15rem' }}>
                      • <strong>[{sess.course_code}]</strong> {sess.topic} ({sess.duration_hours} hrs)
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setGeneratedPlan(null)}>
                Modify Inputs
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={onClose}>
                Save Plan to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyPlannerModal;
