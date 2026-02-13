import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      console.log('Fetching user...');
      const response = await api.get('/api/auth/me');
      console.log('User fetched:', response.data.user);
      if (response.data && response.data.user) {
        setUser(response.data.user);
      } else {
        console.warn('No user data in response:', response.data);
        logout();
      }
    } catch (error) {
      console.error('Auth error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token, fetchUser]);

  const login = async (email, password) => {
    try {
      console.log('Attempting login for:', email);
      const response = await api.post('/api/auth/login', { email, password });
      console.log('Login response:', response.data);
      
      if (!response.data) {
        throw new Error('No data in login response');
      }

      const { token: newToken, user: userData } = response.data;
      
      if (!newToken || !userData) {
        throw new Error('Missing token or user data in response');
      }

      console.log('Setting token and user...');
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      
      console.log('Login successful');
      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:5000 (default)'
      });
      
      // Provide more specific error messages
      let errorMessage = 'Login failed';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = typeof error.response.data.error === 'string' 
          ? error.response.data.error 
          : error.response.data.error.message || errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
        errorMessage = 'Cannot connect to backend server. Please check your REACT_APP_API_URL environment variable in Vercel.';
      }
      
      return {
        success: false,
        message: errorMessage
      };
    }
  };


  const value = {
    user,
    token,
    login,
    logout,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
