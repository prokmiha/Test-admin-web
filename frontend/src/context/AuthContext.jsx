import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AuthContext = createContext(null);

const SESSION_KEY = 'admin_session_token';
const USER_KEY = 'admin_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const getToken = () => localStorage.getItem(SESSION_KEY);

  const validateSession = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get(`${API_URL}/api/auth/me`, {
        params: { token },
      });
      setUser(res.data);
      localStorage.setItem(USER_KEY, JSON.stringify(res.data));
    } catch {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(USER_KEY);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    validateSession();
  }, [validateSession]);

  const loginWithTelegram = async (telegramData) => {
    const res = await axios.post(`${API_URL}/api/auth/telegram`, telegramData);
    const { session_token, user: userData } = res.data;
    localStorage.setItem(SESSION_KEY, session_token);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    const token = getToken();
    try {
      await axios.post(`${API_URL}/api/auth/logout`, null, {
        params: { token },
      });
    } catch {
      // ignore
    }
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithTelegram, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
