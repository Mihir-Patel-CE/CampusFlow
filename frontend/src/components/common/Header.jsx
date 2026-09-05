import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import UserAvatar from './UserAvatar';
import ProfileModal from './ProfileModal';
import api from '../../services/api';
import {
  Bell, LogOut, Camera, User, Search, Menu, X, ChevronDown,
  CheckCircle2, Megaphone, AlertTriangle, BookOpen,
  Calendar, LayoutDashboard, BrainCircuit, Users, Building, BarChart3,
  TrendingUp
} from 'lucide-react';

const Header = ({ title = "Dashboard", activeTab, setActiveTab, onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [unreadCount, setUnreadCount] = useState(2);

  const menuRef = useRef(null);
  const notifRef = useRef(null);
  const searchRef = useRef(null);

  // Fetch announcements for notifications popup
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await api.get('/auth/announcements');
        if (res.data) {
          setAnnouncements(res.data.slice(0, 5));
        }
      } catch (err) {
        // quiet fallback
      }
    };
    fetchAnnouncements();
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Quick navigation items for search jump
  const studentNavItems = [
    { id: 'dashboard', label: 'Overview Dashboard', category: 'General', icon: LayoutDashboard },
    { id: 'daily-actions', label: 'Smart Daily Actions', category: 'Features', icon: CheckCircle2 },
    { id: 'study-planner', label: 'AI Study Planner Generator', category: 'Features', icon: BrainCircuit },
    { id: 'attendance', label: 'Subject Attendance Logs', category: 'Academic', icon: Calendar },
    { id: 'marks', label: 'Internal Marks & Assessments', category: 'Academic', icon: TrendingUp },
    { id: 'assignments', label: 'Assignments & Homework Suite', category: 'Academic', icon: BookOpen },
    { id: 'timetable', label: 'Timetable & Class Schedule', category: 'Schedule', icon: Calendar }
  ];

  const facultyNavItems = [
    { id: 'dashboard', label: 'Faculty Overview', category: 'General', icon: LayoutDashboard },
    { id: 'attendance-management', label: 'Mark Batch Attendance', category: 'Teaching', icon: CheckCircle2 },
    { id: 'marks-entry', label: 'Internal Gradebook Marks', category: 'Teaching', icon: TrendingUp },
    { id: 'assignments-manager', label: 'Assignments Management Suite', category: 'Teaching', icon: BookOpen },
    { id: 'timetable-manager', label: 'My Timetable Schedule', category: 'Schedule', icon: Calendar },
    { id: 'at-risk-flagged', label: 'At-Risk Students ML Flags', category: 'Insights', icon: AlertTriangle }
  ];

  const adminNavItems = [
    { id: 'dashboard', label: 'Institution Overview', category: 'General', icon: LayoutDashboard },
    { id: 'users-manager', label: 'User Directory (Students & Faculty)', category: 'Management', icon: Users },
    { id: 'dept-manager', label: 'Departments & Course Catalog', category: 'Management', icon: Building },
    { id: 'analytics-hub', label: 'Institution Analytics Hub', category: 'Analytics', icon: BarChart3 },
    { id: 'announcements-publisher', label: 'Announcements Publisher', category: 'Communications', icon: Megaphone }
  ];

  const availableNav = user?.role === 'admin' ? adminNavItems : user?.role === 'faculty' ? facultyNavItems : studentNavItems;

  const filteredNav = searchQuery.trim()
    ? availableNav.filter(item =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleSelectNav = (tabId) => {
    if (setActiveTab) {
      setActiveTab(tabId);
    }
    setSearchQuery('');
    setShowSearchDropdown(false);
  };

  return (
    <>
      <header className="header-bar" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.9rem 2rem',
        background: 'rgba(13, 19, 34, 0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-color)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        gap: '1rem'
      }}>
        {/* Left: Mobile Toggle & Page Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="btn btn-secondary"
              style={{ padding: '0.45rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              aria-label="Toggle navigation menu"
            >
              <Menu size={18} />
            </button>
          )}

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                {title}
              </h2>
            </div>
            <p className="hide-mobile" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
              CampusFlow Higher-Ed SaaS Platform
            </p>
          </div>
        </div>

        {/* Center: Global Quick Action Search Bar */}
        <div ref={searchRef} style={{ position: 'relative', flex: '1', maxWidth: '380px' }} className="hide-mobile">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.35rem 0.75rem',
            gap: '0.5rem',
            transition: 'border-color 0.2s ease'
          }}>
            <Search size={15} color="var(--text-muted)" />
            <input
              type="text"
              placeholder={`Quick search ${user?.role || 'workspace'} tools...`}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => setShowSearchDropdown(true)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: '0.82rem',
                width: '100%',
                fontFamily: 'inherit'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Quick Search Results Dropdown */}
          {showSearchDropdown && searchQuery.trim() && (
            <div className="dropdown-menu" style={{ width: '100%', top: 'calc(100% + 6px)', left: 0 }}>
              <div style={{ padding: '0.5rem 0.85rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
                Navigation Jump ({filteredNav.length})
              </div>
              {filteredNav.length > 0 ? (
                filteredNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectNav(item.id)}
                      className="dropdown-item"
                    >
                      <Icon size={16} color="#a78bfa" />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{item.label}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>• {item.category}</span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div style={{ padding: '0.85rem', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  No matching workspace actions found
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Notifications & User Menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {/* Notification Bell with Dropdown */}
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setUnreadCount(0);
              }}
              style={{
                background: showNotifications ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-color)',
                borderRadius: '50%',
                width: '38px',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: showNotifications ? '#a78bfa' : 'var(--text-secondary)',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.2s ease'
              }}
              aria-label="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  background: '#f43f5e',
                  border: '2px solid var(--bg-dark)'
                }} />
              )}
            </button>

            {/* Notifications Popover */}
            {showNotifications && (
              <div className="dropdown-menu" style={{ width: '320px', right: 0 }}>
                <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)' }}>Announcements & Alerts</span>
                  <span className="badge badge-info" style={{ fontSize: '0.62rem' }}>Live</span>
                </div>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {announcements.length > 0 ? (
                    announcements.map((ann) => (
                      <div
                        key={ann.id}
                        style={{
                          padding: '0.75rem 1rem',
                          borderBottom: '1px solid var(--border-color)',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                          <Megaphone size={13} color="#a78bfa" />
                          <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#a78bfa' }}>{ann.title}</span>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.35, margin: 0 }}>
                          {ann.content}
                        </p>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                          Target: {ann.target_role?.toUpperCase() || 'ALL'} • {ann.created_at ? new Date(ann.created_at).toLocaleDateString() : 'Recent'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      No new announcements
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Dropdown Pill */}
          {user && (
            <div ref={menuRef} style={{ position: 'relative' }}>
              <div
                onClick={() => setShowUserMenu(!showUserMenu)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.3rem 0.65rem 0.3rem 0.4rem',
                  background: showUserMenu ? 'rgba(139, 92, 246, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <UserAvatar
                  src={user.avatar_url}
                  name={user.full_name}
                  role={user.role}
                  size={32}
                  showCamera={false}
                />

                <div className="hide-mobile" style={{ textAlign: 'left' }}>
                  <p style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-primary)', lineHeight: 1.15, margin: 0 }}>
                    {user.full_name}
                  </p>
                  <span className={`badge ${user.role === 'admin' ? 'badge-danger' : user.role === 'faculty' ? 'badge-info' : 'badge-success'}`} style={{ fontSize: '0.62rem', padding: '0.1rem 0.45rem', marginTop: '0.15rem' }}>
                    {user.role}
                  </span>
                </div>

                <ChevronDown size={14} color="var(--text-muted)" />
              </div>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className="dropdown-menu" style={{ width: '220px', right: 0 }}>
                  <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)' }}>
                    <p style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                      {user.full_name}
                    </p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {user.email}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      setIsProfileOpen(true);
                    }}
                    className="dropdown-item"
                  >
                    <Camera size={15} color="#a78bfa" />
                    <span>Profile & Photo</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      setIsProfileOpen(true);
                    }}
                    className="dropdown-item"
                  >
                    <User size={15} color="#38bdf8" />
                    <span>Account Settings</span>
                  </button>

                  <div style={{ borderTop: '1px solid var(--border-color)' }}>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="dropdown-item danger"
                    >
                      <LogOut size={15} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Profile & Photo Modal */}
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </>
  );
};

export default Header;
