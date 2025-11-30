"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserResponse, getCurrentUser } from '@/lib/api';

// Define the shape of our authentication context
interface AuthContextType {
  user: UserResponse | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  isLoading: boolean;
}

// Create the context with undefined as initial value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component that wraps the app and provides auth state
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('access_token');
    if (storedToken) {
      setToken(storedToken);
      // Fetch user data with the stored token
      getCurrentUser(storedToken)
        .then((userData) => {
          setUser(userData);
        })
        .catch((error) => {
          console.error('Failed to fetch user data:', error);
          // Clear invalid token
          localStorage.removeItem('access_token');
          setToken(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  // Login function - saves token and fetches user data
  const login = async (newToken: string) => {
    setToken(newToken);
    localStorage.setItem('access_token', newToken);
    
    try {
      const userData = await getCurrentUser(newToken);
      setUser(userData);
    } catch (error) {
      console.error('Failed to fetch user data after login:', error);
      // Clear token if user fetch fails
      logout();
    }
  };

  // Logout function - clears token and user data
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('access_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

