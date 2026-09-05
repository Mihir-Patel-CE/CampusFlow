import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  CheckCircle2,
  BookOpen,
  Calendar,
  Sparkles,
  TrendingUp,
  BrainCircuit,
  Users,
  Building,
  Megaphone,
  BarChart3,
  X
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, mobileOpen, onCloseMobile }) => {
  const { user } = useAuth();
  const role = user?.role || 'student';

  const studentLinks = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'daily-actions', label: 'Daily Actions', icon: CheckCircle2, badge: 'Smart' },
    { id: 'study-planner', label: 'Study Planner', icon: BrainCircuit, badge: 'AI' },
    { id: 'attendance', label: 'Attendance', icon: Calendar },
    { id: 'marks', label: 'Marks & Internal', icon: TrendingUp },
    { id: 'assignments', label: 'Assignments', icon: BookOpen },
    { id: 'timetable', label: 'Timetable', icon: Calendar }
  ];

  const facultyLinks = [
    { id: 'dashboard', label: 'Faculty Overview', icon: LayoutDashboard },
    { id: 'attendance-management', label: 'Mark Attendance', icon: CheckCircle2 },
    { id: 'marks-entry', label: 'Internal Gradebook', icon: TrendingUp },
    { id: 'assignments-manager', label: 'Assignments Suite', icon: BookOpen },
    { id: 'timetable-manager', label: 'My Timetable', icon: Calendar },
    { id: 'at-risk-flagged', label: 'At-Risk Students', icon: BrainCircuit, badge: 'ML Flag' }
  ];

  const adminLinks = [
    { id: 'dashboard', label: 'Institution Overview', icon: LayoutDashboard },
    { id: 'users-manager', label: 'User Directory', icon: Users },
    { id: 'dept-manager', label: 'Departments & Courses', icon: Building },
    { id: 'analytics-hub', label: 'Institution Analytics', icon: BarChart3 },
    { id: 'announcements-publisher', label: 'Announcements', icon: Megaphone }
  ];

  const links = role === 'admin' ? adminLinks : role === 'faculty' ? facultyLinks : studentLinks;

  const handleLinkClick = (id) => {
    setActiveTab(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <aside
      className={`sidebar-container ${mobileOpen ? 'sidebar-open' : ''}`}
      style={{
        width: '260px',
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        flexShrink: 0
      }}
    >
      {/* Brand Header */}
      <div style={{
        padding: '1.25rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)'
          }}>
            <Sparkles size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: '800', letterSpacing: '-0.03em', color: '#fff', margin: 0 }}>
              CampusFlow
            </h1>
            <span style={{ fontSize: '0.65rem', color: 'var(--accent-cyan)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Academic SaaS
            </span>
          </div>
        </div>

        {/* Mobile Close Button */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="btn btn-secondary"
            style={{ padding: '0.35rem', display: 'none' }}
            id="mobile-sidebar-close"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <nav style={{ padding: '1.25rem 0.85rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <p style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', paddingLeft: '0.75rem', marginBottom: '0.5rem' }}>
          {role} Workspace
        </p>

        {links.map((link) => {
          const Icon = link.icon;
          const isActive = activeTab === link.id;

          return (
            <button
              key={link.id}
              onClick={() => handleLinkClick(link.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: isActive ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                color: isActive ? '#a78bfa' : 'var(--text-secondary)',
                fontWeight: isActive ? '700' : '500',
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Icon size={18} color={isActive ? '#a78bfa' : 'var(--text-muted)'} />
                <span>{link.label}</span>
              </div>
              {link.badge && (
                <span className="badge badge-info" style={{ fontSize: '0.6rem', padding: '0.1rem 0.4rem' }}>
                  {link.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
