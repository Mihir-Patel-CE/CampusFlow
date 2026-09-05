import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AttendancePage from './pages/AttendancePage';
import MarksPage from './pages/MarksPage';
import AssignmentsPage from './pages/AssignmentsPage';
import StudyPlannerPage from './pages/StudyPlannerPage';
import TimetablePage from './pages/TimetablePage';

const AppContent = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  if (!user) {
    return <Login />;
  }

  const renderView = () => {
    // Role-specific router
    if (user.role === 'faculty') {
      return <FacultyDashboard activeTab={activeTab} setActiveTab={setActiveTab} />;
    }
    if (user.role === 'admin') {
      return <AdminDashboard activeTab={activeTab} setActiveTab={setActiveTab} />;
    }

    // Student tab router
    switch (activeTab) {
      case 'dashboard':
        return <StudentDashboard setActiveTab={setActiveTab} />;
      case 'daily-actions':
        return <StudentDashboard setActiveTab={setActiveTab} />;
      case 'study-planner':
        return <StudyPlannerPage />;
      case 'attendance':
        return <AttendancePage />;
      case 'marks':
        return <MarksPage />;
      case 'assignments':
        return <AssignmentsPage />;
      case 'timetable':
        return <TimetablePage />;
      default:
        return <StudentDashboard setActiveTab={setActiveTab} />;
    }
  };

  const roleTitle = user.role === 'admin'
    ? 'Administration Hub'
    : user.role === 'faculty'
    ? 'Faculty Management'
    : 'Student Workspace';

  return (
    <div className="app-container">
      {/* Mobile Drawer Backdrop */}
      <div
        className={`mobile-nav-backdrop ${mobileNavOpen ? 'show' : ''}`}
        onClick={() => setMobileNavOpen(false)}
      />

      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      <div className="main-content">
        <Header
          title={roleTitle}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onToggleSidebar={() => setMobileNavOpen(!mobileNavOpen)}
        />
        {renderView()}
      </div>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
