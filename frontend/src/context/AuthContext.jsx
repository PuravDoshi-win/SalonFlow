import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('salonflow_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('salonflow_access_token');
    if (token) {
      api.get('/auth/me')
        .then(res => {
          setUser(res.data);
          localStorage.setItem('salonflow_user', JSON.stringify(res.data));
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password, rememberMe = false) => {
    const res = await api.post('/auth/login', { username, password, remember_me: rememberMe });
    const { access_token, refresh_token, role, user_id, full_name, phone } = res.data;
    localStorage.setItem('salonflow_access_token', access_token);
    localStorage.setItem('salonflow_refresh_token', refresh_token);
    const userData = { id: user_id, full_name, phone, role };
    setUser(userData);
    localStorage.setItem('salonflow_user', JSON.stringify(userData));
    return userData;
  };

  const register = async (fullName, phone, password, email) => {
    const res = await api.post('/auth/register', {
      full_name: fullName,
      phone,
      password,
      email: email || null
    });
    const { access_token, refresh_token, role, user_id, full_name, phone: uPhone } = res.data;
    localStorage.setItem('salonflow_access_token', access_token);
    localStorage.setItem('salonflow_refresh_token', refresh_token);
    const userData = { id: user_id, full_name, phone: uPhone, role };
    setUser(userData);
    localStorage.setItem('salonflow_user', JSON.stringify(userData));
    return userData;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('salonflow_access_token');
      localStorage.removeItem('salonflow_refresh_token');
      localStorage.removeItem('salonflow_user');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
