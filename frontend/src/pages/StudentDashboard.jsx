import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import RiskBanner from '../components/common/RiskBanner';
import GrowthScoreWidget from '../components/student/GrowthScoreWidget';
import DailyActionsWidget from '../components/student/DailyActionsWidget';
import TrendAnalyticsWidget from '../components/student/TrendAnalyticsWidget';
import StudyPlannerModal from '../components/student/StudyPlannerModal';
import ProfileModal from '../components/common/ProfileModal';
import UserAvatar from '../components/common/UserAvatar';
import EmptyState from '../components/common/EmptyState';
import {
  GraduationCap, Calendar, TrendingUp, BookOpen, BrainCircuit, Sparkles,
  Megaphone, Clock, Camera, CheckCircle2, ChevronRight, Activity, Award, ArrowUpRight
} from 'lucide-react';

const StudentDashboard = ({ setActiveTab }) => {
  const { user } = useAuth();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPlanner, setShowPlanner] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/student/dashboard');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load student dashboard', err);
      toast.error('Failed to load student telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '1rem' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(139, 92, 246, 0.2)', borderTopColor: '#8b5cf6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading Academic Command Center...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page-wrapper">
        <EmptyState
          icon={Activity}
          title="Could not load student dashboard"
          description="Please check if backend server is running and reload."
          actionText="Try Reloading"
          onAction={fetchDashboard}
        />
      </div>
    );
  }

  const { student_info, stats, courses = [], risk_assessment, growth_score_detail, daily_actions = [], upcoming_exams = [], announcements = [] } = data;

  const handleQuickNav = (tabId) => {
    if (setActiveTab) {
      setActiveTab(tabId);
    }
  };

  return (
    <div className="page-wrapper">
      {/* Top Profile & Welcome Header Card */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1.25rem',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem 1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <UserAvatar
            src={user?.avatar_url || student_info?.avatar_url}
            name={student_info?.name || user?.full_name}
            role="student"
            size={64}
            showCamera={true}
            onClick={() => setShowProfileModal(true)}
          />

          <div>
            <h1 className="title-gradient" style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 0.25rem 0' }}>
              Academic Command Center
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
              Student: <strong>{student_info?.name || user?.full_name}</strong> ({student_info?.roll_number}) • {student_info?.department} • Sem {student_info?.semester}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setShowProfileModal(true)}
            style={{ fontSize: '0.82rem' }}
          >
            <Camera size={15} /> Edit Profile & Photo
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowPlanner(true)}
            style={{ fontSize: '0.82rem' }}
          >
            <BrainCircuit size={16} /> Launch AI Study Planner
          </button>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.65rem', letterSpacing: '0.04em' }}>
          Dashboard Quick Actions
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
          <div className="quick-action-card" onClick={() => handleQuickNav('timetable')}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06b6d4', flexShrink: 0 }}>
              <Calendar size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)' }}>Timetable</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Class Schedule</div>
            </div>
            <ChevronRight size={14} color="var(--text-muted)" />
          </div>

          <div className="quick-action-card" onClick={() => handleQuickNav('assignments')}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa', flexShrink: 0 }}>
              <BookOpen size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)' }}>Assignments</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Submit & View Grades</div>
            </div>
            <ChevronRight size={14} color="var(--text-muted)" />
          </div>

          <div className="quick-action-card" onClick={() => handleQuickNav('attendance')}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399', flexShrink: 0 }}>
              <CheckCircle2 size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)' }}>Attendance Logs</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>75% Target Status</div>
            </div>
            <ChevronRight size={14} color="var(--text-muted)" />
          </div>

          <div className="quick-action-card" onClick={() => handleQuickNav('marks')}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24', flexShrink: 0 }}>
              <Award size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)' }}>Internal Marks</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Mid-Sem & Quizzes</div>
            </div>
            <ChevronRight size={14} color="var(--text-muted)" />
          </div>
        </div>
      </div>

      {/* Telemetry Stats Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>OVERALL ATTENDANCE</span>
            <Calendar size={18} color="#06b6d4" />
          </div>
          <p style={{ fontSize: '1.8rem', fontWeight: '800', color: stats.overall_attendance >= 75 ? '#34d399' : '#f87171' }}>
            {stats.overall_attendance}%
          </p>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Target: 75% Institutional Standard</span>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>CUMULATIVE GPA</span>
            <GraduationCap size={18} color="#8b5cf6" />
          </div>
          <p style={{ fontSize: '1.8rem', fontWeight: '800', color: '#a78bfa' }}>
            {stats.gpa ? stats.gpa.toFixed(2) : '0.00'}
          </p>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Target GPA: {student_info.target_gpa ? student_info.target_gpa.toFixed(2) : '3.80'}</span>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>GROWTH SCORE</span>
            <Sparkles size={18} color="#38bdf8" />
          </div>
          <p style={{ fontSize: '1.8rem', fontWeight: '800', color: '#38bdf8' }}>
            {stats.growth_score} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/ 100</span>
          </p>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Tier: {growth_score_detail?.grade_tier || 'Good'}</span>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>RISK EVALUATION</span>
            <BrainCircuit size={18} color={stats.risk_level === 'High Risk' ? '#f87171' : '#34d399'} />
          </div>
          <p style={{ fontSize: '1.4rem', fontWeight: '800', color: stats.risk_level === 'High Risk' ? '#f87171' : '#34d399' }}>
            {stats.risk_level}
          </p>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>ML Classification Output</span>
        </div>
      </div>

      {/* UNIQUE FEATURE #1: Risk Detection Banner */}
      <RiskBanner riskAssessment={risk_assessment} />

      {/* UNIQUE FEATURE #4: Growth Score Card */}
      <GrowthScoreWidget growthDetail={growth_score_detail} />

      {/* UNIQUE FEATURE #2: Smart Daily Action System */}
      <DailyActionsWidget actions={daily_actions} />

      {/* UNIQUE FEATURE #5: Academic Trend Analysis */}
      <TrendAnalyticsWidget />

      {/* Course Roster & Upcoming Exams Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Enrolled Courses Table */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>Enrolled Courses Overview</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{courses.length} Active Courses</span>
          </div>

          {courses.length > 0 ? (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Course Title</th>
                    <th>Credits</th>
                    <th>Attendance</th>
                    <th>Avg Mark</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: '700', color: '#a78bfa' }}>{c.code}</td>
                      <td>{c.title}</td>
                      <td>{c.credits}</td>
                      <td style={{ color: c.attendance_pct >= 75 ? '#34d399' : '#f87171', fontWeight: '700' }}>
                        {c.attendance_pct}%
                      </td>
                      <td>{c.avg_mark_pct}%</td>
                      <td>
                        <span className={`badge ${c.attendance_pct >= 75 ? 'badge-success' : 'badge-danger'}`}>
                          {c.attendance_pct >= 75 ? 'On Track' : 'Below Target'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={BookOpen}
              title="No courses enrolled"
              description="You are currently not enrolled in any active course for this semester."
              compact={true}
            />
          )}
        </div>

        {/* Sidebar Widgets: Upcoming Exams & Announcements */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Upcoming Exams */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Clock size={18} color="#f59e0b" />
              <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>Upcoming Exams</h3>
            </div>

            {upcoming_exams.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {upcoming_exams.map((ex) => (
                  <div key={ex.id} style={{
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)' }}>{ex.title}</span>
                      <span className="badge badge-info" style={{ fontSize: '0.6rem' }}>{ex.course_code}</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{ex.exam_date} • {ex.room}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Clock}
                title="No upcoming exams"
                description="No exams scheduled for the next 30 days."
                compact={true}
              />
            )}
          </div>

          {/* Announcements */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Megaphone size={18} color="#a78bfa" />
              <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>Announcements</h3>
            </div>

            {announcements.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {announcements.map((ann) => (
                  <div key={ann.id} style={{
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)'
                  }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: '700', color: '#a78bfa', marginBottom: '0.2rem' }}>{ann.title}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.35, margin: 0 }}>{ann.content}</p>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.35rem' }}>
                      Posted {ann.created_at ? new Date(ann.created_at).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Megaphone}
                title="No announcements"
                description="No institution broadcast announcements at this time."
                compact={true}
              />
            )}
          </div>
        </div>
      </div>

      {/* Smart Study Planner Modal */}
      {showPlanner && (
        <StudyPlannerModal
          courses={courses}
          onClose={() => setShowPlanner(false)}
        />
      )}

      {/* Profile & Photo Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </div>
  );
};

export default StudentDashboard;
