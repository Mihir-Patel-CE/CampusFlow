import React, { useState, useEffect } from 'react';
import api, { getAvatarUrl, DEFAULT_AVATAR } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ProfileModal from '../components/common/ProfileModal';
import {
  Users, TrendingUp, BookOpen, AlertTriangle, Send, Plus, Check, Camera,
  Calendar, CheckCircle2, Search, Filter, RefreshCw, BarChart3, Building,
  GraduationCap, Award, Activity, User, ChevronRight, X, Clock, MapPin,
  Edit2, Trash2
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const FacultyDashboard = ({ activeTab: propActiveTab, setActiveTab: propSetActiveTab }) => {
  const { user } = useAuth();

  // Active view tab state (synced with sidebar prop)
  const [activeTab, setActiveTabLocal] = useState(propActiveTab || 'dashboard');

  useEffect(() => {
    if (propActiveTab) {
      setActiveTabLocal(propActiveTab);
    }
  }, [propActiveTab]);

  const handleTabChange = (tabId) => {
    setActiveTabLocal(tabId);
    if (propSetActiveTab) {
      propSetActiveTab(tabId);
    }
  };

  // Data states
  const [overview, setOverview] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseStudents, setCourseStudents] = useState([]);
  const [allFacultyStudents, setAllFacultyStudents] = useState([]);
  const [atRiskStudents, setAtRiskStudents] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Student directory filters for faculty
  const [studentSearch, setStudentSearch] = useState('');
  const [studentSemFilter, setStudentSemFilter] = useState('');
  const [studentCourseFilter, setStudentCourseFilter] = useState('');

  // Attendance form states
  const [attDate, setAttDate] = useState(new Date().toISOString().split('T')[0]);
  const [attStatusMap, setAttStatusMap] = useState({});
  const [submittingAtt, setSubmittingAtt] = useState(false);

  // Marks form state
  const [markStudentId, setMarkStudentId] = useState('');
  const [markTitle, setMarkTitle] = useState('Mid-Term Examination');
  const [markScore, setMarkScore] = useState('25');
  const [markMax, setMarkMax] = useState('30');

  // Assignment form state
  const [assignTitle, setAssignTitle] = useState('');
  const [assignDesc, setAssignDesc] = useState('');
  const [assignDueDate, setAssignDueDate] = useState('');

  // Timetable form / modal states
  const [showAddTimetableModal, setShowAddTimetableModal] = useState(false);
  const [editingTimetableItem, setEditingTimetableItem] = useState(null);
  const [deletingTimetableId, setDeletingTimetableId] = useState(null);
  const [ttDayFilter, setTtDayFilter] = useState('All');
  const [ttCourseId, setTtCourseId] = useState('');
  const [ttDay, setTtDay] = useState('Monday');
  const [ttStartTime, setTtStartTime] = useState('09:00 AM');
  const [ttEndTime, setTtEndTime] = useState('10:30 AM');
  const [ttRoom, setTtRoom] = useState('LH-101');
  const [savingTimetable, setSavingTimetable] = useState(false);

  // Toast notification
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3500);
  };

  const loadFacultyData = async () => {
    try {
      setRefreshing(true);
      const [oRes, cRes, sRes, rRes, tRes] = await Promise.all([
        api.get('/faculty/overview'),
        api.get('/faculty/courses'),
        api.get('/faculty/students'),
        api.get('/faculty/at-risk-students'),
        api.get('/faculty/timetable')
      ]);

      setOverview(oRes.data);
      setCourses(cRes.data);
      setAllFacultyStudents(sRes.data);
      setAtRiskStudents(rRes.data);
      setTimetable(tRes.data);

      if (cRes.data.length > 0) {
        const defaultCourse = selectedCourse ? cRes.data.find(c => c.id === selectedCourse.id) || cRes.data[0] : cRes.data[0];
        setSelectedCourse(defaultCourse);
        fetchCourseStudents(defaultCourse.id);
        if (!ttCourseId) setTtCourseId(String(defaultCourse.id));
      }
    } catch (err) {
      console.error('Failed to fetch faculty data', err);
      showToast('Failed to load faculty console data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchCourseStudents = async (courseId) => {
    try {
      const res = await api.get(`/faculty/courses/${courseId}/students`);
      setCourseStudents(res.data);

      // Default attendance status to 'present'
      const initMap = {};
      res.data.forEach(s => {
        initMap[s.student_id] = 'present';
      });
      setAttStatusMap(initMap);
    } catch (err) {
      console.error('Failed to load course students', err);
    }
  };

  useEffect(() => {
    loadFacultyData();
  }, []);

  const handleCourseSelect = (course) => {
    setSelectedCourse(course);
    fetchCourseStudents(course.id);
  };

  const toggleAttStatus = (studentId) => {
    setAttStatusMap(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'present' ? 'absent' : 'present'
    }));
  };

  const handleBatchAttendance = async () => {
    if (!selectedCourse) return;
    setSubmittingAtt(true);
    try {
      const records = Object.keys(attStatusMap).map(sId => ({
        student_id: parseInt(sId, 10),
        status: attStatusMap[sId]
      }));

      await api.post('/faculty/attendance/batch', {
        course_id: selectedCourse.id,
        date: attDate,
        records: records
      });

      showToast('Batch attendance updated successfully!');
      fetchCourseStudents(selectedCourse.id);
      loadFacultyData();
    } catch (err) {
      showToast('Failed to update attendance records.', 'error');
    } finally {
      setSubmittingAtt(false);
    }
  };

  const handleAddMark = async (e) => {
    e.preventDefault();
    if (!selectedCourse || !markStudentId) {
      showToast('Please select a student', 'error');
      return;
    }
    try {
      await api.post('/faculty/marks', {
        student_id: parseInt(markStudentId, 10),
        course_id: selectedCourse.id,
        title: markTitle,
        score: parseFloat(markScore),
        max_score: parseFloat(markMax),
        weightage: 15.0
      });
      showToast('Internal mark recorded successfully!');
      setMarkScore('');
      loadFacultyData();
    } catch (err) {
      showToast('Failed to record internal mark.', 'error');
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!selectedCourse) {
      showToast('Please select a course', 'error');
      return;
    }
    try {
      await api.post('/faculty/assignments', {
        course_id: selectedCourse.id,
        title: assignTitle,
        description: assignDesc,
        due_date: new Date(assignDueDate).toISOString(),
        max_score: 100.0
      });
      showToast('Assignment published successfully!');
      setAssignTitle('');
      setAssignDesc('');
      setAssignDueDate('');
      loadFacultyData();
    } catch (err) {
      showToast('Failed to publish assignment.', 'error');
    }
  };

  // Timetable Create / Edit Handlers
  const handleOpenAddTimetable = () => {
    setEditingTimetableItem(null);
    setTtCourseId(courses.length > 0 ? String(courses[0].id) : '');
    setTtDay('Monday');
    setTtStartTime('09:00 AM');
    setTtEndTime('10:30 AM');
    setTtRoom('LH-101');
    setShowAddTimetableModal(true);
  };

  const handleOpenEditTimetable = (item) => {
    setEditingTimetableItem(item);
    setTtCourseId(String(item.course_id));
    setTtDay(item.day_of_week);
    setTtStartTime(item.start_time);
    setTtEndTime(item.end_time);
    setTtRoom(item.room);
    setShowAddTimetableModal(true);
  };

  const handleSaveTimetableEntry = async (e) => {
    e.preventDefault();
    if (!ttCourseId) {
      showToast('Please select a course', 'error');
      return;
    }
    setSavingTimetable(true);
    try {
      if (editingTimetableItem) {
        await api.put(`/faculty/timetable/${editingTimetableItem.id}`, {
          course_id: parseInt(ttCourseId, 10),
          day_of_week: ttDay,
          start_time: ttStartTime,
          end_time: ttEndTime,
          room: ttRoom
        });
        showToast('Timetable entry updated successfully!');
      } else {
        await api.post('/faculty/timetable', {
          course_id: parseInt(ttCourseId, 10),
          day_of_week: ttDay,
          start_time: ttStartTime,
          end_time: ttEndTime,
          room: ttRoom
        });
        showToast('Timetable entry added successfully!');
      }
      setShowAddTimetableModal(false);
      setEditingTimetableItem(null);
      // Reload timetable
      const tRes = await api.get('/faculty/timetable');
      setTimetable(tRes.data);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to save timetable entry.';
      showToast(msg, 'error');
    } finally {
      setSavingTimetable(false);
    }
  };

  const handleDeleteTimetable = async (id) => {
    try {
      await api.delete(`/faculty/timetable/${id}`);
      showToast('Timetable entry deleted successfully!');
      setDeletingTimetableId(null);
      const tRes = await api.get('/faculty/timetable');
      setTimetable(tRes.data);
    } catch (err) {
      showToast('Failed to delete timetable entry.', 'error');
    }
  };

  // Filtered Students in Faculty's Authorized Scope
  const filteredStudents = allFacultyStudents.filter(s => {
    if (studentSemFilter && String(s.semester_number) !== String(studentSemFilter)) return false;
    if (studentCourseFilter && !s.enrolled_courses.some(c => c.includes(studentCourseFilter))) return false;
    if (studentSearch) {
      const q = studentSearch.toLowerCase();
      const matchName = s.full_name?.toLowerCase().includes(q);
      const matchEmail = s.email?.toLowerCase().includes(q);
      const matchRoll = s.roll_number?.toLowerCase().includes(q);
      const matchDept = s.department_name?.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchRoll && !matchDept) return false;
    }
    return true;
  });

  // Filtered Timetable entries
  const filteredTimetable = timetable.filter(item => {
    if (ttDayFilter !== 'All' && item.day_of_week !== ttDayFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(6, 182, 212, 0.2)', borderTopColor: '#06b6d4', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading Faculty Console...</span>
      </div>
    );
  }

  const facultyInfo = overview?.faculty_info || {
    name: user?.full_name,
    email: user?.email,
    employee_id: user?.identifier || 'FAC-101',
    designation: 'Assistant Professor',
    department_name: user?.department || 'Engineering',
    department_code: 'CSE',
    office_hours: 'Mon, Wed 10:00 AM - 12:00 PM',
    avatar_url: user?.avatar_url
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '3rem' }}>
      {/* Toast Notification */}
      {toast.show && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          zIndex: 9999,
          background: toast.type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(16, 185, 129, 0.95)',
          color: '#ffffff',
          padding: '0.85rem 1.4rem',
          borderRadius: 'var(--radius-sm)',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          fontWeight: '600',
          fontSize: '0.88rem',
          backdropFilter: 'blur(8px)',
          animation: 'slideUp 0.3s ease'
        }}>
          {toast.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          {toast.message}
        </div>
      )}

      {/* Top Header & Faculty Info Banner */}
      <div className="card glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div
            onClick={() => setShowProfileModal(true)}
            style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}
            title="Click to Upload / Change Profile Photo"
          >
            <img
              src={getAvatarUrl(facultyInfo.avatar_url, facultyInfo.name)}
              alt={facultyInfo.name}
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = DEFAULT_AVATAR; }}
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid #06b6d4',
                boxShadow: '0 4px 15px rgba(6, 182, 212, 0.3)',
                background: '#1e293b'
              }}
            />
            <div style={{
              position: 'absolute', bottom: -2, right: -2,
              background: 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%)',
              borderRadius: '50%',
              width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Camera size={11} color="#fff" />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '800', margin: 0 }} className="title-gradient">
                {facultyInfo.name}
              </h2>
              <span className="badge badge-info">{facultyInfo.designation}</span>
              <span className="badge badge-success">{facultyInfo.department_name} ({facultyInfo.department_code})</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.25rem', margin: 0 }}>
              ID: <strong style={{ color: '#a78bfa' }}>{facultyInfo.employee_id}</strong> • {facultyInfo.email} • Office Hours: {facultyInfo.office_hours || 'Mon, Wed 10:00 AM - 12:00 PM'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={loadFacultyData}
            className="btn btn-secondary"
            disabled={refreshing}
            style={{ fontSize: '0.8rem', padding: '0.5rem 0.9rem' }}
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={() => setShowProfileModal(true)}
            className="btn btn-primary"
            style={{ fontSize: '0.8rem', padding: '0.5rem 0.9rem' }}
          >
            <Camera size={14} /> Profile Photo
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. FACULTY OVERVIEW TAB (dashboard) */}
      {/* ========================================================================= */}
      {activeTab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Quick Metrics Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="card glass-panel" style={{ padding: '1.25rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Authorized Students</span>
              <h3 style={{ fontSize: '1.7rem', fontWeight: '800', color: '#38bdf8', margin: '0.2rem 0' }}>
                {overview?.summary?.total_students ?? allFacultyStudents.length}
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#34d399' }}>● In assigned courses</span>
            </div>

            <div className="card glass-panel" style={{ padding: '1.25rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Assigned Subjects</span>
              <h3 style={{ fontSize: '1.7rem', fontWeight: '800', color: '#a78bfa', margin: '0.2rem 0' }}>
                {overview?.summary?.total_courses ?? courses.length}
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>● Active curriculum</span>
            </div>

            <div className="card glass-panel" style={{ padding: '1.25rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Average Class GPA</span>
              <h3 style={{ fontSize: '1.7rem', fontWeight: '800', color: '#fbbf24', margin: '0.2rem 0' }}>
                {overview?.summary?.avg_gpa || 3.45}
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#34d399' }}>● Academic index</span>
            </div>

            <div className="card glass-panel" style={{ padding: '1.25rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Average Attendance</span>
              <h3 style={{ fontSize: '1.7rem', fontWeight: '800', color: '#34d399', margin: '0.2rem 0' }}>
                {overview?.summary?.overall_attendance_pct || 88.5}%
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>● Course verified</span>
            </div>

            <div className="card glass-panel" style={{ padding: '1.25rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>At-Risk Flagged</span>
              <h3 style={{ fontSize: '1.7rem', fontWeight: '800', color: '#f87171', margin: '0.2rem 0' }}>
                {overview?.summary?.at_risk_students ?? atRiskStudents.length}
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#f87171' }}>● Need attention</span>
            </div>
          </div>

          {/* 4 Working Real Database Recharts Graphs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>
            {/* 1. Students by Department */}
            <div className="card glass-panel" style={{ padding: '1.5rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building size={16} color="#8b5cf6" /> Students by Department
              </h4>
              <div style={{ height: '260px', width: '100%', minHeight: '260px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={overview?.analytics?.students_by_department || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="department_code" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                      formatter={(val) => [`${val} Students`, 'Total Students']}
                    />
                    <Bar dataKey="student_count" name="Students" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 2. Students by Semester */}
            <div className="card glass-panel" style={{ padding: '1.5rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={16} color="#38bdf8" /> Students by Semester
              </h4>
              <div style={{ height: '260px', width: '100%', minHeight: '260px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={overview?.analytics?.students_by_semester || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="semester" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                      formatter={(val) => [`${val} Students`, 'Semester Count']}
                    />
                    <Bar dataKey="student_count" name="Enrolled Students" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 3. Course-wise Performance & Attendance */}
            <div className="card glass-panel" style={{ padding: '1.5rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={16} color="#34d399" /> Academic & Attendance Performance by Course
              </h4>
              <div style={{ height: '260px', width: '100%', minHeight: '260px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={overview?.analytics?.course_performance || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="course_code" stroke="#94a3b8" />
                    <YAxis domain={[0, 100]} stroke="#94a3b8" />
                    <Tooltip contentStyle={{ background: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }} />
                    <Legend />
                    <Bar dataKey="avg_marks_pct" name="Avg Marks %" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="avg_attendance_pct" name="Attendance %" fill="#34d399" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 4. Attendance Overview Distribution */}
            <div className="card glass-panel" style={{ padding: '1.5rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={16} color="#fbbf24" /> Overall Attendance Distribution
              </h4>
              <div style={{ height: '260px', width: '100%', minHeight: '260px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={overview?.analytics?.attendance_overview || [
                        { name: 'Present', count: 90, color: '#34d399' },
                        { name: 'Absent', count: 10, color: '#f87171' }
                      ]}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, count }) => `${name}: ${count}`}
                    >
                      {(overview?.analytics?.attendance_overview || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Assigned Courses Section */}
          <div className="card glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen size={18} color="#06b6d4" /> My Assigned Subjects & Courses
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
              {courses.map((c) => {
                const isSelected = selectedCourse?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => handleCourseSelect(c)}
                    className="card"
                    style={{
                      borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-color)',
                      background: isSelected ? 'rgba(139, 92, 246, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      padding: '1.25rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <span className="badge badge-info">{c.code}</span>
                      <span className="badge badge-warning">Sem {c.semester}</span>
                    </div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#fff', margin: '0.3rem 0' }}>
                      {c.title}
                    </h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                      <span>👥 {c.enrolled_students} Students</span>
                      <span>📊 {c.avg_attendance_pct}% Att.</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Complete Student Directory (Authorized Scope) */}
          <div className="card glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>
                  Authorized Students Directory ({allFacultyStudents.length})
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                  Students currently enrolled in your assigned subjects and department.
                </p>
              </div>

              {/* Filters */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', minWidth: '220px' }}>
                  <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: '2.2rem', height: '36px', fontSize: '0.82rem' }}
                    placeholder="Search name, roll no, email..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                  />
                </div>

                <select
                  className="form-select"
                  style={{ width: '140px', height: '36px', fontSize: '0.82rem' }}
                  value={studentSemFilter}
                  onChange={(e) => setStudentSemFilter(e.target.value)}
                >
                  <option value="">All Semesters</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                    <option key={s} value={s}>Sem {s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Students Table */}
            <div className="table-container" style={{ padding: 0 }}>
              <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                    <th style={{ padding: '0.8rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Student</th>
                    <th style={{ padding: '0.8rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Roll No</th>
                    <th style={{ padding: '0.8rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Department</th>
                    <th style={{ padding: '0.8rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Semester</th>
                    <th style={{ padding: '0.8rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>GPA</th>
                    <th style={{ padding: '0.8rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Attendance</th>
                    <th style={{ padding: '0.8rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Risk Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                        No enrolled students matching the filter.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((st) => (
                      <tr key={st.student_id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <img
                              src={getAvatarUrl(st.avatar_url, st.full_name)}
                              alt={st.full_name}
                              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = DEFAULT_AVATAR; }}
                              style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-color)' }}
                            />
                            <div>
                              <div style={{ fontWeight: '600', color: '#fff', fontSize: '0.88rem' }}>{st.full_name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{st.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: '700', color: '#a78bfa', fontSize: '0.85rem' }}>
                          {st.roll_number}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                          {st.department_name}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>Sem {st.semester_number}</span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: '600', color: '#fbbf24', fontSize: '0.85rem' }}>
                          {st.gpa}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: '700', color: st.attendance_pct >= 75 ? '#34d399' : '#f87171', fontSize: '0.85rem' }}>
                          {st.attendance_pct}%
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span className={`badge ${st.risk_level === 'High Risk' ? 'badge-danger' : st.risk_level === 'Medium Risk' ? 'badge-warning' : 'badge-success'}`}>
                            {st.risk_level}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MARK ATTENDANCE TAB (attendance-management) */}
      {/* ========================================================================= */}
      {activeTab === 'attendance-management' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '700', margin: 0 }}>
                  Batch Attendance Entry
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Select course and date to record daily classroom attendance.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <select
                  className="form-select"
                  style={{ width: '220px', height: '38px', fontSize: '0.85rem' }}
                  value={selectedCourse?.id || ''}
                  onChange={(e) => {
                    const c = courses.find(item => String(item.id) === String(e.target.value));
                    if (c) handleCourseSelect(c);
                  }}
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.code} - {c.title}</option>
                  ))}
                </select>

                <input
                  type="date"
                  className="form-input"
                  value={attDate}
                  onChange={(e) => setAttDate(e.target.value)}
                  style={{ width: '160px', height: '38px', fontSize: '0.85rem' }}
                />

                <button
                  className="btn btn-primary"
                  onClick={handleBatchAttendance}
                  disabled={submittingAtt || !selectedCourse}
                  style={{ height: '38px' }}
                >
                  {submittingAtt ? 'Saving...' : 'Submit Attendance'} <Check size={16} />
                </button>
              </div>
            </div>

            {/* Attendance Table */}
            <div className="table-container" style={{ padding: 0 }}>
              <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                    <th style={{ padding: '0.8rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Roll No</th>
                    <th style={{ padding: '0.8rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Student Name</th>
                    <th style={{ padding: '0.8rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Email</th>
                    <th style={{ padding: '0.8rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Current Att %</th>
                    <th style={{ padding: '0.8rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status for {attDate}</th>
                  </tr>
                </thead>
                <tbody>
                  {courseStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                        No enrolled students found for the selected course.
                      </td>
                    </tr>
                  ) : (
                    courseStudents.map((s) => {
                      const status = attStatusMap[s.student_id] || 'present';
                      return (
                        <tr key={s.student_id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: '700', color: '#a78bfa' }}>{s.roll_number}</td>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: '600', color: '#fff' }}>{s.full_name}</td>
                          <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>{s.email}</td>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: '700', color: s.attendance_pct >= 75 ? '#34d399' : '#f87171' }}>
                            {s.attendance_pct}%
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <button
                              type="button"
                              onClick={() => toggleAttStatus(s.student_id)}
                              className={`btn ${status === 'present' ? 'btn-primary' : 'btn-danger'}`}
                              style={{ padding: '0.3rem 0.8rem', fontSize: '0.78rem' }}
                            >
                              {status === 'present' ? '✓ Present' : '✕ Absent'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. INTERNAL GRADEBOOK TAB (marks-entry) */}
      {/* ========================================================================= */}
      {activeTab === 'marks-entry' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', flexWrap: 'wrap' }}>
          {/* Record Marks Form */}
          <div className="card glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={18} color="#8b5cf6" /> Record Internal Assessment Score
            </h3>

            <form onSubmit={handleAddMark}>
              <div className="form-group">
                <label className="form-label">Course / Subject</label>
                <select
                  className="form-select"
                  value={selectedCourse?.id || ''}
                  onChange={(e) => {
                    const c = courses.find(item => String(item.id) === String(e.target.value));
                    if (c) handleCourseSelect(c);
                  }}
                  required
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.code} - {c.title}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Select Student</label>
                <select
                  className="form-select"
                  value={markStudentId}
                  onChange={(e) => setMarkStudentId(e.target.value)}
                  required
                >
                  <option value="">-- Choose Student --</option>
                  {courseStudents.map(s => (
                    <option key={s.student_id} value={s.student_id}>{s.full_name} ({s.roll_number})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Assessment Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={markTitle}
                  onChange={(e) => setMarkTitle(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Marks Scored</label>
                  <input
                    type="number"
                    step="0.5"
                    className="form-input"
                    value={markScore}
                    onChange={(e) => setMarkScore(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Maximum Marks</label>
                  <input
                    type="number"
                    step="0.5"
                    className="form-input"
                    value={markMax}
                    onChange={(e) => setMarkMax(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.75rem' }}>
                Save Internal Mark <Check size={16} />
              </button>
            </form>
          </div>

          {/* Enrolled Students Quick View */}
          <div className="card glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem' }}>
              Enrolled Students ({courseStudents.length})
            </h3>
            <div style={{ maxHeight: '380px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {courseStudents.map(s => (
                <div
                  key={s.student_id}
                  onClick={() => setMarkStudentId(String(s.student_id))}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    background: String(markStudentId) === String(s.student_id) ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', color: '#fff', fontSize: '0.88rem' }}>{s.full_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.roll_number}</div>
                  </div>
                  <span className="badge badge-info">GPA: {s.gpa}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. ASSIGNMENTS SUITE (assignments-manager) */}
      {/* ========================================================================= */}
      {activeTab === 'assignments-manager' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', flexWrap: 'wrap' }}>
          {/* Publish Assignment Form */}
          <div className="card glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen size={18} color="#06b6d4" /> Publish New Assignment
            </h3>

            <form onSubmit={handleCreateAssignment}>
              <div className="form-group">
                <label className="form-label">Course / Subject</label>
                <select
                  className="form-select"
                  value={selectedCourse?.id || ''}
                  onChange={(e) => {
                    const c = courses.find(item => String(item.id) === String(e.target.value));
                    if (c) handleCourseSelect(c);
                  }}
                  required
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.code} - {c.title}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Assignment Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Distributed Consensus Lab 3"
                  value={assignTitle}
                  onChange={(e) => setAssignTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description / Instructions</label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  placeholder="Provide detailed problem statement and grading criteria..."
                  value={assignDesc}
                  onChange={(e) => setAssignDesc(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Due Date & Time</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={assignDueDate}
                  onChange={(e) => setAssignDueDate(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.75rem' }}>
                Publish Assignment <Plus size={16} />
              </button>
            </form>
          </div>

          {/* Information Card */}
          <div className="card glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.75rem' }}>
              Assignment Management
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Published assignments are immediately synced with students enrolled in your selected subject.
              Students will receive notification banners and can submit their assignments directly through the Student Portal.
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MY TIMETABLE TAB (timetable-manager) */}
      {/* ========================================================================= */}
      {activeTab === 'timetable-manager' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={20} color="#8b5cf6" /> Faculty Timetable Schedule Management
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Create, edit, and publish lecture/lab timetable schedules for your courses. Changes immediately sync to Student Portals.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <select
                  className="form-select"
                  style={{ width: '150px', height: '36px', fontSize: '0.82rem' }}
                  value={ttDayFilter}
                  onChange={(e) => setTtDayFilter(e.target.value)}
                >
                  <option value="All">All Days ({timetable.length})</option>
                  {DAYS_OF_WEEK.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                <button
                  onClick={handleOpenAddTimetable}
                  className="btn btn-primary"
                  style={{ fontSize: '0.82rem', padding: '0.45rem 1rem' }}
                >
                  <Plus size={15} /> Add Timetable Slot
                </button>
              </div>
            </div>

            {/* Timetable Cards Grid */}
            <div className="table-container" style={{ padding: 0 }}>
              <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                    <th style={{ padding: '0.8rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Day</th>
                    <th style={{ padding: '0.8rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Time Slot</th>
                    <th style={{ padding: '0.8rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Course / Subject</th>
                    <th style={{ padding: '0.8rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Semester</th>
                    <th style={{ padding: '0.8rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Room / Class</th>
                    <th style={{ padding: '0.8rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTimetable.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        <Calendar size={36} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                        <p style={{ margin: 0 }}>No timetable slots found. Click "Add Timetable Slot" to create one.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredTimetable.map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <td style={{ padding: '0.8rem 1rem' }}>
                          <span className="badge badge-info" style={{ fontWeight: '700' }}>{item.day_of_week}</span>
                        </td>
                        <td style={{ padding: '0.8rem 1rem', fontWeight: '600', color: '#38bdf8', fontSize: '0.85rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Clock size={13} /> {item.start_time} - {item.end_time}
                          </div>
                        </td>
                        <td style={{ padding: '0.8rem 1rem' }}>
                          <div style={{ fontWeight: '600', color: '#fff', fontSize: '0.88rem' }}>{item.course_title}</div>
                          <div style={{ fontSize: '0.75rem', color: '#a78bfa' }}>{item.course_code}</div>
                        </td>
                        <td style={{ padding: '0.8rem 1rem' }}>
                          <span className="badge badge-warning" style={{ fontSize: '0.72rem' }}>Sem {item.semester_number}</span>
                        </td>
                        <td style={{ padding: '0.8rem 1rem', fontSize: '0.85rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#34d399' }}>
                            <MapPin size={13} /> {item.room}
                          </div>
                        </td>
                        <td style={{ padding: '0.8rem 1rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button
                              onClick={() => handleOpenEditTimetable(item)}
                              className="btn btn-secondary"
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                              title="Edit slot"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => setDeletingTimetableId(item.id)}
                              className="btn btn-danger"
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                              title="Delete slot"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. AT-RISK STUDENTS (at-risk-flagged) */}
      {/* ========================================================================= */}
      {activeTab === 'at-risk-flagged' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <AlertTriangle size={22} color="#f87171" />
              <h3 style={{ fontSize: '1.15rem', color: '#f87171', margin: 0 }}>
                Students Requiring Academic Attention ({atRiskStudents.length})
              </h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              ML-evaluated academic risk flags based on attendance, quiz marks, and semester GPA trends across your courses.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
              {atRiskStudents.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No students currently flagged at risk in your courses.
                </div>
              ) : (
                atRiskStudents.map((s, idx) => (
                  <div key={idx} className="card" style={{ background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.3)', padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '1rem', fontWeight: '700', color: '#fff' }}>{s.name}</span>
                      <span className="badge badge-high-risk">{s.risk_level}</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                      Roll: <strong style={{ color: '#a78bfa' }}>{s.roll_number}</strong> • {s.email}
                    </p>
                    <div style={{ fontSize: '0.78rem', color: '#fca5a5', marginTop: '0.75rem', background: 'rgba(0, 0, 0, 0.25)', padding: '0.5rem 0.75rem', borderRadius: '4px' }}>
                      Key Factor: {s.factors?.[0] || 'Attendance or assessment score drop below threshold'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Timetable Create / Edit Modal */}
      {showAddTimetableModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(5, 8, 16, 0.78)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.25rem'
        }} onClick={() => setShowAddTimetableModal(false)}>
          <div className="card glass-panel" style={{
            width: '100%',
            maxWidth: '500px',
            background: 'linear-gradient(145deg, #131b2e 0%, #0d1322 100%)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '16px',
            padding: '1.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0 }} className="title-gradient">
                {editingTimetableItem ? 'Edit Timetable Slot' : 'Add New Timetable Slot'}
              </h3>
              <button
                onClick={() => setShowAddTimetableModal(false)}
                className="btn btn-secondary"
                style={{ padding: '0.35rem', borderRadius: '50%' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveTimetableEntry} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Subject / Course</label>
                <select
                  className="form-select"
                  value={ttCourseId}
                  onChange={(e) => setTtCourseId(e.target.value)}
                  required
                >
                  <option value="">-- Choose Subject --</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.code} - {c.title} (Sem {c.semester})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Day of Week</label>
                <select
                  className="form-select"
                  value={ttDay}
                  onChange={(e) => setTtDay(e.target.value)}
                  required
                >
                  {DAYS_OF_WEEK.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 09:00 AM"
                    value={ttStartTime}
                    onChange={(e) => setTtStartTime(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 10:30 AM"
                    value={ttEndTime}
                    onChange={(e) => setTtEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Classroom / Room / Lab</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. LH-201 or Network Lab 2"
                  value={ttRoom}
                  onChange={(e) => setTtRoom(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddTimetableModal(false)}
                  className="btn btn-secondary"
                  disabled={savingTimetable}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingTimetable}
                >
                  {savingTimetable ? 'Saving...' : editingTimetableItem ? 'Update Slot' : 'Add Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingTimetableId && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(5, 8, 16, 0.78)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.25rem'
        }} onClick={() => setDeletingTimetableId(null)}>
          <div className="card glass-panel" style={{
            width: '100%',
            maxWidth: '420px',
            background: 'linear-gradient(145deg, #131b2e 0%, #0d1322 100%)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '16px',
            padding: '1.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            textAlign: 'center'
          }} onClick={(e) => e.stopPropagation()}>
            <AlertTriangle size={36} color="#f87171" style={{ margin: '0 auto' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#fff', margin: 0 }}>
              Delete Timetable Slot?
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              Are you sure you want to remove this timetable slot? It will be removed from all student schedules.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setDeletingTimetableId(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteTimetable(deletingTimetableId)}
                className="btn btn-danger"
              >
                Delete Slot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Photo Modal */}
      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
    </div>
  );
};

export default FacultyDashboard;
