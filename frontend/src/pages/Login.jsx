import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Sparkles, ShieldAlert, CheckCircle2, UserCheck, GraduationCap, Shield, ArrowLeft } from 'lucide-react';

const Login = () => {
  const { login, loading, error } = useAuth();

  // Mode: 'login' | 'register'
  const [mode, setMode] = useState('login');

  // Account Type selector: 'student' | 'faculty' | 'admin'
  const [accountType, setAccountType] = useState('student');

  // Login Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register Form state
  const [departments, setDepartments] = useState([]);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRoll, setRegRoll] = useState('');
  const [regDeptId, setRegDeptId] = useState('');
  const [regSemester, setRegSemester] = useState(1);
  const [regDivision, setRegDivision] = useState('A');
  const [regCohortYear, setRegCohortYear] = useState(2024);
  const [regPhone, setRegPhone] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState('');
  const [regError, setRegError] = useState('');

  useEffect(() => {
    // Fetch public departments list for registration dropdown
    const loadDepts = async () => {
      try {
        const res = await api.get('/auth/departments');
        setDepartments(res.data);
        if (res.data.length > 0) {
          setRegDeptId((prev) => (prev !== '' ? prev : String(res.data[0].id)));
        }
      } catch (err) {
        console.error('Failed to load departments', err);
      }
    };
    loadDepts();
  }, []);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password, accountType);
    } catch (err) {
      // handled in context error state
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    if (accountType === 'faculty') {
      setRegError('Faculty accounts require administrator approval.');
      return;
    }
    if (accountType === 'admin') {
      setRegError('Admin accounts can only be created by an authorized administrator.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match.');
      return;
    }

    if (regPassword.length < 6) {
      setRegError('Password must be at least 6 characters long.');
      return;
    }

    setRegLoading(true);
    try {
      await api.post('/auth/register/student', {
        full_name: regName,
        email: regEmail,
        password: regPassword,
        confirm_password: regConfirmPassword,
        roll_number: regRoll,
        department_id: parseInt(regDeptId),
        semester_number: parseInt(regSemester),
        division: regDivision,
        cohort_year: parseInt(regCohortYear),
        phone: regPhone
      });

      setRegSuccess('Student account created successfully! You can now log in.');
      setEmail(regEmail);
      setPassword('');
      setTimeout(() => {
        setMode('login');
      }, 1800);
    } catch (err) {
      setRegError(err.response?.data?.detail || 'Registration failed. Please check your inputs.');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 0%, #1e1b4b 0%, #090d16 80%)',
      padding: '1.5rem'
    }}>
      <div style={{
        maxWidth: mode === 'register' ? '540px' : '440px',
        width: '100%',
        background: 'rgba(17, 24, 39, 0.85)',
        backdropFilter: 'blur(16px)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '2.25rem 2rem',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
        transition: 'all 0.3s ease'
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            margin: '0 auto 0.75rem',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 6px 20px rgba(139, 92, 246, 0.4)'
          }}>
            <Sparkles size={26} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#fff' }}>CampusFlow</h1>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
            Smart College Student & Academic SaaS Platform
          </p>
        </div>

        {/* Account Type Selector Tabs */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label className="form-label" style={{ textAlign: 'center', marginBottom: '0.4rem', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Select Account Type:
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => { setAccountType('student'); setRegError(''); }}
              style={{
                flex: 1,
                padding: '0.55rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                background: accountType === 'student' ? 'rgba(139, 92, 246, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                color: accountType === 'student' ? '#a78bfa' : 'var(--text-muted)',
                fontWeight: accountType === 'student' ? '700' : '500',
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s ease'
              }}
            >
              <GraduationCap size={15} /> Student
            </button>

            <button
              type="button"
              onClick={() => { setAccountType('faculty'); setRegError(''); }}
              style={{
                flex: 1,
                padding: '0.55rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                background: accountType === 'faculty' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                color: accountType === 'faculty' ? '#38bdf8' : 'var(--text-muted)',
                fontWeight: accountType === 'faculty' ? '700' : '500',
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s ease'
              }}
            >
              <UserCheck size={15} /> Faculty
            </button>

            <button
              type="button"
              onClick={() => { setAccountType('admin'); setRegError(''); }}
              style={{
                flex: 1,
                padding: '0.55rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                background: accountType === 'admin' ? 'rgba(248, 113, 113, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                color: accountType === 'admin' ? '#f87171' : 'var(--text-muted)',
                fontWeight: accountType === 'admin' ? '700' : '500',
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s ease'
              }}
            >
              <Shield size={15} /> Admin
            </button>
          </div>
        </div>

        {/* LOGIN MODE */}
        {mode === 'login' && (
          <>
            {error && (
              <div style={{
                padding: '0.75rem 1rem',
                background: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                borderRadius: 'var(--radius-sm)',
                color: '#f87171',
                fontSize: '0.85rem',
                marginBottom: '1.25rem'
              }}>
                {error}
              </div>
            )}

            {regSuccess && (
              <div style={{
                padding: '0.75rem 1rem',
                background: 'rgba(52, 211, 153, 0.15)',
                border: '1px solid rgba(52, 211, 153, 0.3)',
                borderRadius: 'var(--radius-sm)',
                color: '#34d399',
                fontSize: '0.85rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <CheckCircle2 size={16} /> {regSuccess}
              </div>
            )}

            <form onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@campusflow.edu"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Password *</label>
                <input
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }} disabled={loading}>
                {loading ? 'Authenticating...' : 'Sign In to Portal'}
              </button>
            </form>

            <div style={{ marginTop: '1.25rem', textAlign: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <button
                type="button"
                onClick={() => { setMode('register'); setRegError(''); setRegSuccess(''); }}
                style={{ background: 'none', border: 'none', color: '#a78bfa', fontSize: '0.85rem', cursor: 'pointer', fontWeight: '600' }}
              >
                New User? Create Account →
              </button>
            </div>
          </>
        )}

        {/* REGISTRATION MODE */}
        {mode === 'register' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Create {accountType.toUpperCase()} Account</h3>
              <button
                type="button"
                onClick={() => { setMode('login'); setRegError(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              >
                <ArrowLeft size={14} /> Back to Sign In
              </button>
            </div>

            {regError && (
              <div style={{
                padding: '0.75rem 1rem',
                background: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                borderRadius: 'var(--radius-sm)',
                color: '#f87171',
                fontSize: '0.85rem',
                marginBottom: '1.25rem'
              }}>
                {regError}
              </div>
            )}

            {/* Restricted registration callouts */}
            {accountType === 'faculty' && (
              <div style={{ padding: '1.25rem', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '8px', color: '#38bdf8', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                <ShieldAlert size={20} style={{ marginBottom: '0.5rem' }} />
                <p style={{ fontWeight: '700' }}>Faculty accounts require administrator approval.</p>
                <p style={{ fontSize: '0.8rem', marginTop: '0.3rem', color: '#93c5fd' }}>
                  Unrestricted public faculty registration is disabled. Please contact the institution administrator to create and configure your faculty profile.
                </p>
              </div>
            )}

            {accountType === 'admin' && (
              <div style={{ padding: '1.25rem', background: 'rgba(248, 113, 113, 0.1)', border: '1px solid rgba(248, 113, 113, 0.3)', borderRadius: '8px', color: '#f87171', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                <ShieldAlert size={20} style={{ marginBottom: '0.5rem' }} />
                <p style={{ fontWeight: '700' }}>Admin accounts can only be created by an authorized administrator.</p>
                <p style={{ fontSize: '0.8rem', marginTop: '0.3rem', color: '#fca5a5' }}>
                  Public registration for Admin accounts is strictly prohibited to maintain system security.
                </p>
              </div>
            )}

            {/* Student Registration Form */}
            {accountType === 'student' && (
              <form onSubmit={handleRegisterSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Meera Patel"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Student ID / Roll No *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={regRoll}
                      onChange={(e) => setRegRoll(e.target.value)}
                      placeholder="e.g. 2026-CSE-105"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    className="form-input"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="student@campusflow.edu"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                  <div className="form-group">
                    <label className="form-label">Password *</label>
                    <input
                      type="password"
                      className="form-input"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Confirm Password *</label>
                    <input
                      type="password"
                      className="form-input"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                  <div className="form-group">
                    <label className="form-label">Department *</label>
                    <select
                      className="form-select"
                      value={String(regDeptId || '')}
                      onChange={(e) => setRegDeptId(e.target.value)}
                      required
                    >
                      <option value="" disabled>Select Department</option>
                      {departments.map((d) => (
                        <option key={d.id} value={String(d.id)}>{d.code} — {d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Semester</label>
                    <input
                      type="number"
                      className="form-input"
                      min="1"
                      max="8"
                      value={regSemester}
                      onChange={(e) => setRegSemester(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.65rem' }}>
                  <div className="form-group">
                    <label className="form-label">Division</label>
                    <input
                      type="text"
                      className="form-input"
                      value={regDivision}
                      onChange={(e) => setRegDivision(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Enrollment Year</label>
                    <input
                      type="number"
                      className="form-input"
                      value={regCohortYear}
                      onChange={(e) => setRegCohortYear(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input
                      type="text"
                      className="form-input"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+91 9876543210"
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }} disabled={regLoading}>
                  {regLoading ? 'Creating Account...' : 'Complete Student Registration'}
                </button>
              </form>
            )}

            {(accountType === 'faculty' || accountType === 'admin') && (
              <button
                type="button"
                className="btn btn-secondary"
                style={{ width: '100%', marginTop: '0.5rem' }}
                onClick={() => setMode('login')}
              >
                Return to Login
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
