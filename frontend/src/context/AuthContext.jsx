import React, { createContext, useEffect, useState } from 'react';
import api from '../api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  });

  useEffect(() => {
    if (token) localStorage.setItem('token', token); else localStorage.removeItem('token');
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user)); else localStorage.removeItem('user');
  }, [user]);

  const loginWithToken = async (t) => {
    setToken(t);
    // optionally fetch profile from backend; current backend returns user on login/signup so frontend sets user there
  };

  const logout = () => {
    setToken('');
    setUser(null);
  };

  const value = { token, setToken, user, setUser, loginWithToken, logout, api };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
