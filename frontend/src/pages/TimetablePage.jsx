import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import EmptyState from '../components/common/EmptyState';
import {
  Calendar, Clock, MapPin, User, BookOpen, RefreshCw, Layers, CheckCircle2,
  AlertCircle
} from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TimetablePage = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDay, setSelectedDay] = useState('All');

  const fetchTimetable = async () => {
    try {
      setRefreshing(true);
      const res = await api.get('/student/timetable');
      setTimetable(res.data || []);
    } catch (err) {
      console.error('Failed to load student timetable', err);
      toast.error('Failed to load timetable schedule.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, []);

  const filteredEntries = timetable.filter(item => {
    if (selectedDay !== 'All' && item.day_of_week !== selectedDay) return false;
    return true;
  });

  // Group by day of week
  const groupedByDay = {};
  DAYS.forEach(d => { groupedByDay[d] = []; });
  timetable.forEach(item => {
    if (!groupedByDay[item.day_of_week]) {
      groupedByDay[item.day_of_week] = [];
    }
    groupedByDay[item.day_of_week].push(item);
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(139, 92, 246, 0.2)', borderTopColor: '#8b5cf6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading Timetable Schedule...</span>
      </div>
    );
  }

  return (
    <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '3rem' }}>
      {/* Top Banner */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', padding: '1.25rem 1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0 }} className="title-gradient">
              Academic Timetable & Schedule
            </h2>
            <span className="badge badge-success">LIVE SCHEDULE</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem', margin: 0 }}>
            Curriculum schedule managed by faculty for {user?.department || 'Engineering'} • Semester {user?.semester || 1}
          </p>
        </div>

        <button
          onClick={fetchTimetable}
          className="btn btn-secondary"
          disabled={refreshing}
          style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh Schedule'}
        </button>
      </div>

      {/* Day Selector Pills */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setSelectedDay('All')}
          className={`btn ${selectedDay === 'All' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.82rem', padding: '0.45rem 1rem' }}
        >
          All Days ({timetable.length} classes)
        </button>
        {DAYS.map(day => {
          const count = groupedByDay[day]?.length || 0;
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`btn ${selectedDay === day ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.82rem', padding: '0.45rem 0.9rem' }}
            >
              {day} {count > 0 && <span style={{ opacity: 0.85, fontSize: '0.75rem' }}>({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Schedule Content */}
      {selectedDay === 'All' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {DAYS.map(day => {
            const dayClasses = groupedByDay[day] || [];
            if (dayClasses.length === 0) return null;

            return (
              <div key={day} className="card" style={{ padding: '1.25rem 1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem', color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={18} /> {day}
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                  {dayClasses.map((item) => (
                    <div
                      key={item.id}
                      className="card"
                      style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-color)',
                        padding: '1.15rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.6rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="badge badge-info">{item.course_code}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: '#38bdf8', fontWeight: '600' }}>
                          <Clock size={13} /> {item.start_time} - {item.end_time}
                        </div>
                      </div>

                      <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#fff', margin: '0.2rem 0' }}>
                        {item.course_title}
                      </h4>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <MapPin size={13} color="#34d399" /> {item.room}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <User size={13} color="#fbbf24" /> {item.faculty_name}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {timetable.length === 0 && (
            <EmptyState
              icon={Calendar}
              title="No Timetable Published Yet"
              description="Your department faculty has not added class schedule entries for this semester yet. Check back soon."
              compact={false}
            />
          )}
        </div>
      ) : (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.25rem', color: '#a78bfa' }}>
            {selectedDay} Schedule
          </h3>

          {filteredEntries.length === 0 ? (
            <EmptyState
              icon={Clock}
              title={`No classes on ${selectedDay}`}
              description={`There are no lectures or practical labs scheduled for ${selectedDay}.`}
              compact={true}
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {filteredEntries.map((item) => (
                <div
                  key={item.id}
                  className="card"
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-color)',
                    padding: '1.15rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.6rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="badge badge-info">{item.course_code}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: '#38bdf8', fontWeight: '600' }}>
                      <Clock size={13} /> {item.start_time} - {item.end_time}
                    </div>
                  </div>

                  <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#fff', margin: '0.2rem 0' }}>
                    {item.course_title}
                  </h4>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <MapPin size={13} color="#34d399" /> {item.room}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <User size={13} color="#fbbf24" /> {item.faculty_name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TimetablePage;
