import React, { useState, useEffect } from 'react';
import api, { getAvatarUrl, DEFAULT_AVATAR } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ProfileModal from '../components/common/ProfileModal';
import {
  Users, Building, BookOpen, BarChart3, Megaphone, Plus, Trash2, ShieldCheck,
  Search, Edit2, Eye, UserX, UserCheck, UserPlus, GraduationCap, Camera,
  CheckCircle2, AlertCircle, Sparkles, Filter, RefreshCw, Layers, School,
  Activity, Award, BellRing, Calendar, ChevronRight, X, TrendingUp
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';

const AdminDashboard = ({ activeTab: propActiveTab, setActiveTab: propSetActiveTab }) => {
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
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [students, setStudents] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Success / Error Feedback Toast
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3500);
  };

  // User Directory Filters
  const [userRoleFilter, setUserRoleFilter] = useState('all'); // 'all' | 'student' | 'faculty'
  const [userSearch, setUserSearch] = useState('');
  const [userDeptFilter, setUserDeptFilter] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('');

  // Course / Department Subtab & Filters
  const [deptCourseSubTab, setDeptCourseSubTab] = useState('departments'); // 'departments' | 'courses'
  const [courseDeptFilter, setCourseDeptFilter] = useState('');
  const [courseSemFilter, setCourseSemFilter] = useState('');
  const [courseSearch, setCourseSearch] = useState('');

  // Announcements Filters
  const [annTargetFilter, setAnnTargetFilter] = useState('all');

  // Modals state
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showEditStudent, setShowEditStudent] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [showAddFaculty, setShowAddFaculty] = useState(false);
  const [showEditFaculty, setShowEditFaculty] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState(null);

  const [showAddDept, setShowAddDept] = useState(false);
  const [showEditDept, setShowEditDept] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);

  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showEditCourse, setShowEditCourse] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const [showAddAnnounce, setShowAddAnnounce] = useState(false);
  const [showEditAnnounce, setShowEditAnnounce] = useState(false);
  const [selectedAnnounce, setSelectedAnnounce] = useState(null);

  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: '',
    message: '',
    onConfirm: null
  });

  // Forms State
  // New Student Form
  const [sName, setSName] = useState('');
  const [sEmail, setSEmail] = useState('');
  const [sPassword, setSPassword] = useState('password123');
  const [sRoll, setSRoll] = useState('');
  const [sDeptId, setSDeptId] = useState('');
  const [sSemester, setSSemester] = useState(1);
  const [sCohortYear, setSCohortYear] = useState(2024);
  const [sGpa, setSGpa] = useState(3.5);
  const [sTargetGpa, setSTargetGpa] = useState(3.8);
  const [sPhone, setSPhone] = useState('');
  const [editStudentForm, setEditStudentForm] = useState({});

  // New Faculty Form
  const [fName, setFName] = useState('');
  const [fEmail, setFEmail] = useState('');
  const [fPassword, setFPassword] = useState('password123');
  const [fDeptId, setFDeptId] = useState('');
  const [fEmpId, setFEmpId] = useState('');
  const [fDesignation, setFDesignation] = useState('Assistant Professor');
  const [fOfficeHours, setFOfficeHours] = useState('Mon, Wed 10:00 AM - 12:00 PM');
  const [editFacultyForm, setEditFacultyForm] = useState({});

  // Department Form
  const [dCode, setDCode] = useState('');
  const [dName, setDName] = useState('');
  const [dDesc, setDDesc] = useState('');
  const [editDeptForm, setEditDeptForm] = useState({});

  // Course Form
  const [cCode, setCCode] = useState('');
  const [cTitle, setCTitle] = useState('');
  const [cDeptId, setCDeptId] = useState('');
  const [cSemester, setCSemester] = useState(1);
  const [cCredits, setCCredits] = useState(4);
  const [editCourseForm, setEditCourseForm] = useState({});

  // Announcement Form
  const [aTitle, setATitle] = useState('');
  const [aContent, setAContent] = useState('');
  const [aTarget, setATarget] = useState('all');
  const [aDeptId, setADeptId] = useState('');
  const [aSemester, setASemester] = useState('');
  const [editAnnounceForm, setEditAnnounceForm] = useState({});

  // Load all initial admin data
  const loadAdminData = async () => {
    try {
      setRefreshing(true);
      const [sRes, aRes, uRes, dRes, cRes, stRes, fRes, annRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/analytics/institution-summary'),
        api.get('/admin/users'),
        api.get('/admin/departments'),
        api.get('/admin/courses'),
        api.get('/admin/students'),
        api.get('/admin/faculty'),
        api.get('/admin/announcements')
      ]);

      setStats(sRes.data);
      setAnalytics(aRes.data);
      setUsers(uRes.data);
      setDepartments(dRes.data);
      setCourses(cRes.data);
      setStudents(stRes.data);
      setFaculty(fRes.data);
      setAnnouncements(annRes.data);

      if (dRes.data.length > 0) {
        if (!sDeptId) setSDeptId(String(dRes.data[0].id));
        if (!fDeptId) setFDeptId(String(dRes.data[0].id));
        if (!cDeptId) setCDeptId(String(dRes.data[0].id));
      }
    } catch (err) {
      console.error('Failed to load admin data', err);
      showToast('Failed to load institution data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // -------------------------------------------------------------
  // USER DIRECTORY ACTIONS
  // -------------------------------------------------------------
  const handleToggleUserStatus = async (userId) => {
    try {
      const res = await api.patch(`/admin/users/${userId}/toggle-status`);
      showToast(res.data.message);
      loadAdminData();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to update user status', 'error');
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await api.delete(`/admin/users/${userId}`);
      showToast('User account permanently deleted.');
      setConfirmModal({ show: false, title: '', message: '', onConfirm: null });
      loadAdminData();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to delete user', 'error');
    }
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/students', {
        full_name: sName,
        email: sEmail,
        password: sPassword,
        roll_number: sRoll,
        department_id: parseInt(sDeptId, 10),
        semester_number: parseInt(sSemester, 10),
        cohort_year: parseInt(sCohortYear, 10),
        gpa: parseFloat(sGpa),
        target_gpa: parseFloat(sTargetGpa),
        phone: sPhone
      });
      showToast(`Student ${sName} created and enrolled successfully!`);
      setShowAddStudent(false);
      setSName('');
      setSEmail('');
      setSRoll('');
      setSPhone('');
      loadAdminData();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to create student', 'error');
    }
  };

  const handleEditStudent = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admin/students/${selectedStudent.id}`, {
        full_name: editStudentForm.full_name,
        email: editStudentForm.email,
        roll_number: editStudentForm.roll_number,
        department_id: parseInt(editStudentForm.department_id, 10),
        semester_number: parseInt(editStudentForm.semester_number, 10),
        cohort_year: parseInt(editStudentForm.cohort_year, 10),
        gpa: parseFloat(editStudentForm.gpa),
        target_gpa: parseFloat(editStudentForm.target_gpa),
        phone: editStudentForm.phone
      });
      showToast('Student details updated successfully!');
      setShowEditStudent(false);
      setSelectedStudent(null);
      loadAdminData();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to update student', 'error');
    }
  };

  const handleCreateFaculty = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/faculty', {
        full_name: fName,
        email: fEmail,
        password: fPassword,
        department_id: parseInt(fDeptId, 10),
        employee_id: fEmpId,
        designation: fDesignation,
        office_hours: fOfficeHours
      });
      showToast(`Faculty member ${fName} created successfully!`);
      setShowAddFaculty(false);
      setFName('');
      setFEmail('');
      setFEmpId('');
      loadAdminData();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to create faculty member', 'error');
    }
  };

  const handleEditFaculty = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admin/faculty/${selectedFaculty.id}`, {
        full_name: editFacultyForm.full_name,
        email: editFacultyForm.email,
        department_id: parseInt(editFacultyForm.department_id, 10),
        employee_id: editFacultyForm.employee_id,
        designation: editFacultyForm.designation,
        office_hours: editFacultyForm.office_hours
      });
      showToast('Faculty profile updated successfully!');
      setShowEditFaculty(false);
      setSelectedFaculty(null);
      loadAdminData();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to update faculty profile', 'error');
    }
  };

  // -------------------------------------------------------------
  // DEPARTMENTS & COURSES ACTIONS
  // -------------------------------------------------------------
  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/departments', {
        code: dCode,
        name: dName,
        description: dDesc
      });
      showToast(`Department ${dName} (${dCode}) created successfully!`);
      setShowAddDept(false);
      setDCode('');
      setDName('');
      setDDesc('');
      loadAdminData();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to create department', 'error');
    }
  };

  const handleEditDepartment = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admin/departments/${selectedDept.id}`, {
        code: editDeptForm.code,
        name: editDeptForm.name,
        description: editDeptForm.description
      });
      showToast('Department updated successfully!');
      setShowEditDept(false);
      setSelectedDept(null);
      loadAdminData();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to update department', 'error');
    }
  };

  const handleDeleteDepartment = async (deptId) => {
    try {
      await api.delete(`/admin/departments/${deptId}`);
      showToast('Department removed successfully.');
      setConfirmModal({ show: false, title: '', message: '', onConfirm: null });
      loadAdminData();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to delete department', 'error');
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/courses', {
        code: cCode,
        title: cTitle,
        department_id: parseInt(cDeptId, 10),
        semester_number: parseInt(cSemester, 10),
        credits: parseInt(cCredits, 10)
      });
      showToast(`Subject ${cCode} added & students auto-enrolled!`);
      setShowAddCourse(false);
      setCCode('');
      setCTitle('');
      loadAdminData();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to add course', 'error');
    }
  };

  const handleEditCourse = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admin/courses/${selectedCourse.id}`, {
        code: editCourseForm.code,
        title: editCourseForm.title,
        department_id: parseInt(editCourseForm.department_id, 10),
        semester_number: parseInt(editCourseForm.semester_number, 10),
        credits: parseInt(editCourseForm.credits, 10)
      });
      showToast('Subject updated successfully!');
      setShowEditCourse(false);
      setSelectedCourse(null);
      loadAdminData();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to update course', 'error');
    }
  };

  const handleDeleteCourse = async (courseId) => {
    try {
      await api.delete(`/admin/courses/${courseId}`);
      showToast('Subject deleted successfully.');
      setConfirmModal({ show: false, title: '', message: '', onConfirm: null });
      loadAdminData();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to delete course', 'error');
    }
  };

  // -------------------------------------------------------------
  // ANNOUNCEMENTS ACTIONS
  // -------------------------------------------------------------
  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/announcements', {
        title: aTitle,
        content: aContent,
        target_role: aTarget,
        department_id: aDeptId ? parseInt(aDeptId, 10) : null,
        semester_number: aSemester ? parseInt(aSemester, 10) : null
      });
      showToast('Announcement published successfully to target audience!');
      setShowAddAnnounce(false);
      setATitle('');
      setAContent('');
      setATarget('all');
      setADeptId('');
      setASemester('');
      loadAdminData();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to publish announcement', 'error');
    }
  };

  const handleEditAnnouncement = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admin/announcements/${selectedAnnounce.id}`, {
        title: editAnnounceForm.title,
        content: editAnnounceForm.content,
        target_role: editAnnounceForm.target_role,
        department_id: editAnnounceForm.department_id ? parseInt(editAnnounceForm.department_id, 10) : null,
        semester_number: editAnnounceForm.semester_number ? parseInt(editAnnounceForm.semester_number, 10) : null
      });
      showToast('Announcement updated successfully!');
      setShowEditAnnounce(false);
      setSelectedAnnounce(null);
      loadAdminData();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to update announcement', 'error');
    }
  };

  const handleDeleteAnnouncement = async (annId) => {
    try {
      await api.delete(`/admin/announcements/${annId}`);
      showToast('Announcement deleted successfully.');
      setConfirmModal({ show: false, title: '', message: '', onConfirm: null });
      loadAdminData();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to delete announcement', 'error');
    }
  };

  // Filtered Users List
  const filteredUsers = users.filter((u) => {
    if (userRoleFilter !== 'all' && u.role !== userRoleFilter) return false;
    if (userDeptFilter && u.department !== userDeptFilter) return false;
    if (userStatusFilter !== '') {
      const activeBool = userStatusFilter === 'active';
      if (u.is_active !== activeBool) return false;
    }
    if (userSearch) {
      const q = userSearch.toLowerCase();
      const matchName = u.full_name?.toLowerCase().includes(q);
      const matchEmail = u.email?.toLowerCase().includes(q);
      const matchId = u.identifier?.toLowerCase().includes(q);
      const matchDept = u.department?.toLowerCase().includes(q);
      const matchSem = u.semester ? `sem ${u.semester}`.includes(q) : false;
      if (!matchName && !matchEmail && !matchId && !matchDept && !matchSem) return false;
    }
    return true;
  });

  // Filtered Courses List
  const filteredCourses = courses.filter((c) => {
    if (courseDeptFilter && String(c.department_id) !== String(courseDeptFilter)) return false;
    if (courseSemFilter && String(c.semester) !== String(courseSemFilter)) return false;
    if (courseSearch) {
      const q = courseSearch.toLowerCase();
      const matchCode = c.code?.toLowerCase().includes(q);
      const matchTitle = c.title?.toLowerCase().includes(q);
      if (!matchCode && !matchTitle) return false;
    }
    return true;
  });

  // Filtered Announcements List
  const filteredAnnouncements = announcements.filter((a) => {
    if (annTargetFilter !== 'all' && a.target_role !== annTargetFilter) return false;
    return true;
  });

  // Risk Chart Palette
  const riskPieData = [
    { name: 'Low Risk', value: analytics?.risk_distribution?.low_risk || stats?.risk_distribution?.low_risk || 0, color: '#34d399' },
    { name: 'Medium Risk', value: analytics?.risk_distribution?.medium_risk || stats?.risk_distribution?.medium_risk || 0, color: '#fbbf24' },
    { name: 'High Risk', value: analytics?.risk_distribution?.high_risk || stats?.risk_distribution?.high_risk || 0, color: '#f87171' }
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(139, 92, 246, 0.2)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading Institution Workspace...</span>
      </div>
    );
  }

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
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          {toast.message}
        </div>
      )}

      {/* Top Header Banner */}
      <div className="card glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            onClick={() => setShowProfileModal(true)}
            style={{ position: 'relative', cursor: 'pointer' }}
            title="Click to manage profile photo"
          >
            <img
              src={getAvatarUrl(user?.avatar_url, user?.full_name)}
              alt={user?.full_name}
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = DEFAULT_AVATAR; }}
              style={{ width: '52px', height: '52px', borderRadius: '50%', border: '2px solid var(--accent-primary)', objectFit: 'cover' }}
            />
            <div style={{
              position: 'absolute', bottom: -2, right: -2,
              background: 'var(--accent-primary)', borderRadius: '50%',
              width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Camera size={10} color="#fff" />
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0 }} className="title-gradient">
                Admin Workspace
              </h2>
              <span className="badge badge-danger">ADMINISTRATOR</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
              Logged in as <strong style={{ color: '#fff' }}>{user?.full_name}</strong> • Institutional System Control
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={loadAdminData}
            className="btn btn-secondary"
            disabled={refreshing}
            style={{ fontSize: '0.8rem', padding: '0.5rem 0.9rem' }}
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
          <button
            onClick={() => setShowProfileModal(true)}
            className="btn btn-primary"
            style={{ fontSize: '0.8rem', padding: '0.5rem 0.9rem' }}
          >
            <ShieldCheck size={14} /> My Profile
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. INSTITUTION OVERVIEW (dashboard) */}
      {/* ========================================================================= */}
      {activeTab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Quick Metrics Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div className="card glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <GraduationCap size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Students</span>
                <h3 style={{ fontSize: '1.6rem', fontWeight: '800', margin: '0.1rem 0 0 0', color: '#fff' }}>
                  {analytics?.summary?.total_students ?? stats?.total_students ?? 0}
                </h3>
              </div>
            </div>

            <div className="card glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(167, 139, 250, 0.15)', color: '#a78bfa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Faculty</span>
                <h3 style={{ fontSize: '1.6rem', fontWeight: '800', margin: '0.1rem 0 0 0', color: '#fff' }}>
                  {analytics?.summary?.total_faculty ?? stats?.total_faculty ?? 0}
                </h3>
              </div>
            </div>

            <div className="card glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Departments</span>
                <h3 style={{ fontSize: '1.6rem', fontWeight: '800', margin: '0.1rem 0 0 0', color: '#fff' }}>
                  {analytics?.summary?.total_departments ?? stats?.total_departments ?? 0}
                </h3>
              </div>
            </div>

            <div className="card glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BookOpen size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Active Courses</span>
                <h3 style={{ fontSize: '1.6rem', fontWeight: '800', margin: '0.1rem 0 0 0', color: '#fff' }}>
                  {analytics?.summary?.total_courses ?? stats?.total_courses ?? 0}
                </h3>
              </div>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="card glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={18} color="var(--accent-primary)" /> Quick Management Actions
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
              <button
                onClick={() => { handleTabChange('users-manager'); setShowAddStudent(true); }}
                className="btn btn-secondary"
                style={{ justifyContent: 'flex-start', padding: '0.85rem 1rem' }}
              >
                <UserPlus size={16} color="#38bdf8" /> Add New Student
              </button>
              <button
                onClick={() => { handleTabChange('users-manager'); setShowAddFaculty(true); }}
                className="btn btn-secondary"
                style={{ justifyContent: 'flex-start', padding: '0.85rem 1rem' }}
              >
                <Users size={16} color="#a78bfa" /> Add New Faculty
              </button>
              <button
                onClick={() => { handleTabChange('dept-manager'); setShowAddDept(true); }}
                className="btn btn-secondary"
                style={{ justifyContent: 'flex-start', padding: '0.85rem 1rem' }}
              >
                <Building size={16} color="#34d399" /> Add Department
              </button>
              <button
                onClick={() => { handleTabChange('dept-manager'); setShowAddCourse(true); }}
                className="btn btn-secondary"
                style={{ justifyContent: 'flex-start', padding: '0.85rem 1rem' }}
              >
                <BookOpen size={16} color="#fbbf24" /> Add Course / Subject
              </button>
              <button
                onClick={() => { handleTabChange('announcements-publisher'); setShowAddAnnounce(true); }}
                className="btn btn-secondary"
                style={{ justifyContent: 'flex-start', padding: '0.85rem 1rem' }}
              >
                <Megaphone size={16} color="#f87171" /> Post Announcement
              </button>
            </div>
          </div>

          {/* Real Database Charts Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
            {/* Students by Department */}
            <div className="card glass-panel" style={{ padding: '1.5rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building size={16} color="#8b5cf6" /> Students by Department
              </h4>
              <div style={{ height: '260px', width: '100%', minHeight: '260px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics?.departments || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="department_code" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                    />
                    <Bar dataKey="student_count" name="Enrolled Students" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Students by Semester */}
            <div className="card glass-panel" style={{ padding: '1.5rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={16} color="#38bdf8" /> Students by Semester
              </h4>
              <div style={{ height: '260px', width: '100%', minHeight: '260px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics?.semester_distribution || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="semester" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                    />
                    <Bar dataKey="student_count" name="Students" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. USER DIRECTORY (users-manager) */}
      {/* ========================================================================= */}
      {activeTab === 'users-manager' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Controls Bar */}
          <div className="card glass-panel" style={{ padding: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', flex: 1, minWidth: '300px' }}>
              {/* Role Toggle Pills */}
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '0.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                {['all', 'student', 'faculty'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setUserRoleFilter(r)}
                    style={{
                      padding: '0.4rem 0.85rem',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      borderRadius: '4px',
                      border: 'none',
                      cursor: 'pointer',
                      background: userRoleFilter === r ? 'var(--accent-primary)' : 'transparent',
                      color: userRoleFilter === r ? '#fff' : 'var(--text-secondary)',
                      textTransform: 'capitalize'
                    }}
                  >
                    {r === 'all' ? `All Users (${users.length})` : r === 'student' ? `Students (${students.length})` : `Faculty (${faculty.length})`}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div style={{ position: 'relative', minWidth: '220px', flex: 1 }}>
                <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '2.2rem', paddingRight: '0.75rem', height: '38px', fontSize: '0.85rem' }}
                  placeholder="Search name, email, roll no, employee ID, semester..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>

              {/* Department Filter */}
              <select
                className="form-select"
                style={{ width: '190px', height: '38px', fontSize: '0.85rem' }}
                value={userDeptFilter}
                onChange={(e) => setUserDeptFilter(e.target.value)}
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>{d.name} ({d.code})</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                className="form-select"
                style={{ width: '130px', height: '38px', fontSize: '0.85rem' }}
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setShowAddStudent(true)}
                className="btn btn-primary"
                style={{ fontSize: '0.8rem', padding: '0.55rem 1rem' }}
              >
                <UserPlus size={15} /> Add Student
              </button>
              <button
                onClick={() => setShowAddFaculty(true)}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.55rem 1rem' }}
              >
                <Plus size={15} /> Add Faculty
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="table-container card glass-panel" style={{ padding: 0 }}>
            <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>User</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Role</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Department</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Semester</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID / Roll Number</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                      No users found. Try adjusting your search query or filters.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <img
                            src={getAvatarUrl(u.avatar_url, u.full_name)}
                            alt={u.full_name}
                            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = DEFAULT_AVATAR; }}
                            style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-color)' }}
                          />
                          <div>
                            <div style={{ fontWeight: '600', color: '#fff', fontSize: '0.88rem' }}>{u.full_name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span className={`badge ${u.role === 'admin' ? 'badge-danger' : u.role === 'faculty' ? 'badge-info' : 'badge-success'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {u.department || 'Institution-wide'}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        {u.semester ? (
                          <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>Sem {u.semester}</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#a78bfa', fontWeight: '500' }}>
                        {u.identifier || '—'}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.68rem' }}>
                          {u.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          {/* Toggle Status */}
                          <button
                            type="button"
                            onClick={() => handleToggleUserStatus(u.id)}
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                            title={u.is_active ? 'Disable Account' : 'Enable Account'}
                          >
                            {u.is_active ? <UserX size={13} color="#f87171" /> : <UserCheck size={13} color="#34d399" />}
                          </button>

                          {/* Edit User */}
                          {u.role === 'student' && (
                            <button
                              type="button"
                              onClick={() => {
                                const st = students.find((s) => s.user_id === u.id);
                                if (st) {
                                  setSelectedStudent(st);
                                  setEditStudentForm({
                                    full_name: st.full_name,
                                    email: st.email,
                                    roll_number: st.roll_number,
                                    department_id: st.department_id,
                                    semester_number: st.semester_number,
                                    cohort_year: st.cohort_year || 2024,
                                    gpa: st.gpa,
                                    target_gpa: st.target_gpa,
                                    phone: st.phone || ''
                                  });
                                  setShowEditStudent(true);
                                }
                              }}
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                              title="Edit Student Profile"
                            >
                              <Edit2 size={13} />
                            </button>
                          )}

                          {u.role === 'faculty' && (
                            <button
                              type="button"
                              onClick={() => {
                                const fac = faculty.find((f) => f.user_id === u.id);
                                if (fac) {
                                  setSelectedFaculty(fac);
                                  setEditFacultyForm({
                                    full_name: fac.full_name,
                                    email: fac.email,
                                    employee_id: fac.employee_id,
                                    department_id: fac.department_id,
                                    designation: fac.designation,
                                    office_hours: fac.office_hours || ''
                                  });
                                  setShowEditFaculty(true);
                                }
                              }}
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                              title="Edit Faculty Profile"
                            >
                              <Edit2 size={13} />
                            </button>
                          )}

                          {/* Delete User */}
                          {u.id !== user?.id && (
                            <button
                              type="button"
                              onClick={() => {
                                setConfirmModal({
                                  show: true,
                                  title: 'Delete User Account',
                                  message: `Are you sure you want to permanently delete "${u.full_name}" (${u.email})? This action cannot be undone.`,
                                  onConfirm: () => handleDeleteUser(u.id)
                                });
                              }}
                              className="btn btn-danger"
                              style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                              title="Delete User"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. DEPARTMENTS & COURSES (dept-manager) */}
      {/* ========================================================================= */}
      {activeTab === 'dept-manager' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Sub Navigation Bar */}
          <div className="card glass-panel" style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setDeptCourseSubTab('departments')}
                className={`btn ${deptCourseSubTab === 'departments' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.85rem' }}
              >
                <Building size={15} /> Departments ({departments.length})
              </button>
              <button
                type="button"
                onClick={() => setDeptCourseSubTab('courses')}
                className={`btn ${deptCourseSubTab === 'courses' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.85rem' }}
              >
                <BookOpen size={15} /> Courses / Subjects ({courses.length})
              </button>
            </div>

            <div>
              {deptCourseSubTab === 'departments' ? (
                <button onClick={() => setShowAddDept(true)} className="btn btn-primary" style={{ fontSize: '0.82rem' }}>
                  <Plus size={15} /> Add Department
                </button>
              ) : (
                <button onClick={() => setShowAddCourse(true)} className="btn btn-primary" style={{ fontSize: '0.82rem' }}>
                  <Plus size={15} /> Add Course / Subject
                </button>
              )}
            </div>
          </div>

          {/* DEPARTMENTS VIEW */}
          {deptCourseSubTab === 'departments' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {departments.map((d) => (
                <div key={d.id} className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem', padding: '1.4rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <span className="badge badge-info" style={{ fontSize: '0.78rem' }}>{d.code}</span>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          onClick={() => {
                            setSelectedDept(d);
                            setEditDeptForm({ code: d.code, name: d.name, description: d.description || '' });
                            setShowEditDept(true);
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '0.3rem 0.5rem' }}
                          title="Edit Department"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => {
                            setConfirmModal({
                              show: true,
                              title: `Delete Department ${d.code}`,
                              message: `Are you sure you want to delete "${d.name}"? Note: Departments with active students or faculty cannot be deleted.`,
                              onConfirm: () => handleDeleteDepartment(d.id)
                            });
                          }}
                          className="btn btn-danger"
                          style={{ padding: '0.3rem 0.5rem' }}
                          title="Delete Department"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#fff', marginBottom: '0.35rem' }}>
                      {d.name}
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                      {d.description || 'Department curriculum and academic programs.'}
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Students</span>
                      <div style={{ fontWeight: '700', color: '#38bdf8', fontSize: '1rem' }}>{d.student_count ?? 0}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Faculty</span>
                      <div style={{ fontWeight: '700', color: '#a78bfa', fontSize: '1rem' }}>{d.faculty_count ?? 0}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Subjects</span>
                      <div style={{ fontWeight: '700', color: '#34d399', fontSize: '1rem' }}>{d.course_count ?? 0}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* COURSES VIEW */}
          {deptCourseSubTab === 'courses' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Courses Filter Bar */}
              <div className="card glass-panel" style={{ padding: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
                <div style={{ position: 'relative', minWidth: '220px', flex: 1 }}>
                  <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: '2.2rem', height: '36px', fontSize: '0.85rem' }}
                    placeholder="Search subject code or title..."
                    value={courseSearch}
                    onChange={(e) => setCourseSearch(e.target.value)}
                  />
                </div>

                <select
                  className="form-select"
                  style={{ width: '200px', height: '36px', fontSize: '0.85rem' }}
                  value={courseDeptFilter}
                  onChange={(e) => setCourseDeptFilter(e.target.value)}
                >
                  <option value="">All Departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>

                <select
                  className="form-select"
                  style={{ width: '150px', height: '36px', fontSize: '0.85rem' }}
                  value={courseSemFilter}
                  onChange={(e) => setCourseSemFilter(e.target.value)}
                >
                  <option value="">All Semesters</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>

              {/* Courses Table */}
              <div className="table-container card glass-panel" style={{ padding: 0 }}>
                <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                      <th style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Code</th>
                      <th style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Subject Title</th>
                      <th style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Department</th>
                      <th style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Semester</th>
                      <th style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Credits</th>
                      <th style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Enrolled Students</th>
                      <th style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCourses.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                          No subjects found matching your filters.
                        </td>
                      </tr>
                    ) : (
                      filteredCourses.map((c) => (
                        <tr key={c.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#a78bfa' }}>
                            {c.code}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: '600', color: '#fff' }}>
                            {c.title}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                            {c.department}
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>Sem {c.semester}</span>
                          </td>
                          <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            {c.credits} Credits
                          </td>
                          <td style={{ padding: '0.85rem 1rem', color: '#38bdf8', fontWeight: '600', fontSize: '0.85rem' }}>
                            {c.enrolled_students} Students
                          </td>
                          <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                              <button
                                onClick={() => {
                                  setSelectedCourse(c);
                                  setEditCourseForm({
                                    code: c.code,
                                    title: c.title,
                                    department_id: c.department_id,
                                    semester_number: c.semester,
                                    credits: c.credits
                                  });
                                  setShowEditCourse(true);
                                }}
                                className="btn btn-secondary"
                                style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                                title="Edit Subject"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => {
                                  setConfirmModal({
                                    show: true,
                                    title: `Delete Subject ${c.code}`,
                                    message: `Are you sure you want to delete "${c.title}" (${c.code})? Student enrollments for this subject will be cleared.`,
                                    onConfirm: () => handleDeleteCourse(c.id)
                                  });
                                }}
                                className="btn btn-danger"
                                style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                                title="Delete Subject"
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
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. INSTITUTION ANALYTICS (analytics-hub) */}
      {/* ========================================================================= */}
      {activeTab === 'analytics-hub' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Institutional KPI Statistics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="card glass-panel" style={{ padding: '1.25rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Total Students</span>
              <h3 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#38bdf8', margin: '0.2rem 0' }}>
                {analytics?.summary?.total_students ?? students.length}
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#34d399' }}>● Enrolled across {departments.length} departments</span>
            </div>

            <div className="card glass-panel" style={{ padding: '1.25rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Total Faculty</span>
              <h3 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#a78bfa', margin: '0.2rem 0' }}>
                {analytics?.summary?.total_faculty ?? faculty.length}
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>● Active teaching staff</span>
            </div>

            <div className="card glass-panel" style={{ padding: '1.25rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Student-to-Faculty Ratio</span>
              <h3 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#fbbf24', margin: '0.2rem 0' }}>
                {analytics?.summary?.student_faculty_ratio || '12:1'}
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>● Institution average</span>
            </div>

            <div className="card glass-panel" style={{ padding: '1.25rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Average Student GPA</span>
              <h3 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#34d399', margin: '0.2rem 0' }}>
                {analytics?.summary?.avg_gpa || 3.42}
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#34d399' }}>● Overall academic index</span>
            </div>

            <div className="card glass-panel" style={{ padding: '1.25rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Overall Attendance</span>
              <h3 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#38bdf8', margin: '0.2rem 0' }}>
                {analytics?.summary?.overall_attendance_pct || 91.2}%
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>● Verified attendance</span>
            </div>
          </div>

          {/* Real Database Charts Grid: 4 Core Graphs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>
            {/* 1. Students by Department */}
            <div className="card glass-panel" style={{ padding: '1.5rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building size={16} color="#8b5cf6" /> Students by Department
              </h4>
              <div style={{ height: '260px', width: '100%', minHeight: '260px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics?.departments || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="department_code" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                      formatter={(val) => [`${val} Students`, 'Total Enrolled']}
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
                  <BarChart data={analytics?.semester_distribution || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="semester" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                      formatter={(val) => [`${val} Students`, 'Semester Enrollment']}
                    />
                    <Bar dataKey="student_count" name="Enrolled Students" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 3. Faculty by Department */}
            <div className="card glass-panel" style={{ padding: '1.5rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={16} color="#34d399" /> Faculty by Department
              </h4>
              <div style={{ height: '260px', width: '100%', minHeight: '260px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics?.faculty_by_department || analytics?.departments || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="department_code" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                      formatter={(val) => [`${val} Faculty Members`, 'Faculty Count']}
                    />
                    <Bar dataKey="faculty_count" name="Faculty Members" fill="#34d399" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 4. Academic Risk Distribution */}
            <div className="card glass-panel" style={{ padding: '1.5rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={16} color="#f87171" /> Academic Risk Distribution
              </h4>
              <div style={{ height: '260px', width: '100%', minHeight: '260px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {riskPieData.map((entry, index) => (
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. ANNOUNCEMENTS (announcements-publisher) */}
      {/* ========================================================================= */}
      {activeTab === 'announcements-publisher' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Controls Bar */}
          <div className="card glass-panel" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Target Audience:</span>
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '0.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                {[
                  { id: 'all', label: 'All' },
                  { id: 'student', label: 'Students' },
                  { id: 'faculty', label: 'Faculty' }
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setAnnTargetFilter(t.id)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      borderRadius: '4px',
                      border: 'none',
                      cursor: 'pointer',
                      background: annTargetFilter === t.id ? 'var(--accent-primary)' : 'transparent',
                      color: annTargetFilter === t.id ? '#fff' : 'var(--text-secondary)'
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowAddAnnounce(true)}
              className="btn btn-primary"
              style={{ fontSize: '0.82rem' }}
            >
              <Plus size={15} /> Publish Announcement
            </button>
          </div>

          {/* Announcements Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
            {filteredAnnouncements.length === 0 ? (
              <div className="card glass-panel" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                No announcements published yet. Click "Publish Announcement" to create one.
              </div>
            ) : (
              filteredAnnouncements.map((a) => (
                <div key={a.id} className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem', padding: '1.4rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        <span className={`badge ${a.target_role === 'student' ? 'badge-success' : a.target_role === 'faculty' ? 'badge-info' : 'badge-warning'}`}>
                          {a.target_role === 'all' ? 'All Users' : a.target_role}
                        </span>
                        {a.department_name && (
                          <span className="badge badge-info">{a.department_name}</span>
                        )}
                        {a.semester_number && (
                          <span className="badge badge-warning">Sem {a.semester_number}</span>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button
                          onClick={() => {
                            setSelectedAnnounce(a);
                            setEditAnnounceForm({
                              title: a.title,
                              content: a.content,
                              target_role: a.target_role,
                              department_id: a.department_id || '',
                              semester_number: a.semester_number || ''
                            });
                            setShowEditAnnounce(true);
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '0.3rem 0.5rem' }}
                          title="Edit Announcement"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => {
                            setConfirmModal({
                              show: true,
                              title: 'Delete Announcement',
                              message: `Are you sure you want to delete announcement "${a.title}"?`,
                              onConfirm: () => handleDeleteAnnouncement(a.id)
                            });
                          }}
                          className="btn btn-danger"
                          style={{ padding: '0.3rem 0.5rem' }}
                          title="Delete Announcement"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#fff', marginBottom: '0.5rem' }}>
                      {a.title}
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                      {a.content}
                    </p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>By {a.author_name}</span>
                    <span>{a.created_at}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* Confirmation Modal */}
      {confirmModal.show && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(6px)' }}>
          <div className="card glass-panel" style={{ width: '420px', maxWidth: '90%', padding: '1.5rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#f87171', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={18} /> {confirmModal.title}
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.4' }}>
              {confirmModal.message}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setConfirmModal({ show: false, title: '', message: '', onConfirm: null })}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="btn btn-danger"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddStudent && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(6px)' }}>
          <div className="card glass-panel" style={{ width: '560px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserPlus size={18} color="var(--accent-primary)" /> Add New Student
              </h3>
              <button onClick={() => setShowAddStudent(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateStudent}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input type="text" className="form-input" required value={sName} onChange={(e) => setSName(e.target.value)} placeholder="e.g. Yash Patel" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input type="email" className="form-input" required value={sEmail} onChange={(e) => setSEmail(e.target.value)} placeholder="yash@campusflow.edu" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Student ID / Roll No *</label>
                  <input type="text" className="form-input" required value={sRoll} onChange={(e) => setSRoll(e.target.value)} placeholder="2026-CSE-099" />
                </div>
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <input type="password" className="form-input" required value={sPassword} onChange={(e) => setSPassword(e.target.value)} placeholder="••••••••" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Department *</label>
                  <select className="form-select" required value={sDeptId} onChange={(e) => setSDeptId(e.target.value)}>
                    {departments.map((d) => (
                      <option key={d.id} value={String(d.id)}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Semester (1-8) *</label>
                  <select className="form-select" required value={sSemester} onChange={(e) => setSSemester(parseInt(e.target.value, 10))}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>Sem {s}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Cohort Year</label>
                  <input type="number" className="form-input" value={sCohortYear} onChange={(e) => setSCohortYear(parseInt(e.target.value, 10))} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Initial GPA</label>
                  <input type="number" step="0.01" min="0" max="4.0" className="form-input" value={sGpa} onChange={(e) => setSGpa(parseFloat(e.target.value))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Target GPA</label>
                  <input type="number" step="0.01" min="0" max="4.0" className="form-input" value={sTargetGpa} onChange={(e) => setSTargetGpa(parseFloat(e.target.value))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input type="text" className="form-input" value={sPhone} onChange={(e) => setSPhone(e.target.value)} placeholder="+91 98765 43210" />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" onClick={() => setShowAddStudent(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Create & Enroll Student</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {showEditStudent && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(6px)' }}>
          <div className="card glass-panel" style={{ width: '560px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit2 size={18} color="var(--accent-primary)" /> Edit Student Profile
              </h3>
              <button onClick={() => setShowEditStudent(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditStudent}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input type="text" className="form-input" required value={editStudentForm.full_name || ''} onChange={(e) => setEditStudentForm({ ...editStudentForm, full_name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input type="email" className="form-input" required value={editStudentForm.email || ''} onChange={(e) => setEditStudentForm({ ...editStudentForm, email: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Student ID / Roll No *</label>
                  <input type="text" className="form-input" required value={editStudentForm.roll_number || ''} onChange={(e) => setEditStudentForm({ ...editStudentForm, roll_number: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Department *</label>
                  <select className="form-select" required value={editStudentForm.department_id || ''} onChange={(e) => setEditStudentForm({ ...editStudentForm, department_id: e.target.value })}>
                    {departments.map((d) => (
                      <option key={d.id} value={String(d.id)}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Semester *</label>
                  <select className="form-select" required value={editStudentForm.semester_number || 1} onChange={(e) => setEditStudentForm({ ...editStudentForm, semester_number: parseInt(e.target.value, 10) })}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>Sem {s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">GPA</label>
                  <input type="number" step="0.01" min="0" max="4.0" className="form-input" value={editStudentForm.gpa || 0} onChange={(e) => setEditStudentForm({ ...editStudentForm, gpa: parseFloat(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Target GPA</label>
                  <input type="number" step="0.01" min="0" max="4.0" className="form-input" value={editStudentForm.target_gpa || 0} onChange={(e) => setEditStudentForm({ ...editStudentForm, target_gpa: parseFloat(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input type="text" className="form-input" value={editStudentForm.phone || ''} onChange={(e) => setEditStudentForm({ ...editStudentForm, phone: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" onClick={() => setShowEditStudent(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Faculty Modal */}
      {showAddFaculty && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(6px)' }}>
          <div className="card glass-panel" style={{ width: '540px', maxWidth: '90%', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={18} color="#a78bfa" /> Add New Faculty Member
              </h3>
              <button onClick={() => setShowAddFaculty(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateFaculty}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input type="text" className="form-input" required value={fName} onChange={(e) => setFName(e.target.value)} placeholder="Dr. Rajesh Varma" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input type="email" className="form-input" required value={fEmail} onChange={(e) => setFEmail(e.target.value)} placeholder="rajesh@campusflow.edu" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Employee ID *</label>
                  <input type="text" className="form-input" required value={fEmpId} onChange={(e) => setFEmpId(e.target.value)} placeholder="FAC-ECE-105" />
                </div>
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <input type="password" className="form-input" required value={fPassword} onChange={(e) => setFPassword(e.target.value)} placeholder="••••••••" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Department *</label>
                  <select className="form-select" required value={fDeptId} onChange={(e) => setFDeptId(e.target.value)}>
                    {departments.map((d) => (
                      <option key={d.id} value={String(d.id)}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Designation</label>
                  <select className="form-select" value={fDesignation} onChange={(e) => setFDesignation(e.target.value)}>
                    <option value="Professor">Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Department Head">Department Head</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Office Hours</label>
                <input type="text" className="form-input" value={fOfficeHours} onChange={(e) => setFOfficeHours(e.target.value)} placeholder="Tue, Thu 2:00 PM - 4:00 PM" />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" onClick={() => setShowAddFaculty(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Create Faculty Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Faculty Modal */}
      {showEditFaculty && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(6px)' }}>
          <div className="card glass-panel" style={{ width: '540px', maxWidth: '90%', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit2 size={18} color="#a78bfa" /> Edit Faculty Profile
              </h3>
              <button onClick={() => setShowEditFaculty(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditFaculty}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input type="text" className="form-input" required value={editFacultyForm.full_name || ''} onChange={(e) => setEditFacultyForm({ ...editFacultyForm, full_name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input type="email" className="form-input" required value={editFacultyForm.email || ''} onChange={(e) => setEditFacultyForm({ ...editFacultyForm, email: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Employee ID *</label>
                  <input type="text" className="form-input" required value={editFacultyForm.employee_id || ''} onChange={(e) => setEditFacultyForm({ ...editFacultyForm, employee_id: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Department *</label>
                  <select className="form-select" required value={editFacultyForm.department_id || ''} onChange={(e) => setEditFacultyForm({ ...editFacultyForm, department_id: e.target.value })}>
                    {departments.map((d) => (
                      <option key={d.id} value={String(d.id)}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Designation</label>
                  <select className="form-select" value={editFacultyForm.designation || 'Assistant Professor'} onChange={(e) => setEditFacultyForm({ ...editFacultyForm, designation: e.target.value })}>
                    <option value="Professor">Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Department Head">Department Head</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Office Hours</label>
                  <input type="text" className="form-input" value={editFacultyForm.office_hours || ''} onChange={(e) => setEditFacultyForm({ ...editFacultyForm, office_hours: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" onClick={() => setShowEditFaculty(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Department Modal */}
      {showAddDept && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(6px)' }}>
          <div className="card glass-panel" style={{ width: '480px', maxWidth: '90%', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building size={18} color="#34d399" /> Add Department
              </h3>
              <button onClick={() => setShowAddDept(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateDepartment}>
              <div className="form-group">
                <label className="form-label">Department Code (Short) *</label>
                <input type="text" className="form-input" required value={dCode} onChange={(e) => setDCode(e.target.value.toUpperCase())} placeholder="e.g. AI / ME / CE" />
              </div>

              <div className="form-group">
                <label className="form-label">Department Name *</label>
                <input type="text" className="form-input" required value={dName} onChange={(e) => setDName(e.target.value)} placeholder="e.g. Artificial Intelligence" />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" rows={3} value={dDesc} onChange={(e) => setDDesc(e.target.value)} placeholder="Department overview and domain focus..." />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" onClick={() => setShowAddDept(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Create Department</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Department Modal */}
      {showEditDept && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(6px)' }}>
          <div className="card glass-panel" style={{ width: '480px', maxWidth: '90%', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit2 size={18} color="#34d399" /> Edit Department
              </h3>
              <button onClick={() => setShowEditDept(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditDepartment}>
              <div className="form-group">
                <label className="form-label">Department Code *</label>
                <input type="text" className="form-input" required value={editDeptForm.code || ''} onChange={(e) => setEditDeptForm({ ...editDeptForm, code: e.target.value.toUpperCase() })} />
              </div>

              <div className="form-group">
                <label className="form-label">Department Name *</label>
                <input type="text" className="form-input" required value={editDeptForm.name || ''} onChange={(e) => setEditDeptForm({ ...editDeptForm, name: e.target.value })} />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" rows={3} value={editDeptForm.description || ''} onChange={(e) => setEditDeptForm({ ...editDeptForm, description: e.target.value })} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" onClick={() => setShowEditDept(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Course / Subject Modal */}
      {showAddCourse && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(6px)' }}>
          <div className="card glass-panel" style={{ width: '500px', maxWidth: '90%', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BookOpen size={18} color="#fbbf24" /> Add Course / Subject
              </h3>
              <button onClick={() => setShowAddCourse(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCourse}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Subject Code *</label>
                  <input type="text" className="form-input" required value={cCode} onChange={(e) => setCCode(e.target.value.toUpperCase())} placeholder="CS501" />
                </div>
                <div className="form-group">
                  <label className="form-label">Subject Title *</label>
                  <input type="text" className="form-input" required value={cTitle} onChange={(e) => setCTitle(e.target.value)} placeholder="Distributed Systems" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Department *</label>
                  <select className="form-select" required value={cDeptId} onChange={(e) => setCDeptId(e.target.value)}>
                    {departments.map((d) => (
                      <option key={d.id} value={String(d.id)}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Semester (1-8) *</label>
                  <select className="form-select" required value={cSemester} onChange={(e) => setCSemester(parseInt(e.target.value, 10))}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>Sem {s}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Credits *</label>
                  <input type="number" min="1" max="10" className="form-input" required value={cCredits} onChange={(e) => setCCredits(parseInt(e.target.value, 10))} />
                </div>
              </div>

              <p style={{ fontSize: '0.78rem', color: '#38bdf8', marginTop: '0.2rem' }}>
                ℹ️ Students matching this Department and Semester will be auto-enrolled immediately.
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" onClick={() => setShowAddCourse(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Add Subject</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Course / Subject Modal */}
      {showEditCourse && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(6px)' }}>
          <div className="card glass-panel" style={{ width: '500px', maxWidth: '90%', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit2 size={18} color="#fbbf24" /> Edit Course / Subject
              </h3>
              <button onClick={() => setShowEditCourse(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditCourse}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Subject Code *</label>
                  <input type="text" className="form-input" required value={editCourseForm.code || ''} onChange={(e) => setEditCourseForm({ ...editCourseForm, code: e.target.value.toUpperCase() })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Subject Title *</label>
                  <input type="text" className="form-input" required value={editCourseForm.title || ''} onChange={(e) => setEditCourseForm({ ...editCourseForm, title: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Department *</label>
                  <select className="form-select" required value={editCourseForm.department_id || ''} onChange={(e) => setEditCourseForm({ ...editCourseForm, department_id: e.target.value })}>
                    {departments.map((d) => (
                      <option key={d.id} value={String(d.id)}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Semester *</label>
                  <select className="form-select" required value={editCourseForm.semester_number || 1} onChange={(e) => setEditCourseForm({ ...editCourseForm, semester_number: parseInt(e.target.value, 10) })}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>Sem {s}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Credits *</label>
                  <input type="number" min="1" max="10" className="form-input" required value={editCourseForm.credits || 4} onChange={(e) => setEditCourseForm({ ...editCourseForm, credits: parseInt(e.target.value, 10) })} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" onClick={() => setShowEditCourse(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Publish Announcement Modal */}
      {showAddAnnounce && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(6px)' }}>
          <div className="card glass-panel" style={{ width: '540px', maxWidth: '90%', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Megaphone size={18} color="#f87171" /> Publish Announcement
              </h3>
              <button onClick={() => setShowAddAnnounce(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement}>
              <div className="form-group">
                <label className="form-label">Announcement Title *</label>
                <input type="text" className="form-input" required value={aTitle} onChange={(e) => setATitle(e.target.value)} placeholder="e.g. Mid-Term Examination Schedule Released" />
              </div>

              <div className="form-group">
                <label className="form-label">Message Content *</label>
                <textarea className="form-textarea" rows={4} required value={aContent} onChange={(e) => setAContent(e.target.value)} placeholder="Write details and important dates for students and faculty..." />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Target Audience</label>
                  <select className="form-select" value={aTarget} onChange={(e) => setATarget(e.target.value)}>
                    <option value="all">All Users</option>
                    <option value="student">Students Only</option>
                    <option value="faculty">Faculty Only</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Department (Optional)</label>
                  <select className="form-select" value={aDeptId} onChange={(e) => setADeptId(e.target.value)}>
                    <option value="">All Departments</option>
                    {departments.map((d) => (
                      <option key={d.id} value={String(d.id)}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Semester (Optional)</label>
                  <select className="form-select" value={aSemester} onChange={(e) => setASemester(e.target.value)}>
                    <option value="">All Semesters</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>Sem {s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" onClick={() => setShowAddAnnounce(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Publish Announcement</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Announcement Modal */}
      {showEditAnnounce && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(6px)' }}>
          <div className="card glass-panel" style={{ width: '540px', maxWidth: '90%', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit2 size={18} color="#f87171" /> Edit Announcement
              </h3>
              <button onClick={() => setShowEditAnnounce(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditAnnouncement}>
              <div className="form-group">
                <label className="form-label">Announcement Title *</label>
                <input type="text" className="form-input" required value={editAnnounceForm.title || ''} onChange={(e) => setEditAnnounceForm({ ...editAnnounceForm, title: e.target.value })} />
              </div>

              <div className="form-group">
                <label className="form-label">Message Content *</label>
                <textarea className="form-textarea" rows={4} required value={editAnnounceForm.content || ''} onChange={(e) => setEditAnnounceForm({ ...editAnnounceForm, content: e.target.value })} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Target Audience</label>
                  <select className="form-select" value={editAnnounceForm.target_role || 'all'} onChange={(e) => setEditAnnounceForm({ ...editAnnounceForm, target_role: e.target.value })}>
                    <option value="all">All Users</option>
                    <option value="student">Students Only</option>
                    <option value="faculty">Faculty Only</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select className="form-select" value={editAnnounceForm.department_id || ''} onChange={(e) => setEditAnnounceForm({ ...editAnnounceForm, department_id: e.target.value })}>
                    <option value="">All Departments</option>
                    {departments.map((d) => (
                      <option key={d.id} value={String(d.id)}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Semester</label>
                  <select className="form-select" value={editAnnounceForm.semester_number || ''} onChange={(e) => setEditAnnounceForm({ ...editAnnounceForm, semester_number: e.target.value })}>
                    <option value="">All Semesters</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>Sem {s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" onClick={() => setShowEditAnnounce(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Profile Photo Modal */}
      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
    </div>
  );
};

export default AdminDashboard;
