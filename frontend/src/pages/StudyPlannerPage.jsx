import React, { useState, useEffect } from 'react';
import api from '../services/api';
import StudyPlannerModal from '../components/student/StudyPlannerModal';
import { BrainCircuit, Sparkles } from 'lucide-react';

const StudyPlannerPage = () => {
  const [courses, setCourses] = useState([]);
  const [showModal, setShowModal] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get('/student/dashboard');
        setCourses(res.data.courses || []);
      } catch (err) {
        console.error('Failed to load courses for planner', err);
      }
    };
    fetchCourses();
  }, []);

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="title-gradient" style={{ fontSize: '1.75rem', fontWeight: '800' }}>
            Smart Study Planner Workspace
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Personalized exam preparation schedule generator based on subject difficulty, target hours, and exam dates.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <BrainCircuit size={18} /> Open Planner Generator
        </button>
      </div>

      <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
        <BrainCircuit size={48} color="#06b6d4" style={{ margin: '0 auto 1rem' }} />
        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>AI-Powered Exam Preparation Engine</h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '540px', margin: '0 auto 1.5rem' }}>
          Input your upcoming exam date, available daily study hours, and subject mastery levels to receive a day-by-day roadmap tailored to your specific performance.
        </p>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          Generate Custom Schedule <Sparkles size={16} />
        </button>
      </div>

      {showModal && (
        <StudyPlannerModal
          courses={courses}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default StudyPlannerPage;
