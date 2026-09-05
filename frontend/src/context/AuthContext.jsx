import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('campusflow_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verifyUserSession = async () => {
      const token = localStorage.getItem('campusflow_token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
          localStorage.setItem('campusflow_user', JSON.stringify(res.data));
        } catch (err) {
          localStorage.removeItem('campusflow_token');
          localStorage.removeItem('campusflow_user');
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };
    verifyUserSession();
  }, []);

  const login = async (email, password, accountType = null) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/login', {
        email: (email || '').trim(),
        password: password || '',
        account_type: accountType
      });
      const { access_token, user: userData } = res.data;
      localStorage.setItem('campusflow_token', access_token);
      localStorage.setItem('campusflow_user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (err) {
      let msg = 'Invalid email or password.';
      if (err.response?.data?.detail) {
        msg = err.response.data.detail;
      } else if (!err.response || err.code === 'ERR_NETWORK') {
        msg = 'Unable to reach backend server. Please make sure the backend is running on port 8000.';
      }
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('campusflow_user', JSON.stringify(userData));
  };

  const logout = () => {
    localStorage.removeItem('campusflow_token');
    localStorage.removeItem('campusflow_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
