import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(() => localStorage.getItem('hmms_token'));
  const [loading, setLoading] = useState(true); // true while verifying stored token

  // On mount: if a stored token exists, verify it with /api/auth/me
  useEffect(() => {
    const verify = async () => {
      if (!token) { setLoading(false); return; }
      try {
        const data = await authAPI.getMe(token);
        setUser(data.user);
      } catch {
        // Token invalid or expired — clear it
        localStorage.removeItem('hmms_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (email, password) => {
    const data = await authAPI.login({ email, password });
    localStorage.setItem('hmms_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  }, []);

  const signup = useCallback(async (username, email, password, role = 'student') => {
    const data = await authAPI.signup({ username, email, password, role });
    localStorage.setItem('hmms_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('hmms_token');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}