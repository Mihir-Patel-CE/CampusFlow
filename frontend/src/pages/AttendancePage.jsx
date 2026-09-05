import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import EmptyState from '../components/common/EmptyState';
import { Calendar, CheckCircle2, AlertCircle, Search, Filter } from 'lucide-react';

const AttendancePage = () => {
  const toast = useToast();
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const res = await api.get('/student/attendance');
        setAttendanceData(res.data || []);
      } catch (err) {
        console.error('Failed to load attendance', err);
        toast.error('Failed to load attendance records.');
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, []);

  const filteredData = attendanceData.filter(course =>
    course.course_title?.toLowerCase().includes(search.toLowerCase()) ||
    course.course_code?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '1rem' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(139, 92, 246, 0.2)', borderTopColor: '#8b5cf6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading Subject Attendance Analytics...</span>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="title-gradient" style={{ fontSize: '1.65rem', fontWeight: '800', margin: '0 0 0.25rem 0' }}>
            Subject Attendance Analytics & Logs
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
            Detailed class attendance history and institutional 75% target threshold monitoring.
          </p>
        </div>

        {/* Search input */}
        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.4rem 0.75rem', gap: '0.5rem', minWidth: '220px' }}>
          <Search size={15} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Filter subjects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '0.82rem', width: '100%', fontFamily: 'inherit' }}
          />
        </div>
      </div>

      {filteredData.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filteredData.map((course) => (
            <div key={course.course_id} className="card card-interactive">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#a78bfa' }}>{course.course_code}</span>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginTop: '0.15rem' }}>{course.course_title}</h3>
                </div>
                <span className={`badge ${course.attendance_pct >= 75 ? 'badge-success' : 'badge-danger'}`}>
                  {course.attendance_pct}%
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '1rem', background: 'rgba(255,255,255,0.02)', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>Total Classes</p>
                  <p style={{ fontSize: '1.1rem', fontWeight: '800', margin: '0.2rem 0 0 0' }}>{course.total_classes}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>Present</p>
                  <p style={{ fontSize: '1.1rem', fontWeight: '800', color: '#34d399', margin: '0.2rem 0 0 0' }}>{course.present_count}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>Absent</p>
                  <p style={{ fontSize: '1.1rem', fontWeight: '800', color: '#f87171', margin: '0.2rem 0 0 0' }}>{course.absent_count}</p>
                </div>
              </div>

              <h4 style={{ fontSize: '0.78rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Recent Class Logs ({course.logs?.length || 0})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '140px', overflowY: 'auto' }}>
                {course.logs && course.logs.length > 0 ? (
                  course.logs.map((log) => (
                    <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', padding: '0.4rem 0.65rem', background: 'rgba(0,0,0,0.25)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.03)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{log.date}</span>
                      <span className={`badge ${log.status === 'present' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.62rem', padding: '0.1rem 0.4rem' }}>
                        {log.status.toUpperCase()}
                      </span>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0.5rem' }}>
                    No recorded attendance logs yet
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Calendar}
          title={search ? "No matching courses found" : "No attendance data available"}
          description={search ? `No course matched query "${search}".` : "Attendance records have not been published by your course faculty yet."}
          actionText={search ? "Clear Filter" : undefined}
          onAction={search ? () => setSearch('') : undefined}
        />
      )}
    </div>
  );
};

export default AttendancePage;
