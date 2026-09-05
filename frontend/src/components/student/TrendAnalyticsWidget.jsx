import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';

const TrendAnalyticsWidget = () => {
  const attendanceTrendData = [
    { month: 'Sep', attendance: 92, target: 75 },
    { month: 'Oct', attendance: 88, target: 75 },
    { month: 'Nov', attendance: 84, target: 75 },
    { month: 'Dec', attendance: 87, target: 75 },
    { month: 'Jan', attendance: 91, target: 75 },
    { month: 'Feb', attendance: 88, target: 75 },
  ];

  const internalMarksData = [
    { subject: 'CS301 (OS)', midSem: 84, quiz: 90, lab: 88 },
    { subject: 'CS302 (DBMS)', midSem: 79, quiz: 82, lab: 90 },
    { subject: 'CS303 (CN)', midSem: 88, quiz: 85, lab: 84 },
    { subject: 'CS305 (AI)', midSem: 92, quiz: 94, lab: 91 },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
      {/* Attendance History Trend */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={18} color="#06b6d4" />
            <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>Attendance Trajectory Trend</h3>
          </div>
          <span className="badge badge-info">+3.2% vs Prev Month</span>
        </div>

        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          "Your overall attendance improved by 3.2% over the last assessment block."
        </p>

        <div style={{ width: '100%', height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={attendanceTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
              <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
              <YAxis domain={[50, 100]} stroke="var(--text-muted)" fontSize={12} />
              <Tooltip contentStyle={{ background: '#111827', borderColor: '#374151', borderRadius: '8px', color: '#fff' }} />
              <Line type="monotone" dataKey="attendance" stroke="#06b6d4" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Actual Attendance %" />
              <Line type="monotone" dataKey="target" stroke="#f43f5e" strokeDasharray="5 5" strokeWidth={2} name="75% Target Threshold" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Marks Progress Comparison */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={18} color="#8b5cf6" />
            <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>Internal Assessment Marks Comparison</h3>
          </div>
          <span className="badge badge-success">86% Avg Mastery</span>
        </div>

        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Comparison across Mid-Sem tests, Quizzes, and Practical Labs.
        </p>

        <div style={{ width: '100%', height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={internalMarksData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
              <XAxis dataKey="subject" stroke="var(--text-muted)" fontSize={11} />
              <YAxis domain={[0, 100]} stroke="var(--text-muted)" fontSize={12} />
              <Tooltip contentStyle={{ background: '#111827', borderColor: '#374151', borderRadius: '8px', color: '#fff' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="midSem" fill="#8b5cf6" name="Mid-Sem Test" radius={[4, 4, 0, 0]} />
              <Bar dataKey="quiz" fill="#38bdf8" name="Quizzes" radius={[4, 4, 0, 0]} />
              <Bar dataKey="lab" fill="#34d399" name="Labs" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default TrendAnalyticsWidget;
