import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('medibridge_token'));
  const [loading, setLoading] = useState(true);

  // Restore authenticated session
  const loadUser = useCallback(async () => {
    const currentToken = localStorage.getItem('medibridge_token');
    if (!currentToken) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      // Check if logged in as admin
      const storedRole = localStorage.getItem('medibridge_role');
      if (storedRole === 'admin') {
        setUser({
          _id: 'system-admin',
          name: 'MEDIBRIDGE Administrator',
          role: 'admin'
        });
        setLoading(false);
        return;
      }

      const res = await api.auth.getMe();
      if (res.success && res.user) {
        setUser(res.user);
        setProfile(res.profile);
      } else {
        logout();
      }
    } catch (err) {
      console.warn('[Auth] Session check failed, clearing token:', err.message);
      logout();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email, password, role) => {
    const res = await api.auth.login({ email, password, role });
    if (res.success && res.token) {
      localStorage.setItem('medibridge_token', res.token);
      localStorage.setItem('medibridge_role', res.user.role);
      setToken(res.token);
      setUser(res.user);
      setProfile(res.profile);
      return res;
    }
    throw new Error(res.message || 'Login failed');
  };

  const adminLogin = async (email, password) => {
    const res = await api.admin.login({ email, password });
    if (res.success && res.token) {
      localStorage.setItem('medibridge_token', res.token);
      localStorage.setItem('medibridge_role', 'admin');
      setToken(res.token);
      setUser(res.admin);
      return res;
    }
    throw new Error(res.message || 'Administrator login failed');
  };

  const register = async (userData) => {
    const res = await api.auth.register(userData);
    if (res.success && res.token) {
      localStorage.setItem('medibridge_token', res.token);
      localStorage.setItem('medibridge_role', res.user.role);
      setToken(res.token);
      setUser(res.user);
      setProfile(res.profile);
      return res;
    }
    throw new Error(res.message || 'Registration failed');
  };

  const logout = () => {
    localStorage.removeItem('medibridge_token');
    localStorage.removeItem('medibridge_role');
    setToken(null);
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    try {
      const res = await api.auth.getMe();
      if (res.success) {
        setUser(res.user);
        setProfile(res.profile);
      }
    } catch (err) {
      console.error('[Auth] Failed to refresh profile:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        token,
        loading,
        login,
        adminLogin,
        register,
        logout,
        refreshProfile,
        isAuthenticated: Boolean(user),
        isPatient: user?.role === 'patient',
        isDoctor: user?.role === 'doctor',
        isInterpreter: user?.role === 'interpreter',
        isAdmin: user?.role === 'admin'
      }}
    >
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
