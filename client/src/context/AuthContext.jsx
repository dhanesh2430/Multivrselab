import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('hf_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
    const [token, setToken] = useState(() => localStorage.getItem('hf_token') || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      if (!token) return;
      try {
        const { data } = await api.get('/auth/me');
        if (data?.user) {
          setUser(data.user);
          localStorage.setItem('hf_user', JSON.stringify(data.user));
        }
      } catch (err) {
        console.error('Session verify failed:', err);
        if (err.response?.status === 401) {
          localStorage.removeItem('hf_token');
          localStorage.removeItem('hf_user');
          setToken(null);
          setUser(null);
        }
      }
    };
    checkSession();
  }, [token]);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('hf_token', data.token);
      localStorage.setItem('hf_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Login failed.' };
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (username, email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', { username, email, password });
      localStorage.setItem('hf_token', data.token);
      localStorage.setItem('hf_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Registration failed.' };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('hf_token');
    localStorage.removeItem('hf_user');
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('hf_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
