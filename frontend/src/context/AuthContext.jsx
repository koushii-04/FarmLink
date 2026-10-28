import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('farmlink_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('farmlink_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      if (token) {
        try {
          const res = await authApi.getMe();
          setUser(res.data);
          localStorage.setItem('farmlink_user', JSON.stringify(res.data));
        } catch (err) {
          console.warn('Session expired or invalid, logging out.');
          logout();
        }
      }
      setLoading(false);
    };
    verifyUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    const { access_token, user: loggedUser } = res.data;
    localStorage.setItem('farmlink_token', access_token);
    localStorage.setItem('farmlink_user', JSON.stringify(loggedUser));
    setToken(access_token);
    setUser(loggedUser);
    return loggedUser;
  };

  const signup = async (formData) => {
    const res = await authApi.signup(formData);
    const { access_token, user: newUser } = res.data;
    localStorage.setItem('farmlink_token', access_token);
    localStorage.setItem('farmlink_user', JSON.stringify(newUser));
    setToken(access_token);
    setUser(newUser);
    return newUser;
  };

  const logout = () => {
    localStorage.removeItem('farmlink_token');
    localStorage.removeItem('farmlink_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
        isFarmer: user?.role === 'farmer',
        isBuyer: user?.role === 'buyer',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
