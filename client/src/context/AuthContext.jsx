import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { apiClient, setAccessToken } from '../api/axiosInstance.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isServerWaking, setIsServerWaking] = useState(false);

  // Silent session restore on mount via refresh endpoint
  const bootstrapAuth = useCallback(async () => {
    setIsLoading(true);
    const wakingTimer = setTimeout(() => {
      setIsServerWaking(true);
    }, 2500);

    try {
      const { data } = await apiClient.post('/auth/refresh');
      if (data?.data?.accessToken) {
        setAccessToken(data.data.accessToken);
        setUser(data.data.user);
      }
    } catch (err) {
      // Expected if no refresh token cookie is present
      setAccessToken(null);
      setUser(null);
    } finally {
      clearTimeout(wakingTimer);
      setIsServerWaking(false);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrapAuth();

    const handleSessionExpired = () => {
      setUser(null);
      setAccessToken(null);
      toast.error('Session expired. Please log in again.');
    };

    window.addEventListener('auth:session-expired', handleSessionExpired);
    return () => {
      window.removeEventListener('auth:session-expired', handleSessionExpired);
    };
  }, [bootstrapAuth]);

  const login = async (email, password) => {
    // Clear any previous session state before authenticating
    setUser(null);
    setAccessToken(null);
    sessionStorage.clear();

    const { data } = await apiClient.post('/auth/login', { email, password });
    setAccessToken(data.data.accessToken);
    setUser(data.data.user);
    toast.success(`Welcome back, ${data.data.user.name.split(' ')[0]}!`);
    return data.data.user;
  };

  const register = async (registerData) => {
    // Clear any previous session state before authenticating
    setUser(null);
    setAccessToken(null);
    sessionStorage.clear();

    const { data } = await apiClient.post('/auth/register', registerData);
    setAccessToken(data.data.accessToken);
    setUser(data.data.user);
    toast.success(`Welcome to FinTrack, ${data.data.user.name.split(' ')[0]}!`);
    return data.data.user;
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (err) {
      // Ignore network errors on logout
    } finally {
      setAccessToken(null);
      setUser(null);
      sessionStorage.clear();
      toast.success('Logged out successfully');
    }
  };

  const updateUser = (updatedUser) => {
    setUser((prev) => ({ ...prev, ...updatedUser }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isServerWaking,
        login,
        register,
        logout,
        updateUser,
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

