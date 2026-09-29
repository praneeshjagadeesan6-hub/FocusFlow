import { createContext, useContext, useState } from 'react';
import axiosInstance from '../api/axiosInstance';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    const res = await axiosInstance.post('/auth/login', { email, password });
    sessionStorage.setItem('focusflow_token', res.data.token);
    setUser(res.data);
    return res.data;
  };

  const register = async (name, email, password, role = 'student') => {
    const res = await axiosInstance.post('/auth/register', { name, email, password, role });
    sessionStorage.setItem('focusflow_token', res.data.token);
    setUser(res.data);
    return res.data;
  };

  const logout = () => {
    sessionStorage.removeItem('focusflow_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
